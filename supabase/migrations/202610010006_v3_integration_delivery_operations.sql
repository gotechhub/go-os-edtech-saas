begin;

alter table v3_storage.processing_jobs drop constraint processing_jobs_status_check;
alter table v3_storage.processing_jobs add constraint processing_jobs_status_check
  check (status in ('queued','processing','succeeded','rejected','failed','quarantined','cancelled'));

create table v3_core.job_control_operations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references v3_storage.processing_jobs(id) on delete restrict,
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  action text not null check (action in ('quarantine','cancel')),
  previous_status text not null,
  requested_by uuid not null references v3_core.operators(user_id) on delete restrict,
  approval_request_id uuid not null references v3_core.privileged_action_requests(id) on delete restrict,
  idempotency_key text not null check (length(trim(idempotency_key)) between 8 and 120),
  correlation_id uuid not null,
  reason text not null check (length(trim(reason)) >= 12),
  created_at timestamptz not null default now(),
  unique (requested_by, idempotency_key)
);

create function public.v3_core_control_processing_job(
  target_job uuid,
  target_action text,
  control_reason text,
  approval_request uuid,
  request_key text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  job_row v3_storage.processing_jobs;
  operation_id uuid;
  operation_job_id uuid;
  operation_action text;
  request_correlation uuid;
begin
  if not v3_core.has_permission('core.jobs.manage') then
    raise exception 'CORE_JOB_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;
  if target_action not in ('quarantine','cancel')
    or length(trim(control_reason)) < 12
    or length(trim(request_key)) not between 8 and 120 then
    raise exception 'CORE_JOB_CONTROL_INPUT_INVALID' using errcode = '22023';
  end if;

  select id, job_id, action into operation_id, operation_job_id, operation_action
  from v3_core.job_control_operations
  where requested_by = (select auth.uid()) and idempotency_key = trim(request_key);
  if operation_id is not null then
    if operation_job_id <> target_job or operation_action <> target_action then
      raise exception 'CORE_JOB_IDEMPOTENCY_SCOPE_MISMATCH' using errcode = '22023';
    end if;
    return operation_id;
  end if;

  select * into job_row from v3_storage.processing_jobs where id = target_job for update;
  if job_row.id is null then raise exception 'CORE_JOB_NOT_FOUND' using errcode = 'P0002'; end if;
  if not (
    job_row.status in ('queued','failed')
    or (job_row.status = 'processing' and job_row.lease_expires_at <= now())
  ) then raise exception 'CORE_JOB_NOT_CONTROLLABLE' using errcode = '55000'; end if;
  if not exists (
    select 1 from v3_core.privileged_action_requests r
    where r.id = approval_request
      and r.action_permission = 'core.jobs.manage'
      and r.object_type = 'processing_job'
      and r.object_id = target_job::text
  ) then raise exception 'CORE_JOB_APPROVAL_SCOPE_MISMATCH' using errcode = '42501'; end if;

  request_correlation := public.v3_core_consume_privileged_action(approval_request);
  insert into v3_core.job_control_operations(
    job_id, tenant_id, action, previous_status, requested_by, approval_request_id,
    idempotency_key, correlation_id, reason
  ) values (
    job_row.id, job_row.tenant_id, target_action, job_row.status, (select auth.uid()), approval_request,
    trim(request_key), request_correlation, trim(control_reason)
  ) returning id into operation_id;

  update v3_storage.processing_jobs
    set status = case target_action when 'quarantine' then 'quarantined' else 'cancelled' end,
        locked_by = null, lease_expires_at = null, updated_at = now()
    where id = job_row.id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id,reason)
    values(job_row.tenant_id,(select auth.uid()),'os_core',request_correlation,
      'core.processing_job.' || target_action || 'd','processing_job',job_row.id::text,trim(control_reason));
  return operation_id;
end;
$$;

create schema v3_integrations;

create table v3_integrations.connectors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  provider_key text not null check (provider_key ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  capability text not null check (capability ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  endpoint_reference text not null check (length(trim(endpoint_reference)) between 3 and 240),
  secret_reference text not null check (length(trim(secret_reference)) between 3 and 240),
  status text not null default 'active' check (status in ('active','paused','disabled')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (tenant_id, provider_key, capability)
);

create table v3_integrations.outbox_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  connector_id uuid not null references v3_integrations.connectors(id) on delete restrict,
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_.-]{2,119}$'),
  idempotency_key text not null check (length(trim(idempotency_key)) between 8 and 160),
  payload jsonb not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (connector_id, idempotency_key)
);

