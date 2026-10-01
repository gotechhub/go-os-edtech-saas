begin;

create table v3_core.infrastructure_resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references v3_platform.tenants(id) on delete restrict,
  provider text not null check (provider in ('vercel','supabase','aws')),
  resource_type text not null check (resource_type in ('web_project','database_project','auth_project','storage_location','cdn_distribution','worker_runtime')),
  environment text not null check (environment in ('development','preview','production')),
  region text,
  resource_reference text not null check (length(trim(resource_reference)) between 3 and 240),
  status text not null default 'planned' check (status in ('planned','provisioning','active','write_suspended','retired')),
  created_by uuid not null references v3_core.operators(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (provider, resource_type, environment, resource_reference)
);

create table v3_core.infrastructure_observations (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references v3_core.infrastructure_resources(id) on delete restrict,
  provider_event_id text not null check (length(trim(provider_event_id)) between 3 and 180),
  health_status text not null check (health_status in ('healthy','degraded','misconfigured','unreachable')),
  versioning_enabled boolean,
  public_access_blocked boolean,
  ownership_enforced boolean,
  encryption_enabled boolean,
  private_origin_enforced boolean,
  used_bytes bigint check (used_bytes is null or used_bytes >= 0),
  quota_bytes bigint check (quota_bytes is null or quota_bytes > 0),
  object_count bigint check (object_count is null or object_count >= 0),
  error_code text,
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (resource_id, provider_event_id),
  check (used_bytes is null or quota_bytes is null or used_bytes <= quota_bytes)
);

create table v3_core.infrastructure_commands (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references v3_core.infrastructure_resources(id) on delete restrict,
  tenant_id uuid references v3_platform.tenants(id) on delete restrict,
  command_type text not null check (command_type in ('provision','policy_remediation','cdn_invalidation','capacity_expansion')),
  status text not null default 'queued' check (status in ('queued','processing','succeeded','failed','cancelled')),
  requested_by uuid not null references v3_core.operators(user_id) on delete restrict,
  approval_request_id uuid not null references v3_core.privileged_action_requests(id) on delete restrict,
  idempotency_key text not null check (length(trim(idempotency_key)) between 8 and 120),
  correlation_id uuid not null,
  reason text not null check (length(trim(reason)) >= 12),
  locked_by text,
  lease_expires_at timestamptz,
  error_code text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (requested_by, idempotency_key),
  check ((status='processing' and locked_by is not null and lease_expires_at is not null) or status<>'processing'),
  check ((status='succeeded' and completed_at is not null) or status<>'succeeded')
);

