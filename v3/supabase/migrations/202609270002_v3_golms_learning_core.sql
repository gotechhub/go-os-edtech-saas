-- GOLMS first vertical slice: content -> immutable program -> assignment -> SCORM evidence -> report.
begin;

create schema if not exists v3_golms;

create table v3_golms.learning_objects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  kind text not null check (kind in ('scorm','video','pdf','link','resource')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, tenant_id)
);

create table v3_golms.learning_object_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  learning_object_id uuid not null,
  version integer not null check (version > 0),
  kind text not null check (kind in ('scorm','video','pdf','link','resource')),
  title text not null check (length(trim(title)) > 0),
  locale text not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','retired','archived')),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (learning_object_id, tenant_id) references v3_golms.learning_objects(id, tenant_id) on delete restrict,
  unique (learning_object_id, version),
  unique (id, tenant_id),
  check ((status = 'published' and published_at is not null and published_by is not null) or status <> 'published')
);

create table v3_golms.scorm_packages (
  learning_object_version_id uuid primary key,
  tenant_id uuid not null,
  asset_version_id uuid not null,
  package_hash text not null check (package_hash ~ '^[0-9a-f]{64}$'),
  standard text not null check (standard in ('scorm_1_2','scorm_2004_3rd','scorm_2004_4th')),
  manifest_identifier text not null,
  launch_path text not null check (launch_path !~ '(^/|(^|/)\.\.(/|$)|^[a-zA-Z]+:)'),
  scan_status text not null default 'pending' check (scan_status in ('pending','clean','infected','failed')),
  validation_status text not null default 'pending' check (validation_status in ('pending','valid','invalid')),
  validated_at timestamptz,
  validator_version text not null,
  file_count integer not null check (file_count > 0),
  expanded_bytes bigint not null check (expanded_bytes > 0),
  foreign key (learning_object_version_id, tenant_id) references v3_golms.learning_object_versions(id, tenant_id) on delete restrict,
  check ((validation_status = 'valid' and validated_at is not null) or validation_status <> 'valid')
);

create table v3_golms.programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, tenant_id)
);

create table v3_golms.program_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  program_id uuid not null,
  version integer not null check (version > 0),
  title text not null check (length(trim(title)) > 0),
  locale text not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','retired','archived')),
  sequential boolean not null default true,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (program_id, tenant_id) references v3_golms.programs(id, tenant_id) on delete restrict,
  unique (program_id, version),
  unique (id, tenant_id),
  check ((status = 'published' and published_at is not null and published_by is not null) or status <> 'published')
);

create table v3_golms.program_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  program_version_id uuid not null,
  position integer not null check (position > 0),
  kind text not null check (kind in ('scorm','video','pdf','link','resource')),
  learning_object_version_id uuid not null,
  required boolean not null default true,
  completion_rule text not null check (completion_rule in ('complete','passed')),
  foreign key (program_version_id, tenant_id) references v3_golms.program_versions(id, tenant_id) on delete restrict,
  foreign key (learning_object_version_id, tenant_id) references v3_golms.learning_object_versions(id, tenant_id) on delete restrict,
  unique (program_version_id, position),
  unique (id, tenant_id)
);

create table v3_golms.assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  program_version_id uuid not null,
  target_kind text not null default 'user' check (target_kind = 'user'),
  target_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'assigned' check (status in ('draft','assigned','cancelled')),
  required boolean not null default true,
  available_at timestamptz not null,
  due_at timestamptz,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  foreign key (program_version_id, tenant_id) references v3_golms.program_versions(id, tenant_id) on delete restrict,
  unique (id, tenant_id),
  check (due_at is null or due_at > available_at)
);

