-- One-time SCORM launch tickets for a separate player origin; plaintext ticket is never stored.
begin;

alter table v3_golms.attempts
  add column scorm_state jsonb not null default '{}'::jsonb
  check (jsonb_typeof(scorm_state)='object' and octet_length(scorm_state::text)<=1048576);

create table v3_golms.launch_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  attempt_id uuid not null,
  publication_id uuid not null references v3_storage.scorm_publications(id) on delete restrict,
  learner_id uuid not null references auth.users(id) on delete restrict,
  ticket_hash text not null check (ticket_hash ~ '^[0-9a-f]{64}$'),
  access_token_hash text check (access_token_hash is null or access_token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'issued' check (status in ('issued','exchanged','revoked','expired')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  exchanged_at timestamptz,
  access_expires_at timestamptz,
  last_accessed_at timestamptz,
  revoked_at timestamptz,
  foreign key (attempt_id, tenant_id) references v3_golms.attempts(id, tenant_id) on delete restrict,
  unique (ticket_hash),
  check (expires_at>issued_at and expires_at<=issued_at+interval '2 minutes'),
  check ((status='exchanged' and exchanged_at is not null and access_token_hash is not null and access_expires_at is not null) or status<>'exchanged'),
  check ((status='revoked' and revoked_at is not null) or status<>'revoked')
);
create index launch_sessions_expiry_idx on v3_golms.launch_sessions(status,expires_at);
alter table v3_golms.launch_sessions enable row level security;

create or replace function public.v3_golms_launch_scorm(enrollment_key uuid, step_key uuid)
returns v3_golms.attempts language plpgsql security definer set search_path = '' as $$
declare enrollment_row v3_golms.enrollments; assignment_row v3_golms.assignments; step_row v3_golms.program_steps; object_row v3_golms.learning_object_versions; program_row v3_golms.program_versions; next_ordinal integer; result v3_golms.attempts;
begin
  select * into enrollment_row from v3_golms.enrollments where id=enrollment_key for update;
  select * into assignment_row from v3_golms.assignments where id=enrollment_row.assignment_id;
  select * into step_row from v3_golms.program_steps where id=step_key;
  select * into object_row from v3_golms.learning_object_versions where id=step_row.learning_object_version_id;
  select * into program_row from v3_golms.program_versions where id=enrollment_row.program_version_id;
  if enrollment_row.learner_id<>(select auth.uid()) or step_row.program_version_id<>enrollment_row.program_version_id or step_row.tenant_id<>enrollment_row.tenant_id then raise exception 'LEARNER_LAUNCH_FORBIDDEN' using errcode='42501'; end if;
  if not v3_platform.has_product_access(enrollment_row.tenant_id,'golms',true) then raise exception 'GOLMS_WRITE_FORBIDDEN' using errcode='42501'; end if;
  if enrollment_row.status not in ('available','in_progress','failed') or assignment_row.status<>'assigned' or assignment_row.available_at>now()
    or step_row.kind<>'scorm' or object_row.status<>'published'
    or not exists(select 1 from v3_storage.scorm_publications p where p.learning_object_version_id=object_row.id and p.tenant_id=object_row.tenant_id and p.status='ready')
    then raise exception 'SCORM_NOT_LAUNCHABLE'; end if;
  if program_row.sequential and exists(
    select 1 from v3_golms.program_steps previous
    where previous.program_version_id=step_row.program_version_id and previous.position<step_row.position and previous.required
      and not exists(select 1 from v3_golms.attempts prior_attempt where prior_attempt.enrollment_id=enrollment_row.id
        and prior_attempt.program_step_id=previous.id and prior_attempt.completion_status='complete'
        and (previous.completion_rule='complete' or prior_attempt.success_status='passed'))
  ) then raise exception 'SCORM_PREREQUISITE_INCOMPLETE' using errcode='42501'; end if;
  select * into result from v3_golms.attempts where enrollment_id=enrollment_key and program_step_id=step_key
    and status in ('active','suspended','submitted') order by ordinal desc limit 1 for update;
  if result.id is null then
    select coalesce(max(ordinal),0)+1 into next_ordinal from v3_golms.attempts where enrollment_id=enrollment_key and program_step_id=step_key;
    insert into v3_golms.attempts(tenant_id,enrollment_id,program_step_id,learning_object_version_id,ordinal,status,rule_version)
      values(enrollment_row.tenant_id,enrollment_key,step_key,step_row.learning_object_version_id,next_ordinal,'active','scorm-normalizer-1') returning * into result;
  elsif result.status='suspended' then
    update v3_golms.attempts set status='active',last_event_at=now() where id=result.id returning * into result;
  end if;
  update v3_golms.enrollments set status='in_progress',started_at=coalesce(started_at,now()) where id=enrollment_key;
  return result;
end;
$$;

create function public.v3_golms_issue_scorm_launch(enrollment_key uuid, step_key uuid, launch_ticket_hash text)
returns table(session_id uuid,attempt_id uuid,standard text,expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare attempt_row v3_golms.attempts; publication_row v3_storage.scorm_publications; package_row v3_golms.scorm_packages; new_session uuid:=gen_random_uuid(); expiry timestamptz:=now()+interval '60 seconds';
begin
  if launch_ticket_hash !~ '^[0-9a-f]{64}$' then raise exception 'LAUNCH_TICKET_INVALID' using errcode='22023'; end if;
  attempt_row:=public.v3_golms_launch_scorm(enrollment_key,step_key);
  select * into publication_row from v3_storage.scorm_publications where learning_object_version_id=attempt_row.learning_object_version_id and status='ready';
  select * into package_row from v3_golms.scorm_packages where learning_object_version_id=attempt_row.learning_object_version_id;
  if publication_row.id is null or package_row.learning_object_version_id is null then raise exception 'SCORM_NOT_LAUNCHABLE'; end if;
  update v3_golms.launch_sessions session set status='revoked',revoked_at=now() where session.attempt_id=attempt_row.id and session.status in ('issued','exchanged');
  insert into v3_golms.launch_sessions(id,tenant_id,attempt_id,publication_id,learner_id,ticket_hash,expires_at)
    values(new_session,attempt_row.tenant_id,attempt_row.id,publication_row.id,(select auth.uid()),launch_ticket_hash,expiry);
  insert into v3_audit.events(tenant_id,actor_id,correlation_id,action,object_type,object_id)
    values(attempt_row.tenant_id,(select auth.uid()),new_session,'golms.scorm_launch_issued','attempt',attempt_row.id::text);
  return query select new_session,attempt_row.id,package_row.standard,expiry;
end;
$$;

create function public.v3_golms_exchange_scorm_launch(target_session uuid, launch_ticket_hash text, player_access_hash text)
returns table(tenant_id uuid,attempt_id uuid,launch_path text,standard text,initial_state jsonb,initial_sequence integer,access_expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare session_row v3_golms.launch_sessions; player_expiry timestamptz:=now()+interval '8 hours';
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if player_access_hash !~ '^[0-9a-f]{64}$' then raise exception 'PLAYER_ACCESS_INVALID' using errcode='22023'; end if;
  select * into session_row from v3_golms.launch_sessions where id=target_session for update;
  if session_row.id is null or session_row.status<>'issued' or session_row.expires_at<=now() or session_row.ticket_hash<>launch_ticket_hash then
    raise exception 'LAUNCH_TICKET_INVALID' using errcode='42501';
  end if;
  update v3_golms.launch_sessions set status='exchanged',exchanged_at=now(),access_token_hash=player_access_hash,access_expires_at=player_expiry where id=session_row.id;
  return query select session_row.tenant_id,session_row.attempt_id,substring(p.launch_object_key from length(p.published_prefix)+1),s.standard,a.scorm_state,a.last_sequence,player_expiry
    from v3_storage.scorm_publications p
    join v3_golms.scorm_packages s on s.learning_object_version_id=p.learning_object_version_id and s.tenant_id=p.tenant_id
    join v3_storage.asset_versions v on v.id=p.asset_version_id and v.tenant_id=p.tenant_id
    join v3_golms.attempts a on a.id=session_row.attempt_id and a.tenant_id=session_row.tenant_id
    where p.id=session_row.publication_id and p.status='ready' and v.publication_status='published';
end;
$$;

create function public.v3_golms_get_scorm_player(target_session uuid, player_access_hash text)
returns table(launch_path text,standard text,initial_state jsonb,initial_sequence integer,access_expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare session_row v3_golms.launch_sessions;
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  select * into session_row from v3_golms.launch_sessions where id=target_session for update;
  if session_row.id is null or session_row.status<>'exchanged' or session_row.access_expires_at<=now()
    or session_row.access_token_hash<>player_access_hash then raise exception 'PLAYER_ACCESS_INVALID' using errcode='42501'; end if;
  update v3_golms.launch_sessions set last_accessed_at=now() where id=session_row.id;
  return query select substring(p.launch_object_key from length(p.published_prefix)+1),s.standard,a.scorm_state,a.last_sequence,session_row.access_expires_at
    from v3_storage.scorm_publications p
    join v3_golms.scorm_packages s on s.learning_object_version_id=p.learning_object_version_id and s.tenant_id=p.tenant_id
    join v3_golms.attempts a on a.id=session_row.attempt_id and a.tenant_id=session_row.tenant_id
    where p.id=session_row.publication_id and p.status='ready';
end;
$$;

create function public.v3_golms_resolve_scorm_object(target_session uuid, player_access_hash text, requested_path text)
returns table(bucket_name text,object_key text,standard text,attempt_id uuid,access_expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare session_row v3_golms.launch_sessions;
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if player_access_hash !~ '^[0-9a-f]{64}$' or requested_path is null or requested_path=''
    or requested_path like '/%' or requested_path like '%\%' or requested_path like '%://%'
    or requested_path ~ '(^|/)\.\.?(/|$)' or requested_path like '%//%' then
    raise exception 'PLAYER_OBJECT_PATH_INVALID' using errcode='22023';
  end if;
  select * into session_row from v3_golms.launch_sessions where id=target_session for update;
  if session_row.id is null or session_row.status<>'exchanged' or session_row.access_expires_at<=now()
    or session_row.access_token_hash<>player_access_hash then raise exception 'PLAYER_ACCESS_INVALID' using errcode='42501'; end if;
  update v3_golms.launch_sessions set last_accessed_at=now() where id=session_row.id;
  return query select v.bucket_name,p.published_prefix||requested_path,s.standard,session_row.attempt_id,session_row.access_expires_at
    from v3_storage.scorm_publications p
    join v3_storage.asset_versions v on v.id=p.asset_version_id and v.tenant_id=p.tenant_id
    join v3_golms.scorm_packages s on s.learning_object_version_id=p.learning_object_version_id and s.tenant_id=p.tenant_id
    where p.id=session_row.publication_id and p.status='ready' and v.publication_status='published';
end;
$$;

create function public.v3_golms_record_player_runtime_event(
  target_session uuid, player_access_hash text, event_key text, event_sequence integer, event_kind text, event_occurred_at timestamptz,
  new_completion text default null, new_success text default null, new_progress numeric default null,
  new_score_raw numeric default null, new_score_scaled numeric default null, session_seconds numeric default 0,
  evidence_hash text default null, state_snapshot jsonb default '{}'::jsonb
) returns v3_golms.attempts language plpgsql security definer set search_path = '' as $$
declare session_row v3_golms.launch_sessions; result v3_golms.attempts;
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  select * into session_row from v3_golms.launch_sessions where id=target_session for update;
  if session_row.id is null or session_row.status<>'exchanged' or session_row.access_expires_at<=now()
    or session_row.access_token_hash<>player_access_hash then raise exception 'PLAYER_ACCESS_INVALID' using errcode='42501'; end if;
  if jsonb_typeof(state_snapshot)<>'object' or octet_length(state_snapshot::text)>1048576 then raise exception 'SCORM_STATE_INVALID' using errcode='22023'; end if;
  if exists(select 1 from v3_golms.runtime_events where attempt_id=session_row.attempt_id and idempotency_key=event_key) then
    select * into result from v3_golms.attempts where id=session_row.attempt_id;
    update v3_golms.launch_sessions set last_accessed_at=now() where id=session_row.id;
    return result;
  end if;
  perform set_config('request.jwt.claim.sub',session_row.learner_id::text,true);
  result:=public.v3_golms_record_runtime_event(session_row.attempt_id,event_key,event_sequence,event_kind,event_occurred_at,
    new_completion,new_success,new_progress,new_score_raw,new_score_scaled,session_seconds,evidence_hash);
  update v3_golms.attempts set scorm_state=state_snapshot where id=session_row.attempt_id returning * into result;
  update v3_golms.launch_sessions set last_accessed_at=now() where id=session_row.id;
  return result;
end;
$$;

revoke all on v3_golms.launch_sessions from public,anon,authenticated;
revoke all on function public.v3_golms_issue_scorm_launch(uuid,uuid,text) from public,anon;
grant execute on function public.v3_golms_issue_scorm_launch(uuid,uuid,text) to authenticated;
revoke all on function public.v3_golms_exchange_scorm_launch(uuid,text,text),public.v3_golms_get_scorm_player(uuid,text),public.v3_golms_resolve_scorm_object(uuid,text,text),public.v3_golms_record_player_runtime_event(uuid,text,text,integer,text,timestamptz,text,text,numeric,numeric,numeric,numeric,text,jsonb) from public,anon,authenticated;
grant execute on function public.v3_golms_exchange_scorm_launch(uuid,text,text),public.v3_golms_get_scorm_player(uuid,text),public.v3_golms_resolve_scorm_object(uuid,text,text),public.v3_golms_record_player_runtime_event(uuid,text,text,integer,text,timestamptz,text,text,numeric,numeric,numeric,numeric,text,jsonb) to service_role;

commit;
