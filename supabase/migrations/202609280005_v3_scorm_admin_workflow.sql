-- Tenant-safe SCORM administration read models and explicit rights attestation.
begin;

create table v3_golms.scorm_imports (
  learning_object_version_id uuid primary key,
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  asset_id uuid not null unique references v3_storage.assets(id) on delete restrict,
  registered_by uuid not null references auth.users(id) on delete restrict,
  registered_at timestamptz not null default now(),
  foreign key (learning_object_version_id,tenant_id) references v3_golms.learning_object_versions(id,tenant_id) on delete restrict
);
alter table v3_golms.scorm_imports enable row level security;

create function public.v3_golms_register_scorm_import(version_id uuid, target_asset uuid)
returns v3_golms.scorm_imports
language plpgsql security definer set search_path = '' as $$
declare content_row v3_golms.learning_object_versions; asset_row v3_storage.assets; result v3_golms.scorm_imports;
begin
  select * into content_row from v3_golms.learning_object_versions where id=version_id;
  select * into asset_row from v3_storage.assets where id=target_asset;
  if content_row.id is null or asset_row.id is null then raise exception 'SCORM_IMPORT_RESOURCE_NOT_FOUND' using errcode='P0002'; end if;
  if content_row.tenant_id<>asset_row.tenant_id or content_row.kind<>'scorm' or asset_row.product_key<>'golms'
    or asset_row.resource_type<>'learning-content' or asset_row.expected_sha256<>content_row.content_hash then
    raise exception 'SCORM_IMPORT_SCOPE_MISMATCH' using errcode='42501';
  end if;
  if not v3_platform.has_permission(content_row.tenant_id,'golms.manage')
    or not v3_platform.has_product_access(content_row.tenant_id,'golms',true) then
    raise exception 'SCORM_IMPORT_FORBIDDEN' using errcode='42501';
  end if;
  insert into v3_golms.scorm_imports(learning_object_version_id,tenant_id,asset_id,registered_by)
    values(content_row.id,content_row.tenant_id,asset_row.id,(select auth.uid()))
    on conflict (learning_object_version_id) do update set asset_id=excluded.asset_id
      where v3_golms.scorm_imports.asset_id=excluded.asset_id
    returning * into result;
  if result.learning_object_version_id is null then raise exception 'SCORM_IMPORT_ALREADY_REGISTERED' using errcode='23505'; end if;
  return result;
end;
$$;

create function public.v3_storage_approve_asset_rights(target_asset uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare asset_row v3_storage.assets;
begin
  select * into asset_row from v3_storage.assets where id=target_asset for update;
  if asset_row.id is null then raise exception 'ASSET_NOT_FOUND' using errcode='P0002'; end if;
  if not v3_platform.has_permission(asset_row.tenant_id,'golms.manage')
    or not v3_platform.has_product_access(asset_row.tenant_id,'golms',true) then
    raise exception 'ASSET_RIGHTS_FORBIDDEN' using errcode='42501';
  end if;
  if asset_row.product_key<>'golms' or asset_row.resource_type<>'learning-content' then
    raise exception 'ASSET_RIGHTS_SCOPE_INVALID' using errcode='22023';
  end if;
  update v3_storage.assets set rights_status='approved',updated_at=now() where id=asset_row.id;
  insert into v3_audit.events(tenant_id,actor_id,action,object_type,object_id,reason)
    values(asset_row.tenant_id,(select auth.uid()),'asset.rights_attested','asset',asset_row.id::text,'uploader_attestation');
end;
$$;

create function public.v3_storage_get_asset_processing_status(target_asset uuid)
returns table (
  asset_id uuid,
  asset_version_id uuid,
  asset_state text,
  rights_status text,
  scan_status text,
  validation_status text,
  publication_status text,
  ingestion_status text,
  ingestion_error_code text,
  scorm_publication_status text,
  standard text,
  launch_path text
)
language plpgsql stable security definer set search_path = '' as $$
declare asset_row v3_storage.assets;
begin
  select * into asset_row from v3_storage.assets where id=target_asset;
  if asset_row.id is null then raise exception 'ASSET_NOT_FOUND' using errcode='P0002'; end if;
  if not v3_platform.has_permission(asset_row.tenant_id,'golms.manage')
    or not v3_platform.has_product_access(asset_row.tenant_id,'golms',false) then
    raise exception 'ASSET_STATUS_FORBIDDEN' using errcode='42501';
  end if;
  return query
    select a.id,v.id,a.state,a.rights_status,v.scan_status,v.validation_status,v.publication_status,
      ingestion.status,ingestion.error_code,publication.status,m.standard,m.launch_path
    from v3_storage.assets a
    left join lateral (
      select av.* from v3_storage.asset_versions av where av.asset_id=a.id order by av.version_number desc limit 1
    ) v on true
    left join v3_storage.processing_jobs ingestion on ingestion.asset_version_id=v.id and ingestion.job_type='scorm_ingestion'
    left join v3_storage.scorm_publications publication on publication.asset_version_id=v.id
    left join v3_storage.package_manifests m on m.asset_version_id=v.id
    where a.id=asset_row.id;
end;
$$;

create function public.v3_golms_list_scorm_content(target_tenant uuid)
returns table (
  id uuid,
  title text,
  locale text,
  version integer,
  status text,
  asset_id uuid,
  asset_version_id uuid,
  standard text,
  scan_status text,
  validation_status text,
  publication_status text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not v3_platform.has_permission(target_tenant,'golms.manage')
    or not v3_platform.has_product_access(target_tenant,'golms',false) then
    raise exception 'GOLMS_CONTENT_LIST_FORBIDDEN' using errcode='42501';
  end if;
  return query
    select v.id,v.title,v.locale,v.version,v.status,i.asset_id,av.id,coalesce(p.standard,m.standard),
      coalesce(p.scan_status,av.scan_status),coalesce(p.validation_status,av.validation_status),publication.status
    from v3_golms.learning_object_versions v
    left join v3_golms.scorm_imports i on i.learning_object_version_id=v.id and i.tenant_id=v.tenant_id
    left join lateral (select latest.* from v3_storage.asset_versions latest where latest.asset_id=i.asset_id order by latest.version_number desc limit 1) av on true
    left join v3_storage.package_manifests m on m.asset_version_id=av.id
    left join v3_golms.scorm_packages p on p.learning_object_version_id=v.id and p.tenant_id=v.tenant_id
    left join v3_storage.scorm_publications publication on publication.learning_object_version_id=v.id and publication.tenant_id=v.tenant_id
    where v.tenant_id=target_tenant and v.kind='scorm'
    order by v.created_at desc;
end;
$$;

revoke all on v3_golms.scorm_imports from public,anon,authenticated;
revoke all on function public.v3_golms_register_scorm_import(uuid,uuid),public.v3_storage_approve_asset_rights(uuid),public.v3_storage_get_asset_processing_status(uuid),public.v3_golms_list_scorm_content(uuid) from public,anon;
grant execute on function public.v3_golms_register_scorm_import(uuid,uuid),public.v3_storage_approve_asset_rights(uuid),public.v3_storage_get_asset_processing_status(uuid),public.v3_golms_list_scorm_content(uuid) to authenticated;

commit;