create table v3_golms.enrollments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  assignment_id uuid not null,
  program_version_id uuid not null,
  learner_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'available' check (status in ('available','in_progress','completed','failed','expired','cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  foreign key (assignment_id, tenant_id) references v3_golms.assignments(id, tenant_id) on delete restrict,
  foreign key (program_version_id, tenant_id) references v3_golms.program_versions(id, tenant_id) on delete restrict,
  unique (assignment_id, learner_id),
  unique (id, tenant_id)
);

create table v3_golms.attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  enrollment_id uuid not null,
  program_step_id uuid not null,
  learning_object_version_id uuid not null,
  ordinal integer not null check (ordinal > 0),
  status text not null default 'created' check (status in ('created','active','suspended','submitted','completed','failed','invalidated')),
  completion_status text not null default 'unknown' check (completion_status in ('unknown','incomplete','complete')),
  success_status text not null default 'unknown' check (success_status in ('unknown','passed','failed')),
  progress numeric check (progress between 0 and 1),
  score_raw numeric,
  score_scaled numeric check (score_scaled between -1 and 1),
  total_duration_seconds numeric not null default 0 check (total_duration_seconds >= 0),
  rule_version text not null,
  last_sequence integer not null default 0 check (last_sequence >= 0),
  launched_at timestamptz not null default now(),
  last_event_at timestamptz not null default now(),
  completed_at timestamptz,
  foreign key (enrollment_id, tenant_id) references v3_golms.enrollments(id, tenant_id) on delete restrict,
  foreign key (program_step_id, tenant_id) references v3_golms.program_steps(id, tenant_id) on delete restrict,
  foreign key (learning_object_version_id, tenant_id) references v3_golms.learning_object_versions(id, tenant_id) on delete restrict,
  unique (enrollment_id, program_step_id, ordinal),
  unique (id, tenant_id)
);

create table v3_golms.runtime_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  attempt_id uuid not null,
  idempotency_key text not null,
  sequence integer not null check (sequence > 0),
  kind text not null check (kind in ('initialized','progressed','suspended','submitted','terminated')),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  completion_status text not null check (completion_status in ('unknown','incomplete','complete')),
  success_status text not null check (success_status in ('unknown','passed','failed')),
  progress numeric check (progress between 0 and 1),
  score_raw numeric,
  score_scaled numeric check (score_scaled between -1 and 1),
  session_duration_seconds numeric not null default 0 check (session_duration_seconds >= 0),
  raw_evidence_hash text not null check (raw_evidence_hash ~ '^[0-9a-f]{64}$'),
  rule_version text not null,
  foreign key (attempt_id, tenant_id) references v3_golms.attempts(id, tenant_id) on delete restrict,
  unique (attempt_id, idempotency_key),
  unique (attempt_id, sequence)
);

create index golms_assignments_target_idx on v3_golms.assignments(tenant_id, target_id, status);
create index golms_enrollments_learner_idx on v3_golms.enrollments(tenant_id, learner_id, status);
create index golms_attempts_enrollment_idx on v3_golms.attempts(enrollment_id, program_step_id, ordinal desc);
create index golms_runtime_events_attempt_idx on v3_golms.runtime_events(attempt_id, sequence);

create function v3_golms.prevent_published_version_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.status = 'published' and new is distinct from old then
    raise exception 'PUBLISHED_VERSION_IMMUTABLE' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger learning_version_immutable before update on v3_golms.learning_object_versions
for each row execute function v3_golms.prevent_published_version_mutation();
create trigger program_version_immutable before update on v3_golms.program_versions
for each row execute function v3_golms.prevent_published_version_mutation();

create function public.v3_golms_create_scorm_draft(target_tenant uuid, course_title text, course_locale text, course_hash text)
returns v3_golms.learning_object_versions language plpgsql security definer set search_path = '' as $$
declare object_id uuid; result v3_golms.learning_object_versions;
begin
  if not v3_platform.has_permission(target_tenant,'golms.manage') or not v3_platform.has_product_access(target_tenant,'golms',true) then
    raise exception 'GOLMS_MANAGE_FORBIDDEN' using errcode = '42501';
  end if;
  if length(trim(course_title)) = 0 or course_hash !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_COURSE_INPUT'; end if;
  insert into v3_golms.learning_objects(tenant_id,kind,created_by) values(target_tenant,'scorm',(select auth.uid())) returning id into object_id;
  insert into v3_golms.learning_object_versions(tenant_id,learning_object_id,version,kind,title,locale,content_hash)
    values(target_tenant,object_id,1,'scorm',course_title,course_locale,course_hash) returning * into result;
  return result;
end;
$$;

create function public.v3_golms_publish_learning_object(version_id uuid)
returns v3_golms.learning_object_versions language plpgsql security definer set search_path = '' as $$
declare result v3_golms.learning_object_versions;
begin
  select * into result from v3_golms.learning_object_versions where id = version_id for update;
  if result.id is null then raise exception 'LEARNING_OBJECT_VERSION_NOT_FOUND'; end if;
  if not v3_platform.has_permission(result.tenant_id,'golms.manage') or not v3_platform.has_product_access(result.tenant_id,'golms',true) then
    raise exception 'GOLMS_MANAGE_FORBIDDEN' using errcode = '42501';
  end if;
  if result.status not in ('draft','in_review','approved') then raise exception 'CONTENT_NOT_PUBLISHABLE'; end if;
  if not exists(select 1 from v3_golms.scorm_packages p where p.learning_object_version_id=result.id and p.tenant_id=result.tenant_id and p.scan_status='clean' and p.validation_status='valid' and p.validated_at is not null) then
    raise exception 'CLEAN_VALIDATED_SCORM_REQUIRED';
  end if;
  update v3_golms.learning_object_versions set status='published',published_at=now(),published_by=(select auth.uid()) where id=result.id returning * into result;
  return result;