create table v3_integrations.deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  connector_id uuid not null references v3_integrations.connectors(id) on delete restrict,
  event_id uuid not null unique references v3_integrations.outbox_events(id) on delete restrict,
  status text not null default 'queued' check (status in ('queued','processing','succeeded','failed','dead_letter','cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  locked_by text,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  response_code integer,
  error_code text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'processing' and locked_by is not null and lease_expires_at is not null) or status <> 'processing'),
  check ((status = 'succeeded' and completed_at is not null) or status <> 'succeeded')
);

create table v3_core.integration_replay_operations (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references v3_integrations.deliveries(id) on delete restrict,
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  previous_status text not null,
  previous_attempt_count integer not null check (previous_attempt_count >= 0),
  requested_by uuid not null references v3_core.operators(user_id) on delete restrict,
  approval_request_id uuid not null references v3_core.privileged_action_requests(id) on delete restrict,
  idempotency_key text not null check (length(trim(idempotency_key)) between 8 and 120),
  correlation_id uuid not null,
  reason text not null check (length(trim(reason)) >= 12),
  created_at timestamptz not null default now(),
  unique (requested_by, idempotency_key)
);

create table v3_core.worker_heartbeats (
  worker_id text primary key check (worker_id ~ '^[a-zA-Z0-9._-]{3,120}$'),
  worker_kind text not null check (worker_kind in ('scorm_ingestion','scorm_publication','integration_delivery')),
  status text not null check (status in ('healthy','degraded','stopping')),
  runtime_version text not null check (length(trim(runtime_version)) between 1 and 80),
  active_job_id uuid,
  processed_count bigint not null default 0 check (processed_count >= 0),
  failed_count bigint not null default 0 check (failed_count >= 0),
  last_seen_at timestamptz not null default now()
);

create index integration_deliveries_claim_idx
  on v3_integrations.deliveries(status,next_attempt_at,lease_expires_at,created_at);
create index integration_deliveries_tenant_idx
  on v3_integrations.deliveries(tenant_id,status,updated_at desc);

