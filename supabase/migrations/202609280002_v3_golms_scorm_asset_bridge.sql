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

revoke all on v3_storage.scorm_publications from anon,authenticated;
revoke all on function public.v3_golms_bind_scorm_asset(uuid,uuid) from public,anon;
grant execute on function public.v3_golms_bind_scorm_asset(uuid,uuid) to authenticated;

commit;
