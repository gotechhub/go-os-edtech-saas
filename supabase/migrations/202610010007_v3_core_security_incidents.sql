begin;

create schema v3_security;

create table v3_security.signals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references v3_platform.tenants(id) on delete restrict,
  source text not null check (source ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  source_event_id text not null check (length(trim(source_event_id)) between 3 and 180),
  signal_type text not null check (signal_type ~ '^[a-z][a-z0-9_.-]{2,119}$'),
  severity text not null check (severity in ('low','medium','high','critical')),
  summary_code text not null check (summary_code ~ '^[A-Z][A-Z0-9_]{2,119}$'),
  evidence_digest text check (evidence_digest is null or evidence_digest ~ '^sha256:[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (source, source_event_id)
);

create table v3_security.incidents (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references v3_security.signals(id) on delete restrict,
  tenant_id uuid references v3_platform.tenants(id) on delete restrict,
  title_code text not null check (title_code ~ '^[A-Z][A-Z0-9_]{2,119}$'),
  severity text not null check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','triaged','contained','recovering','closed')),
  opened_by uuid not null references v3_core.operators(user_id) on delete restrict,
  opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  check ((status='closed' and closed_at is not null) or status<>'closed')
);

create table v3_security.incident_evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references v3_security.incidents(id) on delete restrict,
  evidence_type text not null check (evidence_type in ('log','audit_export','provider_event','forensic_snapshot','timeline')),
  evidence_reference text not null check (length(trim(evidence_reference)) between 3 and 240),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  captured_by uuid not null references v3_core.operators(user_id) on delete restrict,
  captured_at timestamptz not null default now(),
  unique (incident_id, evidence_reference, sha256)
);

create table v3_security.incident_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references v3_security.incidents(id) on delete restrict,
  runbook_step text not null check (runbook_step in ('triage','contain','eradicate','recover','close')),
  outcome_code text not null check (outcome_code ~ '^[A-Z][A-Z0-9_]{2,119}$'),
  actor_id uuid not null references v3_core.operators(user_id) on delete restrict,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table v3_security.revocation_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references v3_platform.tenants(id) on delete restrict,
  incident_id uuid not null references v3_security.incidents(id) on delete restrict,
  target_type text not null check (target_type in ('user_session','api_key','provider_secret_version')),
  target_reference text not null check (target_reference ~ '^[a-zA-Z0-9:/_.-]{3,240}$'),
  status text not null default 'queued' check (status in ('queued','processing','succeeded','failed')),
  requested_by uuid not null references v3_core.operators(user_id) on delete restrict,
  approval_request_id uuid not null references v3_core.privileged_action_requests(id) on delete restrict,
  idempotency_key text not null check (length(trim(idempotency_key)) between 8 and 120),
  correlation_id uuid not null,
  locked_by text,
  lease_expires_at timestamptz,
  error_code text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (requested_by, idempotency_key),
  check ((status='processing' and locked_by is not null and lease_expires_at is not null) or status<>'processing'),
  check ((status='succeeded' and completed_at is not null) or status<>'succeeded')
);

create index security_incidents_status_idx on v3_security.incidents(status,severity,opened_at desc);
create index security_revocations_claim_idx on v3_security.revocation_requests(status,lease_expires_at,requested_at);

create function v3_audit.reject_event_mutation() returns trigger
language plpgsql set search_path='' as $$
begin
  raise exception 'AUDIT_EVENTS_APPEND_ONLY' using errcode='55000';
end;
$$;
create trigger audit_events_append_only before update or delete on v3_audit.events
  for each row execute function v3_audit.reject_event_mutation();

create function public.v3_security_record_signal(
  target_tenant uuid,
  signal_source text,
  signal_source_event_id text,
  target_signal_type text,
  target_severity text,
  target_summary_code text,
  target_evidence_digest text,
  target_occurred_at timestamptz
) returns uuid
language plpgsql security definer set search_path='' as $$
declare signal_id uuid;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if target_tenant is not null and not exists(select 1 from v3_platform.tenants where id=target_tenant) then
    raise exception 'SIGNAL_TENANT_NOT_FOUND' using errcode='P0002';
  end if;
  insert into v3_security.signals(tenant_id,source,source_event_id,signal_type,severity,summary_code,evidence_digest,occurred_at)
    values(target_tenant,signal_source,trim(signal_source_event_id),target_signal_type,target_severity,target_summary_code,target_evidence_digest,target_occurred_at)
    on conflict(source,source_event_id) do update set source_event_id=excluded.source_event_id
    returning id into signal_id;
  return signal_id;