create table v3_core.aws_migration_readiness (
  check_key text primary key check (check_key in ('database_export_restore','auth_identity_mapping','object_inventory_checksum','queue_worker_replay','dns_rollback_plan','regional_data_policy')),
  status text not null default 'pending' check (status in ('pending','passed','failed','not_applicable')),
  evidence_reference text,
  evidence_sha256 text check (evidence_sha256 is null or evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz,
  updated_by uuid references v3_core.operators(user_id) on delete restrict
);

insert into v3_core.aws_migration_readiness(check_key) values
  ('database_export_restore'),('auth_identity_mapping'),('object_inventory_checksum'),
  ('queue_worker_replay'),('dns_rollback_plan'),('regional_data_policy');

create index infrastructure_resources_tenant_idx on v3_core.infrastructure_resources(tenant_id,provider,resource_type);
create index infrastructure_observations_resource_idx on v3_core.infrastructure_observations(resource_id,observed_at desc);
create index infrastructure_commands_claim_idx on v3_core.infrastructure_commands(status,lease_expires_at,requested_at);

create function v3_storage.enforce_write_ready_location() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if not exists(
    select 1 from v3_storage.locations l
    where l.tenant_id=new.tenant_id and l.bucket_name=new.bucket_name and l.status='active'
      and l.versioning_enabled and l.public_access_blocked and l.ownership_enforced
      and l.encryption_key_arn is not null and l.checked_at is not null
  ) then raise exception 'TENANT_STORAGE_SECURITY_CONTROLS_REQUIRED' using errcode='55000'; end if;
  return new;
end;
$$;
create trigger upload_intent_requires_secure_location before insert on v3_storage.upload_intents
  for each row execute function v3_storage.enforce_write_ready_location();

create function public.v3_core_register_infrastructure_resource(
  target_tenant uuid,
  target_provider text,
  target_resource_type text,
  target_environment text,
  target_region text,
  target_reference text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare resource_id uuid;
begin
  if not v3_core.has_permission('core.infrastructure.manage') then raise exception 'CORE_INFRASTRUCTURE_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  insert into v3_core.infrastructure_resources(tenant_id,provider,resource_type,environment,region,resource_reference,created_by)
    values(target_tenant,target_provider,target_resource_type,target_environment,target_region,trim(target_reference),(select auth.uid()))
    on conflict(provider,resource_type,environment,resource_reference) do update set region=excluded.region
    returning id into resource_id;
  return resource_id;
end;
$$;

create function public.v3_core_record_infrastructure_observation(
  target_resource uuid,
  target_provider_event_id text,
  target_health_status text,
  target_versioning_enabled boolean,
  target_public_access_blocked boolean,
  target_ownership_enforced boolean,
  target_encryption_enabled boolean,
  target_private_origin_enforced boolean,
  target_used_bytes bigint,
  target_quota_bytes bigint,
  target_object_count bigint,
  target_error_code text,
  target_observed_at timestamptz
) returns uuid
language plpgsql security definer set search_path='' as $$
declare resource_row v3_core.infrastructure_resources; observation_id uuid;
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  select * into resource_row from v3_core.infrastructure_resources where id=target_resource;
  if resource_row.id is null then raise exception 'INFRASTRUCTURE_RESOURCE_NOT_FOUND' using errcode='P0002'; end if;
  insert into v3_core.infrastructure_observations(resource_id,provider_event_id,health_status,versioning_enabled,public_access_blocked,
    ownership_enforced,encryption_enabled,private_origin_enforced,used_bytes,quota_bytes,object_count,error_code,observed_at)
    values(resource_row.id,trim(target_provider_event_id),target_health_status,target_versioning_enabled,target_public_access_blocked,
      target_ownership_enforced,target_encryption_enabled,target_private_origin_enforced,target_used_bytes,target_quota_bytes,target_object_count,target_error_code,target_observed_at)
    on conflict(resource_id,provider_event_id) do update set provider_event_id=excluded.provider_event_id
    returning id into observation_id;
  if resource_row.resource_type='storage_location' and resource_row.tenant_id is not null then
    update v3_storage.locations set
      versioning_enabled=coalesce(target_versioning_enabled,false),public_access_blocked=coalesce(target_public_access_blocked,false),
      ownership_enforced=coalesce(target_ownership_enforced,false),
      encryption_key_arn=case when coalesce(target_encryption_enabled,false) then coalesce(encryption_key_arn,'provider-managed') else null end,
      checked_at=target_observed_at,
      status=case when target_health_status='healthy' and coalesce(target_versioning_enabled,false) and coalesce(target_public_access_blocked,false)
        and coalesce(target_ownership_enforced,false) and coalesce(target_encryption_enabled,false) then status else 'write_suspended' end
      where tenant_id=resource_row.tenant_id and bucket_name=resource_row.resource_reference;
  end if;
  return observation_id;
end;
$$;

create function public.v3_core_activate_storage_location(target_location uuid,approval_request uuid,request_key text) returns uuid
language plpgsql security definer set search_path='' as $$
declare location_row v3_storage.locations; resource_row v3_core.infrastructure_resources; observation_row v3_core.infrastructure_observations; command_id uuid; existing_resource uuid; request_correlation uuid;
begin
  if not v3_core.has_permission('core.storage.manage') then raise exception 'CORE_STORAGE_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  select * into location_row from v3_storage.locations where id=target_location for update;
  if location_row.id is null then raise exception 'STORAGE_LOCATION_NOT_FOUND' using errcode='P0002'; end if;
  select * into resource_row from v3_core.infrastructure_resources where tenant_id=location_row.tenant_id and resource_type='storage_location' and resource_reference=location_row.bucket_name;
  select resource_id into existing_resource from v3_core.infrastructure_commands where requested_by=(select auth.uid()) and idempotency_key=trim(request_key);
  if existing_resource is not null then
    if resource_row.id is null or existing_resource<>resource_row.id then raise exception 'CORE_INFRASTRUCTURE_IDEMPOTENCY_SCOPE_MISMATCH' using errcode='22023'; end if;
    select id into command_id from v3_core.infrastructure_commands where requested_by=(select auth.uid()) and idempotency_key=trim(request_key);
    return command_id;
  end if;
  select * into observation_row from v3_core.infrastructure_observations where resource_id=resource_row.id order by observed_at desc limit 1;
  if resource_row.id is null or observation_row.id is null or observation_row.health_status<>'healthy'
    or not coalesce(observation_row.versioning_enabled,false) or not coalesce(observation_row.public_access_blocked,false)
    or not coalesce(observation_row.ownership_enforced,false) or not coalesce(observation_row.encryption_enabled,false)
    or observation_row.observed_at<now()-interval '15 minutes' then raise exception 'CLEAN_FRESH_STORAGE_OBSERVATION_REQUIRED' using errcode='55000'; end if;
  if not exists(select 1 from v3_core.privileged_action_requests r where r.id=approval_request and r.action_permission='core.storage.manage'
    and r.object_type='storage_location' and r.object_id=target_location::text) then raise exception 'CORE_STORAGE_APPROVAL_SCOPE_MISMATCH' using errcode='42501'; end if;
  request_correlation:=public.v3_core_consume_privileged_action(approval_request);
  insert into v3_core.infrastructure_commands(resource_id,tenant_id,command_type,status,requested_by,approval_request_id,idempotency_key,correlation_id,reason,completed_at)
    values(resource_row.id,location_row.tenant_id,'policy_remediation','succeeded',(select auth.uid()),approval_request,trim(request_key),request_correlation,'Verified secure storage activation',now())
    returning id into command_id;
  update v3_storage.locations set status='active',checked_at=observation_row.observed_at where id=location_row.id;
  update v3_core.infrastructure_resources set status='active' where id=resource_row.id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id)
    values(location_row.tenant_id,(select auth.uid()),'os_core',request_correlation,'core.storage_location.activated','storage_location',target_location::text);
  return command_id;
end;
$$;

create function public.v3_core_request_infrastructure_command(target_resource uuid,target_command_type text,command_reason text,approval_request uuid,request_key text) returns uuid
language plpgsql security definer set search_path='' as $$
declare resource_row v3_core.infrastructure_resources; command_id uuid; existing_resource uuid; request_correlation uuid;
begin
  if not v3_core.has_permission('core.infrastructure.manage') then raise exception 'CORE_INFRASTRUCTURE_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  select id,resource_id into command_id,existing_resource from v3_core.infrastructure_commands where requested_by=(select auth.uid()) and idempotency_key=trim(request_key);
  if command_id is not null then
    if existing_resource<>target_resource then raise exception 'CORE_INFRASTRUCTURE_IDEMPOTENCY_SCOPE_MISMATCH' using errcode='22023'; end if;
    return command_id;
  end if;
  select * into resource_row from v3_core.infrastructure_resources where id=target_resource;
  if resource_row.id is null then raise exception 'INFRASTRUCTURE_RESOURCE_NOT_FOUND' using errcode='P0002'; end if;
  if not exists(select 1 from v3_core.privileged_action_requests r where r.id=approval_request and r.action_permission='core.infrastructure.manage'
    and r.object_type='infrastructure_resource' and r.object_id=target_resource::text) then raise exception 'CORE_INFRASTRUCTURE_APPROVAL_SCOPE_MISMATCH' using errcode='42501'; end if;
  request_correlation:=public.v3_core_consume_privileged_action(approval_request);
  insert into v3_core.infrastructure_commands(resource_id,tenant_id,command_type,requested_by,approval_request_id,idempotency_key,correlation_id,reason)
    values(resource_row.id,resource_row.tenant_id,target_command_type,(select auth.uid()),approval_request,trim(request_key),request_correlation,trim(command_reason)) returning id into command_id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id,reason)
    values(resource_row.tenant_id,(select auth.uid()),'os_core',request_correlation,'core.infrastructure.command_requested','infrastructure_command',command_id::text,trim(command_reason));
  return command_id;