create function public.v3_integrations_enqueue_event(
  target_connector uuid,
  target_event_type text,
  event_idempotency_key text,
  event_payload jsonb,
  event_occurred_at timestamptz
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare connector_row v3_integrations.connectors; new_event_id uuid; new_delivery_id uuid;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode = '42501'; end if;
  select * into connector_row from v3_integrations.connectors where id = target_connector and status = 'active';
  if connector_row.id is null then raise exception 'ACTIVE_CONNECTOR_REQUIRED' using errcode = '55000'; end if;
  insert into v3_integrations.outbox_events(tenant_id,connector_id,event_type,idempotency_key,payload,occurred_at)
    values(connector_row.tenant_id,connector_row.id,target_event_type,trim(event_idempotency_key),event_payload,event_occurred_at)
    on conflict(connector_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key
    returning id into new_event_id;
  insert into v3_integrations.deliveries(tenant_id,connector_id,event_id)
    values(connector_row.tenant_id,connector_row.id,new_event_id)
    on conflict(event_id) do update set event_id=excluded.event_id
    returning id into new_delivery_id;
  return new_delivery_id;
end;
$$;

create function public.v3_integrations_claim_delivery(worker_id text, lease_seconds integer default 120)
returns table (
  delivery_id uuid, tenant_id uuid, connector_id uuid, provider_key text, capability text,
  endpoint_reference text, secret_reference text, event_type text, event_payload jsonb,
  event_idempotency_key text, attempt_number integer
)
language plpgsql security definer set search_path = '' as $$
declare claimed v3_integrations.deliveries;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode = '42501'; end if;
  if length(trim(worker_id)) < 3 or lease_seconds not between 30 and 600 then raise exception 'WORKER_LEASE_INVALID' using errcode = '22023'; end if;
  select * into claimed from v3_integrations.deliveries d
    where d.next_attempt_at <= now()
      and (d.status in ('queued','failed') or (d.status='processing' and d.lease_expires_at <= now()))
      and d.attempt_count < 8
    order by d.created_at for update skip locked limit 1;
  if claimed.id is null then return; end if;
  update v3_integrations.deliveries
    set status='processing',attempt_count=attempt_count+1,locked_by=worker_id,
      lease_expires_at=now()+make_interval(secs=>lease_seconds),updated_at=now(),error_code=null,response_code=null
    where id=claimed.id;
  return query
    select claimed.id,c.tenant_id,c.id,c.provider_key,c.capability,c.endpoint_reference,c.secret_reference,
      e.event_type,e.payload,e.idempotency_key,claimed.attempt_count+1
    from v3_integrations.connectors c
    join v3_integrations.outbox_events e on e.connector_id=c.id
    where c.id=claimed.connector_id and e.id=claimed.event_id and c.status='active';
end;
$$;

create function public.v3_integrations_finish_delivery(
  target_delivery uuid,
  worker_id text,
  outcome text,
  outcome_code text,
  http_status integer default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare delivery_row v3_integrations.deliveries; next_status text;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode = '42501'; end if;
  if outcome not in ('succeeded','failed') then raise exception 'DELIVERY_OUTCOME_INVALID' using errcode = '22023'; end if;
  select * into delivery_row from v3_integrations.deliveries where id=target_delivery for update;
  if delivery_row.id is null or delivery_row.status<>'processing' or delivery_row.locked_by<>worker_id or delivery_row.lease_expires_at<now() then
    raise exception 'DELIVERY_LEASE_INVALID' using errcode = '55000';
  end if;
  next_status := case when outcome='succeeded' then 'succeeded' when delivery_row.attempt_count>=8 then 'dead_letter' else 'failed' end;
  update v3_integrations.deliveries set status=next_status,response_code=http_status,error_code=outcome_code,
    locked_by=null,lease_expires_at=null,updated_at=now(),
    next_attempt_at=case when outcome='failed' then now()+make_interval(secs=>least(3600,30*(2^least(delivery_row.attempt_count,7))::integer)) else now() end,
    completed_at=case when outcome='succeeded' then now() else null end
    where id=delivery_row.id;
  insert into v3_audit.events(tenant_id,control_plane,correlation_id,action,object_type,object_id,reason)
    values(delivery_row.tenant_id,'system',delivery_row.id,'integration.delivery_'||next_status,'integration_delivery',delivery_row.id::text,outcome_code);
end;
$$;

create function public.v3_core_integration_delivery_overview()
returns table (
  delivery_id uuid, tenant_id uuid, provider_key text, capability text, event_type text,
  delivery_status text, attempt_count integer, lease_state text, response_code integer,
  error_code text, updated_at timestamptz, observed_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not v3_core.has_permission('core.read') then
    raise exception 'CORE_INTEGRATION_READ_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;
  return query select d.id,d.tenant_id,c.provider_key,c.capability,e.event_type,d.status,d.attempt_count,
    case when d.status='processing' and d.lease_expires_at<=now() then 'expired' when d.status='processing' then 'active' else 'none' end,
    d.response_code,d.error_code,d.updated_at,now()
    from v3_integrations.deliveries d
    join v3_integrations.connectors c on c.id=d.connector_id
    join v3_integrations.outbox_events e on e.id=d.event_id
    order by case when d.status in ('failed','dead_letter') or (d.status='processing' and d.lease_expires_at<=now()) then 0 else 1 end,d.updated_at desc;
end;
$$;

create function public.v3_core_record_worker_heartbeat(
  target_worker_id text,
  target_worker_kind text,
  target_status text,
  target_runtime_version text,
  target_active_job uuid default null,
  target_processed_count bigint default 0,
  target_failed_count bigint default 0
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  insert into v3_core.worker_heartbeats(worker_id,worker_kind,status,runtime_version,active_job_id,processed_count,failed_count,last_seen_at)
    values(trim(target_worker_id),target_worker_kind,target_status,trim(target_runtime_version),target_active_job,target_processed_count,target_failed_count,now())
    on conflict(worker_id) do update set worker_kind=excluded.worker_kind,status=excluded.status,runtime_version=excluded.runtime_version,
      active_job_id=excluded.active_job_id,processed_count=excluded.processed_count,failed_count=excluded.failed_count,last_seen_at=now();
end;
$$;

create function public.v3_core_worker_overview()
returns table(
  worker_id text, worker_kind text, worker_status text, runtime_version text,
  active_job_id uuid, processed_count bigint, failed_count bigint, freshness text, observed_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not v3_core.has_permission('core.read') then raise exception 'CORE_WORKER_READ_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  return query select w.worker_id,w.worker_kind,w.status,w.runtime_version,w.active_job_id,w.processed_count,w.failed_count,
    case when w.last_seen_at >= now()-interval '2 minutes' then 'live' else 'stale' end,now()
    from v3_core.worker_heartbeats w order by w.worker_kind,w.worker_id;
end;
$$;

create function public.v3_core_replay_integration_delivery(
  target_delivery uuid,
  replay_reason text,
  approval_request uuid,
  request_key text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare delivery_row v3_integrations.deliveries; operation_id uuid; operation_delivery_id uuid; request_correlation uuid;
begin
  if not v3_core.has_permission('core.integrations.manage') then raise exception 'CORE_INTEGRATION_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  if length(trim(replay_reason))<12 or length(trim(request_key)) not between 8 and 120 then raise exception 'CORE_INTEGRATION_REPLAY_INPUT_INVALID' using errcode='22023'; end if;
  select id,delivery_id into operation_id,operation_delivery_id from v3_core.integration_replay_operations
    where requested_by=(select auth.uid()) and idempotency_key=trim(request_key);
  if operation_id is not null then
    if operation_delivery_id<>target_delivery then raise exception 'CORE_INTEGRATION_IDEMPOTENCY_SCOPE_MISMATCH' using errcode='22023'; end if;
    return operation_id;
  end if;
  select * into delivery_row from v3_integrations.deliveries where id=target_delivery for update;
  if delivery_row.id is null then raise exception 'CORE_INTEGRATION_DELIVERY_NOT_FOUND' using errcode='P0002'; end if;
  if delivery_row.status not in ('failed','dead_letter') then raise exception 'CORE_INTEGRATION_DELIVERY_NOT_REPLAYABLE' using errcode='55000'; end if;
  if not exists(select 1 from v3_core.privileged_action_requests r where r.id=approval_request
    and r.action_permission='core.integrations.manage' and r.object_type='integration_delivery' and r.object_id=target_delivery::text)
  then raise exception 'CORE_INTEGRATION_APPROVAL_SCOPE_MISMATCH' using errcode='42501'; end if;
  request_correlation:=public.v3_core_consume_privileged_action(approval_request);
  insert into v3_core.integration_replay_operations(delivery_id,tenant_id,previous_status,previous_attempt_count,requested_by,approval_request_id,idempotency_key,correlation_id,reason)
    values(delivery_row.id,delivery_row.tenant_id,delivery_row.status,delivery_row.attempt_count,(select auth.uid()),approval_request,trim(request_key),request_correlation,trim(replay_reason))
    returning id into operation_id;
  update v3_integrations.deliveries set status='queued',attempt_count=0,locked_by=null,lease_expires_at=null,
    next_attempt_at=now(),response_code=null,error_code=null,completed_at=null,updated_at=now() where id=delivery_row.id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id,reason)
    values(delivery_row.tenant_id,(select auth.uid()),'os_core',request_correlation,'core.integration_delivery.replayed','integration_delivery',delivery_row.id::text,trim(replay_reason));
  return operation_id;
end;
$$;

alter table v3_core.job_control_operations enable row level security;
alter table v3_core.integration_replay_operations enable row level security;
alter table v3_core.worker_heartbeats enable row level security;
alter table v3_integrations.connectors enable row level security;
alter table v3_integrations.outbox_events enable row level security;
alter table v3_integrations.deliveries enable row level security;

revoke all on schema v3_integrations from public,anon,authenticated;
revoke all on all tables in schema v3_integrations from public,anon,authenticated;
revoke all on v3_core.job_control_operations,v3_core.integration_replay_operations,v3_core.worker_heartbeats from public,anon,authenticated;
revoke all on function public.v3_core_control_processing_job(uuid,text,text,uuid,text),
  public.v3_core_integration_delivery_overview(),public.v3_core_worker_overview(),public.v3_core_replay_integration_delivery(uuid,text,uuid,text)
  from public,anon;
grant execute on function public.v3_core_control_processing_job(uuid,text,text,uuid,text),
  public.v3_core_integration_delivery_overview(),public.v3_core_worker_overview(),public.v3_core_replay_integration_delivery(uuid,text,uuid,text)
  to authenticated;
revoke all on function public.v3_integrations_enqueue_event(uuid,text,text,jsonb,timestamptz),
  public.v3_integrations_claim_delivery(text,integer),public.v3_integrations_finish_delivery(uuid,text,text,text,integer)
  from public,anon,authenticated;
grant execute on function public.v3_integrations_enqueue_event(uuid,text,text,jsonb,timestamptz),
  public.v3_integrations_claim_delivery(text,integer),public.v3_integrations_finish_delivery(uuid,text,text,text,integer)
  to service_role;
revoke all on function public.v3_core_record_worker_heartbeat(text,text,text,text,uuid,bigint,bigint)
  from public,anon,authenticated;
grant execute on function public.v3_core_record_worker_heartbeat(text,text,text,text,uuid,bigint,bigint)
  to service_role;

comment on schema v3_integrations is 'Tenant-scoped provider-neutral connector outbox and delivery runtime';
comment on function public.v3_core_integration_delivery_overview() is 'Payload and secret free global integration delivery projection for OS Core';

commit;
