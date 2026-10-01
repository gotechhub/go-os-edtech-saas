begin;

create table v3_core.job_retry_operations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references v3_storage.processing_jobs(id) on delete restrict,
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  previous_status text not null,
  previous_attempt_count integer not null check (previous_attempt_count >= 0),
  previous_error_code text,
  requested_by uuid not null references v3_core.operators(user_id) on delete restrict,
  approval_request_id uuid not null references v3_core.privileged_action_requests(id) on delete restrict,
  idempotency_key text not null check (length(trim(idempotency_key)) between 8 and 120),
  correlation_id uuid not null,
  reason text not null check (length(trim(reason)) >= 12),
  created_at timestamptz not null default now(),
  unique (requested_by, idempotency_key)
);

create index core_job_retry_operations_job_idx
  on v3_core.job_retry_operations(job_id, created_at desc);

create function public.v3_core_job_overview()
returns table (
  job_id uuid,
  tenant_id uuid,
  job_type text,
  job_status text,
  attempt_count integer,
  lease_state text,
  error_code text,
  created_at timestamptz,
  updated_at timestamptz,
  observed_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not v3_core.has_permission('core.read') then
    raise exception 'CORE_JOB_READ_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    j.id,
    j.tenant_id,
    j.job_type,
    j.status,
    j.attempt_count,
    case
      when j.status = 'processing' and j.lease_expires_at <= now() then 'expired'
      when j.status = 'processing' then 'active'
      else 'none'
    end,
    j.error_code,
    j.created_at,
    j.updated_at,
    now()
  from v3_storage.processing_jobs j
  order by
    case when j.status = 'failed' or (j.status = 'processing' and j.lease_expires_at <= now()) then 0 else 1 end,
    j.updated_at desc;
end;
$$;

create function public.v3_core_retry_processing_job(
  target_job uuid,
  retry_reason text,
  approval_request uuid,
  request_key text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  job_row v3_storage.processing_jobs;
  operation_id uuid;
  operation_job_id uuid;
  request_correlation uuid;
begin
  if not v3_core.has_permission('core.jobs.manage') then
    raise exception 'CORE_JOB_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;
  if length(trim(retry_reason)) < 12 or length(trim(request_key)) not between 8 and 120 then
    raise exception 'CORE_JOB_RETRY_INPUT_INVALID' using errcode = '22023';
  end if;

  select id, job_id into operation_id, operation_job_id
  from v3_core.job_retry_operations
  where requested_by = (select auth.uid()) and idempotency_key = trim(request_key);
  if operation_id is not null then
    if operation_job_id <> target_job then
      raise exception 'CORE_JOB_IDEMPOTENCY_SCOPE_MISMATCH' using errcode = '22023';
    end if;
    return operation_id;
  end if;

  select * into job_row from v3_storage.processing_jobs where id = target_job for update;
  if job_row.id is null then
    raise exception 'CORE_JOB_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not (
    job_row.status in ('failed','quarantined')
    or (job_row.status = 'processing' and job_row.lease_expires_at <= now())
  ) then
    raise exception 'CORE_JOB_NOT_RETRYABLE' using errcode = '55000';
  end if;
  if not exists (
    select 1 from v3_core.privileged_action_requests r
    where r.id = approval_request
      and r.action_permission = 'core.jobs.manage'
      and r.object_type = 'processing_job'
      and r.object_id = target_job::text
  ) then
    raise exception 'CORE_JOB_APPROVAL_SCOPE_MISMATCH' using errcode = '42501';
  end if;

  request_correlation := public.v3_core_consume_privileged_action(approval_request);

  insert into v3_core.job_retry_operations(
    job_id, tenant_id, previous_status, previous_attempt_count, previous_error_code,
    requested_by, approval_request_id, idempotency_key, correlation_id, reason
  ) values (
    job_row.id, job_row.tenant_id, job_row.status, job_row.attempt_count, job_row.error_code,
    (select auth.uid()), approval_request, trim(request_key), request_correlation, trim(retry_reason)
  ) returning id into operation_id;

  update v3_storage.processing_jobs
  set status = 'queued', attempt_count = 0, locked_by = null, lease_expires_at = null,
      error_code = null, completed_at = null, updated_at = now()
  where id = job_row.id;

  if job_row.job_type = 'scorm_publication' then
    update v3_storage.scorm_publications
    set status = 'queued', error_code = null, ready_at = null, launch_object_key = null
    where id = nullif(job_row.result ->> 'publicationId', '')::uuid
      and tenant_id = job_row.tenant_id
      and status = 'failed';
  end if;

  insert into v3_audit.events(
    tenant_id, actor_id, control_plane, correlation_id, action, object_type, object_id, reason
  ) values (
    job_row.tenant_id, (select auth.uid()), 'os_core', request_correlation,
    'core.processing_job.retry_requested', 'processing_job', job_row.id::text, trim(retry_reason)
  );
  return operation_id;
end;
$$;

alter table v3_core.job_retry_operations enable row level security;
revoke all on v3_core.job_retry_operations from public, anon, authenticated;
revoke all on function public.v3_core_job_overview(),
  public.v3_core_retry_processing_job(uuid,text,uuid,text)
  from public, anon;
grant execute on function public.v3_core_job_overview(),
  public.v3_core_retry_processing_job(uuid,text,uuid,text)
  to authenticated;

comment on function public.v3_core_job_overview() is
  'Payload-free OS Core projection; never returns asset paths, filenames, worker identity or job result data';
comment on function public.v3_core_retry_processing_job(uuid,text,uuid,text) is
  'Two-person approved idempotent retry for failed or expired-lease processing jobs';

commit;