end;
$$;

create function public.v3_golms_create_program_draft(target_tenant uuid, program_title text, program_locale text, is_sequential boolean default true)
returns v3_golms.program_versions language plpgsql security definer set search_path = '' as $$
declare root_id uuid; result v3_golms.program_versions;
begin
  if not v3_platform.has_permission(target_tenant,'golms.manage') or not v3_platform.has_product_access(target_tenant,'golms',true) then raise exception 'GOLMS_MANAGE_FORBIDDEN' using errcode='42501'; end if;
  insert into v3_golms.programs(tenant_id,created_by) values(target_tenant,(select auth.uid())) returning id into root_id;
  insert into v3_golms.program_versions(tenant_id,program_id,version,title,locale,sequential) values(target_tenant,root_id,1,program_title,program_locale,is_sequential) returning * into result;
  return result;
end;
$$;

create function public.v3_golms_add_program_step(version_id uuid, object_version_id uuid, step_position integer, is_required boolean, step_rule text)
returns v3_golms.program_steps language plpgsql security definer set search_path = '' as $$
declare program_row v3_golms.program_versions; object_row v3_golms.learning_object_versions; result v3_golms.program_steps;
begin
  select * into program_row from v3_golms.program_versions where id=version_id;
  select * into object_row from v3_golms.learning_object_versions where id=object_version_id;
  if program_row.id is null or object_row.id is null or program_row.tenant_id<>object_row.tenant_id then raise exception 'PROGRAM_STEP_TENANT_MISMATCH'; end if;
  if program_row.status='published' then raise exception 'PUBLISHED_PROGRAM_IMMUTABLE'; end if;
  if object_row.status<>'published' then raise exception 'STEP_CONTENT_NOT_PUBLISHED'; end if;
  if not v3_platform.has_permission(program_row.tenant_id,'golms.manage') or not v3_platform.has_product_access(program_row.tenant_id,'golms',true) then raise exception 'GOLMS_MANAGE_FORBIDDEN' using errcode='42501'; end if;
  insert into v3_golms.program_steps(tenant_id,program_version_id,position,kind,learning_object_version_id,required,completion_rule)
    values(program_row.tenant_id,version_id,step_position,object_row.kind,object_version_id,is_required,step_rule) returning * into result;
  return result;
end;
$$;

create function public.v3_golms_publish_program(version_id uuid)
returns v3_golms.program_versions language plpgsql security definer set search_path = '' as $$
declare result v3_golms.program_versions; step_count integer; max_position integer;
begin
  select * into result from v3_golms.program_versions where id=version_id for update;
  if result.id is null then raise exception 'PROGRAM_VERSION_NOT_FOUND'; end if;
  if not v3_platform.has_permission(result.tenant_id,'golms.manage') or not v3_platform.has_product_access(result.tenant_id,'golms',true) then raise exception 'GOLMS_MANAGE_FORBIDDEN' using errcode='42501'; end if;
  select count(*),max(position) into step_count,max_position from v3_golms.program_steps where program_version_id=result.id;
  if step_count=0 or max_position<>step_count then raise exception 'PROGRAM_STEPS_NOT_CONTIGUOUS'; end if;
  if exists(select 1 from v3_golms.program_steps s join v3_golms.learning_object_versions v on v.id=s.learning_object_version_id where s.program_version_id=result.id and (v.status<>'published' or v.tenant_id<>result.tenant_id)) then raise exception 'STEP_CONTENT_NOT_PUBLISHED'; end if;
  update v3_golms.program_versions set status='published',published_at=now(),published_by=(select auth.uid()) where id=result.id returning * into result;
  return result;
end;
$$;