end;
$$;

create function public.v3_core_infrastructure_overview()
returns table(resource_id uuid,tenant_id uuid,provider text,resource_type text,environment text,region text,resource_status text,health_status text,capacity_percent numeric,control_status text,observed_at timestamptz,freshness text)
language plpgsql stable security definer set search_path='' as $$
begin
  if not v3_core.has_permission('core.read') then raise exception 'CORE_INFRASTRUCTURE_READ_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  return query select r.id,r.tenant_id,r.provider,r.resource_type,r.environment,r.region,r.status,o.health_status,
    case when o.quota_bytes is null then null else round((o.used_bytes::numeric/nullif(o.quota_bytes,0))*100,2) end,
    case when r.resource_type='storage_location' and (not coalesce(o.versioning_enabled,false) or not coalesce(o.public_access_blocked,false)
      or not coalesce(o.ownership_enforced,false) or not coalesce(o.encryption_enabled,false)) then 'misconfigured'
      when r.resource_type='cdn_distribution' and not coalesce(o.private_origin_enforced,false) then 'misconfigured'
      when o.id is null then 'unknown' else 'verified' end,
    o.observed_at,case when o.observed_at is null then 'unknown' when o.observed_at>=now()-interval '15 minutes' then 'live' else 'stale' end
    from v3_core.infrastructure_resources r
    left join lateral(select * from v3_core.infrastructure_observations x where x.resource_id=r.id order by x.observed_at desc limit 1)o on true
    order by r.provider,r.resource_type,r.tenant_id;