end;
$$;

create function public.v3_core_open_security_incident(
  target_signal uuid,
  target_title_code text,
  target_severity text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare signal_row v3_security.signals; incident_id uuid;
begin
  if not v3_core.has_permission('core.security.manage') then raise exception 'CORE_SECURITY_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  select * into signal_row from v3_security.signals where id=target_signal;
  if signal_row.id is null then raise exception 'SECURITY_SIGNAL_NOT_FOUND' using errcode='P0002'; end if;
  select id into incident_id from v3_security.incidents where signal_id=target_signal;
  if incident_id is not null then return incident_id; end if;
  insert into v3_security.incidents(signal_id,tenant_id,title_code,severity,opened_by)
    values(signal_row.id,signal_row.tenant_id,target_title_code,target_severity,(select auth.uid())) returning id into incident_id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id)
    values(signal_row.tenant_id,(select auth.uid()),'os_core',incident_id,'core.security_incident.opened','security_incident',incident_id::text);
  return incident_id;
end;
$$;

create function public.v3_core_add_incident_evidence(
  target_incident uuid,
  target_evidence_type text,
  target_evidence_reference text,
  target_sha256 text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare evidence_id uuid; incident_tenant uuid;
begin
  if not v3_core.has_permission('core.security.manage') then raise exception 'CORE_SECURITY_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  select tenant_id into incident_tenant from v3_security.incidents where id=target_incident and status<>'closed';
  if not found then raise exception 'OPEN_SECURITY_INCIDENT_REQUIRED' using errcode='55000'; end if;
  insert into v3_security.incident_evidence(incident_id,evidence_type,evidence_reference,sha256,captured_by)
    values(target_incident,target_evidence_type,trim(target_evidence_reference),lower(target_sha256),(select auth.uid()))
    on conflict(incident_id,evidence_reference,sha256) do update set evidence_reference=excluded.evidence_reference
    returning id into evidence_id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id)
    values(incident_tenant,(select auth.uid()),'os_core',target_incident,'core.security_incident.evidence_added','incident_evidence',evidence_id::text);
  return evidence_id;
end;
$$;

create function public.v3_core_record_incident_action(
  target_incident uuid,
  target_runbook_step text,
  target_outcome_code text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare incident_row v3_security.incidents; action_id uuid; next_status text; action_correlation uuid:=gen_random_uuid();
begin
  if not v3_core.has_permission('core.security.manage') then raise exception 'CORE_SECURITY_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  select * into incident_row from v3_security.incidents where id=target_incident for update;
  if incident_row.id is null or incident_row.status='closed' then raise exception 'ACTIVE_SECURITY_INCIDENT_REQUIRED' using errcode='55000'; end if;
  next_status:=case target_runbook_step when 'triage' then 'triaged' when 'contain' then 'contained' when 'eradicate' then 'contained' when 'recover' then 'recovering' when 'close' then 'closed' else null end;
  if next_status is null
    or (target_runbook_step='triage' and incident_row.status<>'open')
    or (target_runbook_step='contain' and incident_row.status not in ('open','triaged'))
    or (target_runbook_step='eradicate' and incident_row.status<>'contained')
    or (target_runbook_step='recover' and incident_row.status<>'contained')
    or (target_runbook_step='close' and incident_row.status<>'recovering') then
    raise exception 'INCIDENT_RUNBOOK_TRANSITION_INVALID' using errcode='55000';
  end if;
  insert into v3_security.incident_actions(incident_id,runbook_step,outcome_code,actor_id,correlation_id)
    values(target_incident,target_runbook_step,target_outcome_code,(select auth.uid()),action_correlation) returning id into action_id;
  update v3_security.incidents set status=next_status,updated_at=now(),closed_at=case when next_status='closed' then now() else null end where id=target_incident;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id)
    values(incident_row.tenant_id,(select auth.uid()),'os_core',action_correlation,'core.security_incident.'||target_runbook_step,'security_incident',target_incident::text);
  return action_id;