create function public.v3_golms_assign_program(version_id uuid, learner_id uuid, is_required boolean, available_at timestamptz, due_at timestamptz default null)
returns v3_golms.enrollments language plpgsql security definer set search_path = '' as $$
declare program_row v3_golms.program_versions; assignment_id uuid; result v3_golms.enrollments;
begin
  select * into program_row from v3_golms.program_versions where id=version_id;
  if program_row.status<>'published' then raise exception 'PUBLISHED_PROGRAM_REQUIRED'; end if;
  if not v3_platform.has_permission(program_row.tenant_id,'golms.manage') or not v3_platform.has_product_access(program_row.tenant_id,'golms',true) then raise exception 'GOLMS_MANAGE_FORBIDDEN' using errcode='42501'; end if;
  if not exists(select 1 from v3_platform.memberships m where m.tenant_id=program_row.tenant_id and m.user_id=learner_id and m.status='active') then raise exception 'ACTIVE_LEARNER_MEMBERSHIP_REQUIRED'; end if;
  insert into v3_golms.assignments(tenant_id,program_version_id,target_id,required,available_at,due_at,assigned_by)
    values(program_row.tenant_id,version_id,learner_id,is_required,available_at,due_at,(select auth.uid())) returning id into assignment_id;
  insert into v3_golms.enrollments(tenant_id,assignment_id,program_version_id,learner_id)
    values(program_row.tenant_id,assignment_id,version_id,learner_id) returning * into result;
  return result;
end;
$$;

create function public.v3_golms_launch_scorm(enrollment_key uuid, step_key uuid)
returns v3_golms.attempts language plpgsql security definer set search_path = '' as $$
declare enrollment_row v3_golms.enrollments; step_row v3_golms.program_steps; object_row v3_golms.learning_object_versions; next_ordinal integer; result v3_golms.attempts;
begin
  select * into enrollment_row from v3_golms.enrollments where id=enrollment_key for update;
  select * into step_row from v3_golms.program_steps where id=step_key;
  select * into object_row from v3_golms.learning_object_versions where id=step_row.learning_object_version_id;
  if enrollment_row.learner_id<>(select auth.uid()) or step_row.program_version_id<>enrollment_row.program_version_id or step_row.tenant_id<>enrollment_row.tenant_id then raise exception 'LEARNER_LAUNCH_FORBIDDEN' using errcode='42501'; end if;
  if not v3_platform.has_product_access(enrollment_row.tenant_id,'golms',true) then raise exception 'GOLMS_WRITE_FORBIDDEN' using errcode='42501'; end if;
  if enrollment_row.status not in ('available','in_progress','failed') or step_row.kind<>'scorm' or object_row.status<>'published' then raise exception 'SCORM_NOT_LAUNCHABLE'; end if;
  select coalesce(max(ordinal),0)+1 into next_ordinal from v3_golms.attempts where enrollment_id=enrollment_key and program_step_id=step_key;
  insert into v3_golms.attempts(tenant_id,enrollment_id,program_step_id,learning_object_version_id,ordinal,status,rule_version)
    values(enrollment_row.tenant_id,enrollment_key,step_key,step_row.learning_object_version_id,next_ordinal,'active','scorm-normalizer-1') returning * into result;
  update v3_golms.enrollments set status='in_progress',started_at=coalesce(started_at,now()) where id=enrollment_key;
  return result;
end;
$$;

