-- Bind a validated storage asset to one GOLMS content version and request immutable publication.
begin;

alter table v3_golms.scorm_packages
  add constraint scorm_packages_asset_tenant_fk
  foreign key (asset_version_id, tenant_id)
  references v3_storage.asset_versions(id, tenant_id) on delete restrict;

create table v3_storage.scorm_publications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  asset_version_id uuid not null,
  learning_object_version_id uuid not null,
  status text not null default 'queued' check (status in ('queued','processing','ready','failed','withdrawn')),
  published_prefix text not null check (published_prefix !~ '(^/|(^|/)\.\.(/|$))'),
  launch_object_key text check (launch_object_key !~ '(^/|(^|/)\.\.(/|$)|^[a-zA-Z]+:)'),
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  ready_at timestamptz,
  error_code text,
  foreign key (asset_version_id, tenant_id) references v3_storage.asset_versions(id, tenant_id) on delete restrict,
  foreign key (learning_object_version_id, tenant_id) references v3_golms.learning_object_versions(id, tenant_id) on delete restrict,
  unique (asset_version_id),
  unique (learning_object_version_id),
  check ((status='ready' and ready_at is not null and launch_object_key is not null) or status<>'ready')
);

create index scorm_publications_tenant_status_idx
  on v3_storage.scorm_publications(tenant_id,status,requested_at);
alter table v3_storage.scorm_publications enable row level security;

create function public.v3_golms_bind_scorm_asset(version_id uuid, target_asset_version uuid)
returns v3_golms.scorm_packages
language plpgsql security definer set search_path = '' as $$
declare
  content_row v3_golms.learning_object_versions;
  asset_version_row v3_storage.asset_versions;
  asset_row v3_storage.assets;
  manifest_row v3_storage.package_manifests;
  existing_row v3_golms.scorm_packages;
  result v3_golms.scorm_packages;
  publication_id uuid := gen_random_uuid();
begin
  select * into content_row from v3_golms.learning_object_versions where id=version_id for update;
  if content_row.id is null then raise exception 'LEARNING_OBJECT_VERSION_NOT_FOUND' using errcode='P0002'; end if;
  if content_row.kind<>'scorm' or content_row.status not in ('draft','in_review','approved') then
    raise exception 'SCORM_CONTENT_NOT_BINDABLE' using errcode='55000';
  end if;
  if not v3_platform.has_permission(content_row.tenant_id,'golms.manage')
    or not v3_platform.has_product_access(content_row.tenant_id,'golms',true) then
    raise exception 'GOLMS_MANAGE_FORBIDDEN' using errcode='42501';
  end if;

  select * into asset_version_row from v3_storage.asset_versions where id=target_asset_version;
  select * into asset_row from v3_storage.assets where id=asset_version_row.asset_id;
  select * into manifest_row from v3_storage.package_manifests where asset_version_id=target_asset_version;
  if asset_version_row.id is null or asset_version_row.tenant_id<>content_row.tenant_id
    or asset_row.tenant_id<>content_row.tenant_id then raise exception 'SCORM_ASSET_TENANT_MISMATCH' using errcode='42501'; end if;
  if asset_row.product_key<>'golms' or asset_row.resource_type<>'learning-content' or asset_row.media_type<>'application/zip'
    or asset_row.rights_status<>'approved' or asset_version_row.scan_status<>'clean'
    or asset_version_row.validation_status<>'valid' or manifest_row.asset_version_id is null then
    raise exception 'CLEAN_VALIDATED_SCORM_REQUIRED' using errcode='55000';
  end if;
  if content_row.content_hash<>asset_version_row.sha256 then raise exception 'SCORM_CONTENT_HASH_MISMATCH' using errcode='22000'; end if;

  select * into existing_row from v3_golms.scorm_packages where learning_object_version_id=version_id;
  if existing_row.learning_object_version_id is not null then
    if existing_row.asset_version_id<>target_asset_version then raise exception 'SCORM_VERSION_ALREADY_BOUND' using errcode='23505'; end if;
    return existing_row;
  end if;

  insert into v3_golms.scorm_packages(learning_object_version_id,tenant_id,asset_version_id,package_hash,standard,
    manifest_identifier,launch_path,scan_status,validation_status,validated_at,validator_version,file_count,expanded_bytes)
  values(content_row.id,content_row.tenant_id,asset_version_row.id,asset_version_row.sha256,manifest_row.standard,
    manifest_row.manifest_identifier,manifest_row.launch_path,'clean','valid',manifest_row.validated_at,
    manifest_row.analyzer_version,manifest_row.entry_count,manifest_row.total_expanded_bytes)
  returning * into result;

  insert into v3_storage.scorm_publications(id,tenant_id,asset_version_id,learning_object_version_id,published_prefix,requested_by)
  values(publication_id,content_row.tenant_id,asset_version_row.id,content_row.id,
    'published/golms/course/'||content_row.learning_object_id::text||'/versions/'||content_row.id::text||'/',(select auth.uid()));
  insert into v3_storage.processing_jobs(tenant_id,asset_version_id,job_type,result)
  values(content_row.tenant_id,asset_version_row.id,'scorm_publication',jsonb_build_object('publicationId',publication_id));
  insert into v3_audit.events(tenant_id,actor_id,correlation_id,action,object_type,object_id)
  values(content_row.tenant_id,(select auth.uid()),publication_id,'golms.scorm_asset_bound','learning_object_version',content_row.id::text);
  return result;