end;
$$;

create function public.v3_core_request_revocation(
  target_incident uuid,
  target_tenant uuid,
  target_type text,
  target_reference text,
  approval_request uuid,
  request_key text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare required_permission text; incident_row v3_security.incidents; request_id uuid; existing_incident uuid; existing_type text; existing_reference text; request_correlation uuid;
begin
  required_permission:=case when target_type='user_session' then 'core.sessions.revoke' else 'core.security.manage' end;
  if not v3_core.has_permission(required_permission) then raise exception 'CORE_REVOCATION_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  select r.id,r.incident_id,r.target_type,r.target_reference into request_id,existing_incident,existing_type,existing_reference
    from v3_security.revocation_requests r
    where r.requested_by=(select auth.uid()) and r.idempotency_key=trim(request_key);
  if request_id is not null then
    if existing_incident<>target_incident or existing_type<>target_type or existing_reference<>target_reference then
      raise exception 'CORE_REVOCATION_IDEMPOTENCY_SCOPE_MISMATCH' using errcode='22023';
    end if;
    return request_id;
  end if;
  select * into incident_row from v3_security.incidents where id=target_incident and status<>'closed';
  if incident_row.id is null or incident_row.tenant_id is distinct from target_tenant then raise exception 'CORE_REVOCATION_INCIDENT_SCOPE_MISMATCH' using errcode='42501'; end if;
  if not exists(select 1 from v3_core.privileged_action_requests r where r.id=approval_request and r.action_permission=required_permission
    and r.object_type=target_type and r.object_id=target_reference) then raise exception 'CORE_REVOCATION_APPROVAL_SCOPE_MISMATCH' using errcode='42501'; end if;
  request_correlation:=public.v3_core_consume_privileged_action(approval_request);
  insert into v3_security.revocation_requests(tenant_id,incident_id,target_type,target_reference,requested_by,approval_request_id,idempotency_key,correlation_id)
    values(target_tenant,target_incident,target_type,target_reference,(select auth.uid()),approval_request,trim(request_key),request_correlation)
    returning id into request_id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id)
    values(target_tenant,(select auth.uid()),'os_core',request_correlation,'core.revocation.requested','revocation_request',request_id::text);
  return request_id;
end;
$$;

create function public.v3_security_claim_revocation(worker_id text,lease_seconds integer default 120)
returns table(revocation_id uuid,tenant_id uuid,incident_id uuid,target_type text,target_reference text)
language plpgsql security definer set search_path='' as $$
declare claimed v3_security.revocation_requests;
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if length(trim(worker_id))<3 or lease_seconds not between 30 and 600 then raise exception 'WORKER_LEASE_INVALID' using errcode='22023'; end if;
  select * into claimed from v3_security.revocation_requests r
    where r.status='queued' or (r.status in ('processing','failed') and coalesce(r.lease_expires_at,'-infinity'::timestamptz)<=now())
    order by r.requested_at for update skip locked limit 1;
  if claimed.id is null then return; end if;
  update v3_security.revocation_requests set status='processing',locked_by=worker_id,lease_expires_at=now()+make_interval(secs=>lease_seconds),error_code=null where id=claimed.id;
  return query select claimed.id,claimed.tenant_id,claimed.incident_id,claimed.target_type,claimed.target_reference;
end;
$$;