create function public.v3_golms_record_runtime_event(
  attempt_key uuid, event_key text, event_sequence integer, event_kind text, event_occurred_at timestamptz,
  new_completion text default null, new_success text default null, new_progress numeric default null,
  new_score_raw numeric default null, new_score_scaled numeric default null, session_seconds numeric default 0,
  evidence_hash text default null
) returns v3_golms.attempts language plpgsql security definer set search_path = '' as $$
declare attempt_row v3_golms.attempts; enrollment_row v3_golms.enrollments; terminal boolean;
begin
  select * into attempt_row from v3_golms.attempts where id=attempt_key for update;
  select * into enrollment_row from v3_golms.enrollments where id=attempt_row.enrollment_id;
  if enrollment_row.learner_id<>(select auth.uid()) then raise exception 'ATTEMPT_WRITE_FORBIDDEN' using errcode='42501'; end if;
  if not v3_platform.has_product_access(attempt_row.tenant_id,'golms',true) then raise exception 'GOLMS_WRITE_FORBIDDEN' using errcode='42501'; end if;
  if exists(select 1 from v3_golms.runtime_events where attempt_id=attempt_key and idempotency_key=event_key) then return attempt_row; end if;
  if event_sequence<>attempt_row.last_sequence+1 then raise exception 'RUNTIME_EVENT_OUT_OF_ORDER'; end if;
  if attempt_row.status not in ('active','suspended','submitted') or event_occurred_at<attempt_row.last_event_at then raise exception 'ATTEMPT_EVENT_INVALID'; end if;
  if event_kind not in ('initialized','progressed','suspended','submitted','terminated') or evidence_hash !~ '^[0-9a-f]{64}$' or session_seconds<0 then raise exception 'RUNTIME_EVIDENCE_INVALID'; end if;
  terminal := event_kind='terminated';
  insert into v3_golms.runtime_events(tenant_id,attempt_id,idempotency_key,sequence,kind,occurred_at,completion_status,success_status,progress,score_raw,score_scaled,session_duration_seconds,raw_evidence_hash,rule_version)
    values(attempt_row.tenant_id,attempt_key,event_key,event_sequence,event_kind,event_occurred_at,coalesce(new_completion,attempt_row.completion_status),coalesce(new_success,attempt_row.success_status),coalesce(new_progress,attempt_row.progress),coalesce(new_score_raw,attempt_row.score_raw),coalesce(new_score_scaled,attempt_row.score_scaled),session_seconds,evidence_hash,attempt_row.rule_version);
  update v3_golms.attempts set
    status=case when terminal and coalesce(new_success,success_status)='failed' then 'failed' when terminal then 'completed' when event_kind='suspended' then 'suspended' when event_kind='submitted' then 'submitted' else 'active' end,
    completion_status=coalesce(new_completion,completion_status), success_status=coalesce(new_success,success_status), progress=coalesce(new_progress,progress),
    score_raw=coalesce(new_score_raw,score_raw), score_scaled=coalesce(new_score_scaled,score_scaled), total_duration_seconds=total_duration_seconds+session_seconds,
    last_sequence=event_sequence,last_event_at=event_occurred_at,completed_at=case when terminal then event_occurred_at else null end
    where id=attempt_key returning * into attempt_row;
  if terminal then
    update v3_golms.enrollments e set
      status=case when not exists (
        select 1 from v3_golms.program_steps s
        where s.program_version_id=e.program_version_id and s.required and not exists (
          select 1 from v3_golms.attempts a
          where a.enrollment_id=e.id and a.program_step_id=s.id and a.completion_status='complete'
            and (s.completion_rule='complete' or a.success_status='passed')
        )
      ) then 'completed' else 'in_progress' end,
      completed_at=case when not exists (
        select 1 from v3_golms.program_steps s
        where s.program_version_id=e.program_version_id and s.required and not exists (
          select 1 from v3_golms.attempts a
          where a.enrollment_id=e.id and a.program_step_id=s.id and a.completion_status='complete'
            and (s.completion_rule='complete' or a.success_status='passed')
        )
      ) then event_occurred_at else null end
    where e.id=attempt_row.enrollment_id;
  end if;
  return attempt_row;
end;
$$;

create function public.v3_golms_program_report(version_id uuid)
returns table(learner_id uuid,enrollment_status text,started_at timestamptz,completed_at timestamptz,attempt_count bigint,best_score numeric)
language plpgsql stable security definer set search_path = '' as $$
declare target_tenant uuid;
begin
  select tenant_id into target_tenant from v3_golms.program_versions where id=version_id;
  if target_tenant is null or not v3_platform.has_permission(target_tenant,'golms.report') or not v3_platform.has_product_access(target_tenant,'golms',false) then
    raise exception 'GOLMS_REPORT_FORBIDDEN' using errcode='42501';
  end if;
  return query
    select e.learner_id,e.status,e.started_at,e.completed_at,count(a.id),max(a.score_raw)
    from v3_golms.enrollments e left join v3_golms.attempts a on a.enrollment_id=e.id
    where e.program_version_id=version_id and e.tenant_id=target_tenant
    group by e.id,e.learner_id,e.status,e.started_at,e.completed_at
    order by e.learner_id;
end;
$$;

alter table v3_golms.learning_objects enable row level security;
alter table v3_golms.learning_object_versions enable row level security;
alter table v3_golms.scorm_packages enable row level security;
alter table v3_golms.programs enable row level security;
alter table v3_golms.program_versions enable row level security;
alter table v3_golms.program_steps enable row level security;
alter table v3_golms.assignments enable row level security;
alter table v3_golms.enrollments enable row level security;
alter table v3_golms.attempts enable row level security;
alter table v3_golms.runtime_events enable row level security;