end;
$$;

create or replace function public.v3_golms_publish_learning_object(version_id uuid)
returns v3_golms.learning_object_versions language plpgsql security definer set search_path = '' as $$
declare result v3_golms.learning_object_versions;
begin
  select * into result from v3_golms.learning_object_versions where id=version_id for update;
  if result.id is null then raise exception 'LEARNING_OBJECT_VERSION_NOT_FOUND'; end if;
  if not v3_platform.has_permission(result.tenant_id,'golms.manage') or not v3_platform.has_product_access(result.tenant_id,'golms',true) then
    raise exception 'GOLMS_MANAGE_FORBIDDEN' using errcode = '42501';
  end if;
  if result.status not in ('draft','in_review','approved') then raise exception 'CONTENT_NOT_PUBLISHABLE'; end if;
  if not exists(
    select 1 from v3_golms.scorm_packages p
    join v3_storage.scorm_publications publication on publication.learning_object_version_id=p.learning_object_version_id
      and publication.tenant_id=p.tenant_id and publication.asset_version_id=p.asset_version_id
    join v3_storage.asset_versions asset_version on asset_version.id=p.asset_version_id and asset_version.tenant_id=p.tenant_id
    where p.learning_object_version_id=result.id and p.tenant_id=result.tenant_id
      and p.scan_status='clean' and p.validation_status='valid' and p.validated_at is not null
      and asset_version.publication_status='published' and publication.status='ready'
  ) then raise exception 'READY_PUBLISHED_SCORM_REQUIRED'; end if;
  update v3_golms.learning_object_versions set status='published',published_at=now(),published_by=(select auth.uid()) where id=result.id returning * into result;
  insert into v3_audit.events(tenant_id,actor_id,action,object_type,object_id)
    values(result.tenant_id,(select auth.uid()),'golms.learning_object_published','learning_object_version',result.id::text);
  return result;
end;
$$;

create function public.v3_storage_claim_scorm_publication(worker_id text, lease_seconds integer default 600)
returns table (
  job_id uuid, publication_id uuid, tenant_id uuid, asset_version_id uuid, bucket_name text, object_key text,
  s3_version_id text, expected_size_bytes bigint, expected_sha256 text, published_prefix text, expected_launch_path text
)
language plpgsql security definer set search_path = '' as $$
declare claimed v3_storage.processing_jobs;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if length(trim(worker_id)) < 3 or lease_seconds not between 60 and 1800 then raise exception 'WORKER_LEASE_INVALID' using errcode='22023'; end if;
  select * into claimed from v3_storage.processing_jobs
    where job_type='scorm_publication'
      and (status='queued' or (status in ('failed','processing') and coalesce(lease_expires_at,'-infinity'::timestamptz)<now()))
      and attempt_count<5
    order by created_at for update skip locked limit 1;
  if claimed.id is null then return; end if;
  update v3_storage.processing_jobs set status='processing',attempt_count=attempt_count+1,locked_by=worker_id,
    lease_expires_at=now()+make_interval(secs=>lease_seconds),updated_at=now(),error_code=null where id=claimed.id;
  update v3_storage.scorm_publications set status='processing',error_code=null
    where id=(claimed.result->>'publicationId')::uuid;
  return query
    select claimed.id,p.id,v.tenant_id,v.id,v.bucket_name,v.object_key,v.s3_version_id,v.size_bytes,v.sha256,
      p.published_prefix,m.launch_path
    from v3_storage.scorm_publications p
    join v3_storage.asset_versions v on v.id=p.asset_version_id and v.tenant_id=p.tenant_id
    join v3_storage.package_manifests m on m.asset_version_id=v.id and m.tenant_id=v.tenant_id
    where p.id=(claimed.result->>'publicationId')::uuid and v.scan_status='clean' and v.validation_status='valid';