end;
$$;

create function public.v3_core_aws_migration_readiness()
returns table(check_key text,check_status text,evidence_reference text,evidence_sha256 text,observed_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not v3_core.has_permission('core.read') then raise exception 'CORE_INFRASTRUCTURE_READ_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  return query select r.check_key,r.status,r.evidence_reference,r.evidence_sha256,r.observed_at from v3_core.aws_migration_readiness r order by r.check_key;
end;
$$;

create function public.v3_core_record_aws_migration_check(target_check_key text,target_status text,target_evidence_reference text,target_evidence_sha256 text,target_observed_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if target_status='passed' and (target_evidence_reference is null or target_evidence_sha256 is null) then raise exception 'MIGRATION_CHECK_EVIDENCE_REQUIRED' using errcode='22023'; end if;
  update v3_core.aws_migration_readiness set status=target_status,evidence_reference=target_evidence_reference,
    evidence_sha256=target_evidence_sha256,observed_at=target_observed_at where check_key=target_check_key;
  if not found then raise exception 'MIGRATION_CHECK_NOT_FOUND' using errcode='P0002'; end if;
end;
$$;

create function public.v3_core_claim_infrastructure_command(worker_id text,lease_seconds integer default 180)
returns table(command_id uuid,tenant_id uuid,provider text,resource_type text,resource_reference text,command_type text)
language plpgsql security definer set search_path='' as $$
declare claimed v3_core.infrastructure_commands;
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if length(trim(worker_id))<3 or lease_seconds not between 30 and 900 then raise exception 'WORKER_LEASE_INVALID' using errcode='22023'; end if;
  select * into claimed from v3_core.infrastructure_commands c
    where c.status='queued' or (c.status in ('processing','failed') and coalesce(c.lease_expires_at,'-infinity'::timestamptz)<=now())
    order by c.requested_at for update skip locked limit 1;
  if claimed.id is null then return; end if;
  update v3_core.infrastructure_commands set status='processing',locked_by=worker_id,lease_expires_at=now()+make_interval(secs=>lease_seconds),error_code=null where id=claimed.id;
  return query select claimed.id,r.tenant_id,r.provider,r.resource_type,r.resource_reference,claimed.command_type
    from v3_core.infrastructure_resources r where r.id=claimed.resource_id;
end;
$$;

create function public.v3_core_finish_infrastructure_command(target_command uuid,worker_id text,outcome text,outcome_code text default null) returns void
language plpgsql security definer set search_path='' as $$
declare command_row v3_core.infrastructure_commands;
begin
  if (select auth.role())<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if outcome not in ('succeeded','failed') then raise exception 'INFRASTRUCTURE_COMMAND_OUTCOME_INVALID' using errcode='22023'; end if;
  select * into command_row from v3_core.infrastructure_commands where id=target_command for update;
  if command_row.id is null or command_row.status<>'processing' or command_row.locked_by<>worker_id or command_row.lease_expires_at<now() then raise exception 'INFRASTRUCTURE_COMMAND_LEASE_INVALID' using errcode='55000'; end if;
  update v3_core.infrastructure_commands set status=outcome,locked_by=null,lease_expires_at=null,error_code=outcome_code,
    completed_at=case when outcome='succeeded' then now() else null end where id=target_command;
  insert into v3_audit.events(tenant_id,control_plane,correlation_id,action,object_type,object_id,reason)
    values(command_row.tenant_id,'system',command_row.correlation_id,'core.infrastructure.command_'||outcome,'infrastructure_command',command_row.id::text,outcome_code);
end;
$$;

alter table v3_core.infrastructure_resources enable row level security;
alter table v3_core.infrastructure_observations enable row level security;
alter table v3_core.infrastructure_commands enable row level security;
alter table v3_core.aws_migration_readiness enable row level security;
revoke all on v3_core.infrastructure_resources,v3_core.infrastructure_observations,v3_core.infrastructure_commands,v3_core.aws_migration_readiness from public,anon,authenticated;
revoke all on function public.v3_core_register_infrastructure_resource(uuid,text,text,text,text,text),
  public.v3_core_activate_storage_location(uuid,uuid,text),public.v3_core_request_infrastructure_command(uuid,text,text,uuid,text),
  public.v3_core_infrastructure_overview(),public.v3_core_aws_migration_readiness() from public,anon;
grant execute on function public.v3_core_register_infrastructure_resource(uuid,text,text,text,text,text),
  public.v3_core_activate_storage_location(uuid,uuid,text),public.v3_core_request_infrastructure_command(uuid,text,text,uuid,text),
  public.v3_core_infrastructure_overview(),public.v3_core_aws_migration_readiness() to authenticated;
revoke all on function public.v3_core_record_infrastructure_observation(uuid,text,text,boolean,boolean,boolean,boolean,boolean,bigint,bigint,bigint,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.v3_core_record_infrastructure_observation(uuid,text,text,boolean,boolean,boolean,boolean,boolean,bigint,bigint,bigint,text,timestamptz)
  to service_role;
revoke all on function public.v3_core_record_aws_migration_check(text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.v3_core_record_aws_migration_check(text,text,text,text,timestamptz) to service_role;
revoke all on function public.v3_core_claim_infrastructure_command(text,integer),public.v3_core_finish_infrastructure_command(uuid,text,text,text)
  from public,anon,authenticated;
grant execute on function public.v3_core_claim_infrastructure_command(text,integer),public.v3_core_finish_infrastructure_command(uuid,text,text,text)
  to service_role;

comment on table v3_core.infrastructure_resources is 'Secret-free provider resource inventory; references are identifiers, never credentials';
comment on function v3_storage.enforce_write_ready_location() is 'Fail-closed upload gate for observed versioned private encrypted tenant storage';

commit;