create policy golms_objects_read on v3_golms.learning_objects for select to authenticated using (
  v3_platform.has_product_access(tenant_id,'golms',false) and (
    v3_platform.has_permission(tenant_id,'golms.manage') or v3_platform.has_permission(tenant_id,'golms.report') or
    exists(select 1 from v3_golms.learning_object_versions v where v.learning_object_id=learning_objects.id and v.status='published')
  )
);
create policy golms_object_versions_read on v3_golms.learning_object_versions for select to authenticated using (
  v3_platform.has_product_access(tenant_id,'golms',false) and (status='published' or v3_platform.has_permission(tenant_id,'golms.manage') or v3_platform.has_permission(tenant_id,'golms.report'))
);
create policy golms_programs_read on v3_golms.programs for select to authenticated using (
  v3_platform.has_product_access(tenant_id,'golms',false) and (
    v3_platform.has_permission(tenant_id,'golms.manage') or v3_platform.has_permission(tenant_id,'golms.report') or
    exists(select 1 from v3_golms.program_versions v where v.program_id=programs.id and v.status='published')
  )
);
create policy golms_program_versions_read on v3_golms.program_versions for select to authenticated using (
  v3_platform.has_product_access(tenant_id,'golms',false) and (status='published' or v3_platform.has_permission(tenant_id,'golms.manage') or v3_platform.has_permission(tenant_id,'golms.report'))
);
create policy golms_program_steps_read on v3_golms.program_steps for select to authenticated using (
  v3_platform.has_product_access(tenant_id,'golms',false) and (
    v3_platform.has_permission(tenant_id,'golms.manage') or v3_platform.has_permission(tenant_id,'golms.report') or
    exists(select 1 from v3_golms.program_versions v where v.id=program_steps.program_version_id and v.status='published')
  )
);
create policy golms_assignments_read on v3_golms.assignments for select to authenticated using (target_id=(select auth.uid()) or v3_platform.has_permission(tenant_id,'golms.report'));
create policy golms_enrollments_read on v3_golms.enrollments for select to authenticated using (learner_id=(select auth.uid()) or v3_platform.has_permission(tenant_id,'golms.report'));
create policy golms_attempts_read on v3_golms.attempts for select to authenticated using (exists(select 1 from v3_golms.enrollments e where e.id=attempts.enrollment_id and (e.learner_id=(select auth.uid()) or v3_platform.has_permission(e.tenant_id,'golms.report'))));
create policy golms_events_read on v3_golms.runtime_events for select to authenticated using (exists(select 1 from v3_golms.attempts a join v3_golms.enrollments e on e.id=a.enrollment_id where a.id=runtime_events.attempt_id and (e.learner_id=(select auth.uid()) or v3_platform.has_permission(e.tenant_id,'golms.report'))));

revoke all on schema v3_golms from public,anon,authenticated;
grant usage on schema v3_golms to authenticated;
revoke all on all tables in schema v3_golms from public,anon,authenticated;
grant select on v3_golms.learning_objects,v3_golms.learning_object_versions,v3_golms.programs,v3_golms.program_versions,v3_golms.program_steps,v3_golms.assignments,v3_golms.enrollments,v3_golms.attempts,v3_golms.runtime_events to authenticated;
revoke all on function public.v3_golms_create_scorm_draft(uuid,text,text,text),public.v3_golms_publish_learning_object(uuid),public.v3_golms_create_program_draft(uuid,text,text,boolean),public.v3_golms_add_program_step(uuid,uuid,integer,boolean,text),public.v3_golms_publish_program(uuid),public.v3_golms_assign_program(uuid,uuid,boolean,timestamptz,timestamptz),public.v3_golms_launch_scorm(uuid,uuid),public.v3_golms_record_runtime_event(uuid,text,integer,text,timestamptz,text,text,numeric,numeric,numeric,numeric,text),public.v3_golms_program_report(uuid) from public,anon;
grant execute on function public.v3_golms_create_scorm_draft(uuid,text,text,text),public.v3_golms_publish_learning_object(uuid),public.v3_golms_create_program_draft(uuid,text,text,boolean),public.v3_golms_add_program_step(uuid,uuid,integer,boolean,text),public.v3_golms_publish_program(uuid),public.v3_golms_assign_program(uuid,uuid,boolean,timestamptz,timestamptz),public.v3_golms_launch_scorm(uuid,uuid),public.v3_golms_record_runtime_event(uuid,text,integer,text,timestamptz,text,text,numeric,numeric,numeric,numeric,text),public.v3_golms_program_report(uuid) to authenticated;

commit;