create function public.v3_security_finish_revocation(target_revocation uuid,worker_id text,outcome text,outcome_code text default null) returns void
language plpgsql security definer set search_path='' as $$
declare request_row v3_security.revocation_requests;
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if outcome not in ('succeeded','failed') then raise exception 'REVOCATION_OUTCOME_INVALID' using errcode='22023'; end if;
  select * into request_row from v3_security.revocation_requests where id=target_revocation for update;
  if request_row.id is null or request_row.status<>'processing' or request_row.locked_by<>worker_id or request_row.lease_expires_at<now() then raise exception 'REVOCATION_LEASE_INVALID' using errcode='55000'; end if;
  update v3_security.revocation_requests set status=outcome,locked_by=null,lease_expires_at=null,error_code=outcome_code,
    completed_at=case when outcome='succeeded' then now() else null end where id=target_revocation;
  insert into v3_audit.events(tenant_id,control_plane,correlation_id,action,object_type,object_id,reason)
    values(request_row.tenant_id,'system',request_row.correlation_id,'core.revocation.'||outcome,'revocation_request',request_row.id::text,outcome_code);
end;
$$;

create function public.v3_core_security_overview()
returns table(incident_id uuid,tenant_id uuid,title_code text,severity text,incident_status text,signal_type text,summary_code text,evidence_count bigint,action_count bigint,opened_at timestamptz,updated_at timestamptz,observed_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not v3_core.has_permission('core.audit.read') then raise exception 'CORE_AUDIT_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  return query select i.id,i.tenant_id,i.title_code,i.severity,i.status,s.signal_type,s.summary_code,
    (select count(*) from v3_security.incident_evidence e where e.incident_id=i.id),
    (select count(*) from v3_security.incident_actions a where a.incident_id=i.id),
    i.opened_at,i.updated_at,now()
    from v3_security.incidents i join v3_security.signals s on s.id=i.signal_id order by i.opened_at desc;
end;
$$;

create function public.v3_core_audit_search(target_tenant uuid default null,target_action_prefix text default null,result_limit integer default 100)
returns table(event_id uuid,tenant_id uuid,actor_id uuid,control_plane text,correlation_id uuid,action text,object_type text,object_id text,occurred_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not v3_core.has_permission('core.audit.read') then raise exception 'CORE_AUDIT_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  if result_limit not between 1 and 200 then raise exception 'AUDIT_RESULT_LIMIT_INVALID' using errcode='22023'; end if;
  return query select e.id,e.tenant_id,e.actor_id,e.control_plane,e.correlation_id,e.action,e.object_type,e.object_id,e.occurred_at
    from v3_audit.events e where (target_tenant is null or e.tenant_id=target_tenant)
      and (target_action_prefix is null or e.action like target_action_prefix||'%')
    order by e.occurred_at desc limit result_limit;
end;
$$;

alter table v3_security.signals enable row level security;
alter table v3_security.incidents enable row level security;
alter table v3_security.incident_evidence enable row level security;
alter table v3_security.incident_actions enable row level security;
alter table v3_security.revocation_requests enable row level security;
revoke all on schema v3_security from public,anon,authenticated;
revoke all on all tables in schema v3_security from public,anon,authenticated;
revoke all on function public.v3_core_open_security_incident(uuid,text,text),public.v3_core_add_incident_evidence(uuid,text,text,text),
  public.v3_core_record_incident_action(uuid,text,text),public.v3_core_request_revocation(uuid,uuid,text,text,uuid,text),
  public.v3_core_security_overview(),public.v3_core_audit_search(uuid,text,integer) from public,anon;
grant execute on function public.v3_core_open_security_incident(uuid,text,text),public.v3_core_add_incident_evidence(uuid,text,text,text),
  public.v3_core_record_incident_action(uuid,text,text),public.v3_core_request_revocation(uuid,uuid,text,text,uuid,text),
  public.v3_core_security_overview(),public.v3_core_audit_search(uuid,text,integer) to authenticated;
revoke all on function public.v3_security_record_signal(uuid,text,text,text,text,text,text,timestamptz),
  public.v3_security_claim_revocation(text,integer),public.v3_security_finish_revocation(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.v3_security_record_signal(uuid,text,text,text,text,text,text,timestamptz),
  public.v3_security_claim_revocation(text,integer),public.v3_security_finish_revocation(uuid,text,text,text) to service_role;

comment on schema v3_security is 'Minimized security signals, incidents, evidence hashes and revocation jobs; no raw tokens or document bodies';
comment on function public.v3_core_audit_search(uuid,text,integer) is 'Reason-free bounded privileged audit projection; base audit events remain append-only';

commit;