end;
$$;

create function public.v3_storage_finish_scorm_publication(
  target_job uuid,
  worker_id text,
  outcome text,
  outcome_code text,
  published_launch_key text default null,
  published_file_count integer default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  job_row v3_storage.processing_jobs;
  publication_row v3_storage.scorm_publications;
  version_row v3_storage.asset_versions;
  manifest_row v3_storage.package_manifests;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if outcome not in ('succeeded','rejected','failed') then raise exception 'JOB_OUTCOME_INVALID' using errcode='22023'; end if;
  select * into job_row from v3_storage.processing_jobs where id=target_job for update;
  if job_row.id is null or job_row.job_type<>'scorm_publication' or job_row.status<>'processing'
    or job_row.locked_by<>worker_id or job_row.lease_expires_at<now() then raise exception 'JOB_LEASE_INVALID' using errcode='55000'; end if;
  select * into publication_row from v3_storage.scorm_publications where id=(job_row.result->>'publicationId')::uuid for update;
  select * into version_row from v3_storage.asset_versions where id=job_row.asset_version_id for update;
  select * into manifest_row from v3_storage.package_manifests where asset_version_id=job_row.asset_version_id;
  if publication_row.id is null or publication_row.asset_version_id<>job_row.asset_version_id then raise exception 'PUBLICATION_JOB_INVALID' using errcode='55000'; end if;

  if outcome='succeeded' then
    if published_file_count<>manifest_row.entry_count or published_launch_key<>publication_row.published_prefix||manifest_row.launch_path then
      raise exception 'PUBLICATION_RESULT_MISMATCH' using errcode='22000';
    end if;
    update v3_storage.scorm_publications set status='ready',launch_object_key=published_launch_key,ready_at=now(),error_code=null
      where id=publication_row.id;
    update v3_storage.asset_versions set publication_status='published',published_at=now() where id=version_row.id;
    update v3_storage.assets set state='published',updated_at=now() where id=version_row.asset_id;
  elsif outcome='rejected' then
    update v3_storage.scorm_publications set status='failed',error_code=outcome_code where id=publication_row.id;
    update v3_storage.asset_versions set validation_status='invalid' where id=version_row.id;
    update v3_storage.assets set state='rejected',updated_at=now() where id=version_row.asset_id;
  else
    update v3_storage.scorm_publications set status='failed',error_code=outcome_code where id=publication_row.id;
  end if;

  update v3_storage.processing_jobs set status=outcome,error_code=outcome_code,locked_by=null,lease_expires_at=null,
    updated_at=now(),completed_at=case when outcome in ('succeeded','rejected') then now() else null end where id=job_row.id;
  insert into v3_audit.events(tenant_id,correlation_id,action,object_type,object_id,reason)
    values(job_row.tenant_id,job_row.id,'asset.scorm_publication_'||outcome,'asset_version',job_row.asset_version_id::text,outcome_code);
end;
$$;

revoke all on v3_storage.scorm_publications from anon,authenticated;
revoke all on function public.v3_golms_bind_scorm_asset(uuid,uuid) from public,anon;
grant execute on function public.v3_golms_bind_scorm_asset(uuid,uuid) to authenticated;
revoke all on function public.v3_storage_claim_scorm_publication(text,integer) from public,anon,authenticated;
revoke all on function public.v3_storage_finish_scorm_publication(uuid,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.v3_storage_claim_scorm_publication(text,integer) to service_role;
grant execute on function public.v3_storage_finish_scorm_publication(uuid,text,text,text,text,integer) to service_role;

commit;
