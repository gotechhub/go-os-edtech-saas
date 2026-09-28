-- Clean malware verdict -> idempotent SCORM analysis job -> immutable package manifest.
-- Publication and binding to a GOLMS learning object remain explicit later commands.
begin;

alter table v3_storage.asset_versions
  add constraint asset_versions_id_tenant_unique unique (id, tenant_id);

create table v3_storage.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  asset_version_id uuid not null,
  job_type text not null check (job_type in ('scorm_ingestion')),
  status text not null default 'queued' check (status in ('queued','processing','succeeded','rejected','failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  locked_by text,
  lease_expires_at timestamptz,
  error_code text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  foreign key (asset_version_id, tenant_id) references v3_storage.asset_versions(id, tenant_id) on delete restrict,
  unique (asset_version_id, job_type),
  check ((status = 'processing' and locked_by is not null and lease_expires_at is not null) or status <> 'processing'),
  check ((status in ('succeeded','rejected') and completed_at is not null) or status not in ('succeeded','rejected'))
);

create table v3_storage.package_manifests (
  asset_version_id uuid primary key,
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  standard text not null check (standard in ('scorm_1_2','scorm_2004')),
  manifest_identifier text not null check (length(trim(manifest_identifier)) > 0),
  title text,
  launch_path text not null check (launch_path !~ '(^/|(^|/)\.\.(/|$)|^[a-zA-Z]+:)'),
  resource_count integer not null check (resource_count > 0),
  sco_count integer not null check (sco_count > 0),
  organization_count integer not null check (organization_count >= 0),
  entry_count integer not null check (entry_count > 0),
  total_compressed_bytes bigint not null check (total_compressed_bytes > 0),
  total_expanded_bytes bigint not null check (total_expanded_bytes > 0),
  analyzer_version text not null,
  validated_at timestamptz not null default now(),
  foreign key (asset_version_id, tenant_id) references v3_storage.asset_versions(id, tenant_id) on delete restrict
);

create index processing_jobs_claim_idx
  on v3_storage.processing_jobs(status, job_type, lease_expires_at, created_at);
create index package_manifests_tenant_idx
  on v3_storage.package_manifests(tenant_id, validated_at desc);

alter table v3_storage.processing_jobs enable row level security;
alter table v3_storage.package_manifests enable row level security;

create function public.v3_storage_record_scan_result(
  target_asset_version uuid,
  event_provider text,
  event_provider_id text,
  event_verdict text,
  event_details jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare version_row v3_storage.asset_versions; asset_row v3_storage.assets; job_id uuid;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if event_verdict not in ('clean','infected','unsupported','failed') then raise exception 'SCAN_VERDICT_INVALID' using errcode='22023'; end if;

  select * into version_row from v3_storage.asset_versions where id=target_asset_version for update;
  if version_row.id is null then raise exception 'ASSET_VERSION_NOT_FOUND' using errcode='P0002'; end if;
  select * into asset_row from v3_storage.assets where id=version_row.asset_id;

  insert into v3_storage.scan_events(tenant_id,asset_version_id,provider,provider_event_id,verdict,details)
  values(version_row.tenant_id,version_row.id,event_provider,event_provider_id,event_verdict,coalesce(event_details,'{}'::jsonb))
  on conflict (provider,provider_event_id) do nothing;

  if not found then
    select id into job_id from v3_storage.processing_jobs where asset_version_id=version_row.id and job_type='scorm_ingestion';
    return job_id;
  end if;

  update v3_storage.asset_versions set scan_status=event_verdict where id=version_row.id;
  update v3_storage.assets set state=case when event_verdict='clean' then 'clean' else 'rejected' end, updated_at=now() where id=asset_row.id;
  insert into v3_audit.events(tenant_id,action,object_type,object_id,reason)
    values(version_row.tenant_id,'asset.scan_result_recorded','asset_version',version_row.id::text,event_verdict);

  if event_verdict='clean' and asset_row.product_key='golms' and asset_row.resource_type='learning-content'
    and asset_row.media_type='application/zip' and asset_row.rights_status='approved'
    and version_row.validation_status='pending' then
    insert into v3_storage.processing_jobs(tenant_id,asset_version_id,job_type)
      values(version_row.tenant_id,version_row.id,'scorm_ingestion')
      on conflict (asset_version_id,job_type) do update set updated_at=excluded.updated_at
      returning id into job_id;
  end if;
  return job_id;
end;
$$;

create function public.v3_storage_claim_scorm_job(worker_id text, lease_seconds integer default 300)
returns table (job_id uuid, tenant_id uuid, asset_version_id uuid, bucket_name text, object_key text, s3_version_id text, expected_size_bytes bigint, expected_sha256 text)
language plpgsql security definer set search_path = '' as $$
declare claimed v3_storage.processing_jobs;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if length(trim(worker_id)) < 3 or lease_seconds not between 30 and 900 then raise exception 'WORKER_LEASE_INVALID' using errcode='22023'; end if;

  select * into claimed from v3_storage.processing_jobs
    where job_type='scorm_ingestion'
      and (status in ('queued','failed') or (status='processing' and lease_expires_at < now()))
      and attempt_count < 5
    order by created_at
    for update skip locked limit 1;
  if claimed.id is null then return; end if;

  update v3_storage.processing_jobs set status='processing',attempt_count=attempt_count+1,locked_by=worker_id,
    lease_expires_at=now()+make_interval(secs=>lease_seconds),updated_at=now(),error_code=null where id=claimed.id;

  return query select claimed.id,v.tenant_id,v.id,v.bucket_name,v.object_key,v.s3_version_id,v.size_bytes,v.sha256
    from v3_storage.asset_versions v where v.id=claimed.asset_version_id;
end;
$$;

create function public.v3_storage_finish_scorm_job(
  target_job uuid,
  worker_id text,
  outcome text,
  outcome_code text,
  manifest jsonb default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare job_row v3_storage.processing_jobs; version_row v3_storage.asset_versions;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if outcome not in ('succeeded','rejected','failed') then raise exception 'JOB_OUTCOME_INVALID' using errcode='22023'; end if;
  select * into job_row from v3_storage.processing_jobs where id=target_job for update;
  if job_row.id is null or job_row.status<>'processing' or job_row.locked_by<>worker_id or job_row.lease_expires_at<now() then
    raise exception 'JOB_LEASE_INVALID' using errcode='55000';
  end if;
  select * into version_row from v3_storage.asset_versions where id=job_row.asset_version_id for update;

  if outcome='succeeded' then
    if manifest is null then raise exception 'SCORM_MANIFEST_RESULT_REQUIRED' using errcode='22023'; end if;
    insert into v3_storage.package_manifests(asset_version_id,tenant_id,standard,manifest_identifier,title,launch_path,
      resource_count,sco_count,organization_count,entry_count,total_compressed_bytes,total_expanded_bytes,analyzer_version)
    values(version_row.id,version_row.tenant_id,manifest->>'standard',manifest->>'manifestIdentifier',manifest->>'title',manifest->>'launchPath',
      (manifest->>'resourceCount')::integer,(manifest->>'scoCount')::integer,(manifest->>'organizationCount')::integer,
      (manifest->>'entryCount')::integer,(manifest->>'totalCompressedBytes')::bigint,(manifest->>'totalExpandedBytes')::bigint,
      manifest->>'analyzerVersion')
    on conflict (asset_version_id) do nothing;
    update v3_storage.asset_versions set validation_status='valid' where id=version_row.id;
  elsif outcome='rejected' then
    update v3_storage.asset_versions set validation_status='invalid' where id=version_row.id;
    update v3_storage.assets set state='rejected',updated_at=now() where id=version_row.asset_id;
  end if;

  update v3_storage.processing_jobs set status=outcome,error_code=outcome_code,result=coalesce(manifest,'{}'::jsonb),
    locked_by=null,lease_expires_at=null,updated_at=now(),completed_at=case when outcome in ('succeeded','rejected') then now() else null end
    where id=job_row.id;
  insert into v3_audit.events(tenant_id,correlation_id,action,object_type,object_id,reason)
    values(job_row.tenant_id,job_row.id,'asset.scorm_ingestion_'||outcome,'asset_version',job_row.asset_version_id::text,outcome_code);
end;
$$;

revoke all on v3_storage.processing_jobs,v3_storage.package_manifests from anon,authenticated;
revoke all on function public.v3_storage_record_scan_result(uuid,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.v3_storage_claim_scorm_job(text,integer) from public,anon,authenticated;
revoke all on function public.v3_storage_finish_scorm_job(uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.v3_storage_record_scan_result(uuid,text,text,text,jsonb) to service_role;
grant execute on function public.v3_storage_claim_scorm_job(text,integer) to service_role;
grant execute on function public.v3_storage_finish_scorm_job(uuid,text,text,text,jsonb) to service_role;

commit;
