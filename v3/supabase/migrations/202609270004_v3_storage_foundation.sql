-- Respongo OS V3 private S3 metadata, tenant isolation and trial write gate.
-- Binary content remains in private S3 buckets; this schema stores metadata and audit state only.
begin;

create schema if not exists v3_storage;

create table v3_storage.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references v3_platform.tenants(id) on delete restrict,
  provider text not null default 'aws_s3' check (provider = 'aws_s3'),
  bucket_name text not null unique check (bucket_name ~ '^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$'),
  region text not null,
  status text not null default 'provisioning' check (status in ('provisioning','active','write_suspended','retired')),
  versioning_enabled boolean not null default false,
  public_access_blocked boolean not null default false,
  ownership_enforced boolean not null default false,
  encryption_key_arn text,
  provisioned_at timestamptz,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table v3_storage.assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  product_key text not null check (product_key in ('golms','golxp','gocatalog','goauthor_ai','gopm','gofactory')),
  resource_type text not null check (resource_type ~ '^[a-z][a-z0-9_-]{1,79}$'),
  resource_id text,
  original_filename text not null check (length(original_filename) between 1 and 255),
  media_type text not null,
  expected_bytes bigint not null check (expected_bytes > 0),
  expected_sha256 text not null check (expected_sha256 ~ '^[0-9a-f]{64}$'),
  rights_status text not null default 'pending' check (rights_status in ('pending','approved','rejected','expired')),
  state text not null default 'awaiting_upload' check (state in ('awaiting_upload','quarantine','scanning','clean','rejected','published','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table v3_storage.asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references v3_storage.assets(id) on delete restrict,
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  bucket_name text not null,
  object_key text not null check (object_key !~ '(^|/)\.\.(/|$)' and object_key !~ '^/'),
  s3_version_id text,
  etag text,
  size_bytes bigint not null check (size_bytes > 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  scan_status text not null default 'pending' check (scan_status in ('pending','clean','infected','unsupported','failed')),
  validation_status text not null default 'pending' check (validation_status in ('pending','valid','invalid','not_applicable')),
  publication_status text not null default 'quarantine' check (publication_status in ('quarantine','published','withdrawn')),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (asset_id, version_number),
  unique (bucket_name, object_key, s3_version_id)
);

create table v3_storage.upload_intents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  asset_id uuid not null references v3_storage.assets(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null check (length(idempotency_key) between 8 and 200),
  bucket_name text not null,
  object_key text not null,
  status text not null default 'pending' check (status in ('pending','uploaded','expired','cancelled')),
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, actor_id, idempotency_key)
);

create table v3_storage.scan_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  asset_version_id uuid not null references v3_storage.asset_versions(id) on delete restrict,
  provider text not null,
  provider_event_id text not null,
  verdict text not null check (verdict in ('clean','infected','unsupported','failed')),
  details jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index assets_tenant_state_idx on v3_storage.assets(tenant_id, state, created_at desc);
create index asset_versions_asset_idx on v3_storage.asset_versions(asset_id, version_number desc);
create index upload_intents_expiry_idx on v3_storage.upload_intents(status, expires_at);

create function public.v3_storage_create_upload_intent(
  target_tenant uuid,
  target_purpose text,
  source_filename text,
  source_media_type text,
  source_bytes bigint,
  source_sha256 text,
  request_idempotency_key text
) returns table (intent_id uuid, asset_id uuid, bucket_name text, object_key text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  location_row v3_storage.locations;
  existing_row v3_storage.upload_intents;
  new_asset_id uuid := gen_random_uuid();
  new_intent_id uuid := gen_random_uuid();
  extension text;
begin
  if target_purpose <> 'golms-learning-content'
    or not v3_platform.has_product_access(target_tenant,'golms',true)
    or not v3_platform.has_permission(target_tenant,'golms.manage') then
    raise exception 'ASSET_UPLOAD_FORBIDDEN' using errcode='42501';
  end if;
  if source_media_type not in ('application/zip','application/pdf','video/mp4','video/webm','image/jpeg','image/png','image/webp')
    or source_bytes < 1 or source_bytes > 2147483648
    or source_sha256 !~ '^[0-9a-f]{64}$'
    or length(source_filename) not between 1 and 255 then
    raise exception 'ASSET_UPLOAD_INVALID' using errcode='22023';
  end if;
  select * into existing_row from v3_storage.upload_intents
    where tenant_id=target_tenant and actor_id=(select auth.uid()) and idempotency_key=request_idempotency_key;
  if existing_row.id is not null then
    return query select existing_row.id, existing_row.asset_id, existing_row.bucket_name, existing_row.object_key, existing_row.expires_at;
    return;
  end if;
  select * into location_row from v3_storage.locations where tenant_id=target_tenant and status='active';
  if location_row.id is null or not location_row.versioning_enabled or not location_row.public_access_blocked or not location_row.ownership_enforced then
    raise exception 'TENANT_STORAGE_NOT_READY' using errcode='55000';
  end if;
  extension := case source_media_type when 'application/zip' then '.zip' when 'application/pdf' then '.pdf' when 'video/mp4' then '.mp4' when 'video/webm' then '.webm' when 'image/jpeg' then '.jpg' when 'image/png' then '.png' when 'image/webp' then '.webp' else '' end;
  insert into v3_storage.assets(id,tenant_id,product_key,resource_type,original_filename,media_type,expected_bytes,expected_sha256,created_by)
    values(new_asset_id,target_tenant,'golms','learning-content',source_filename,source_media_type,source_bytes,source_sha256,(select auth.uid()));
  insert into v3_storage.upload_intents(id,tenant_id,asset_id,actor_id,idempotency_key,bucket_name,object_key,expires_at)
    values(new_intent_id,target_tenant,new_asset_id,(select auth.uid()),request_idempotency_key,location_row.bucket_name,'quarantine/'||new_intent_id::text||'/payload'||extension,now()+interval '5 minutes');
  insert into v3_audit.events(tenant_id,actor_id,action,object_type,object_id,correlation_id)
    values(target_tenant,(select auth.uid()),'asset.upload_intent_created','asset',new_asset_id::text,new_intent_id);
  return query select new_intent_id,new_asset_id,location_row.bucket_name,'quarantine/'||new_intent_id::text||'/payload'||extension,now()+interval '5 minutes';
end;
$$;

create function public.v3_storage_complete_upload(
  target_intent uuid,
  observed_bytes bigint,
  observed_sha256 text,
  observed_etag text,
  observed_s3_version_id text
) returns v3_storage.asset_versions
language plpgsql security definer set search_path = '' as $$
declare intent_row v3_storage.upload_intents; asset_row v3_storage.assets; version_row v3_storage.asset_versions;
begin
  select * into intent_row from v3_storage.upload_intents where id=target_intent for update;
  if intent_row.id is null or intent_row.actor_id<>(select auth.uid()) then raise exception 'UPLOAD_INTENT_FORBIDDEN' using errcode='42501'; end if;
  select * into asset_row from v3_storage.assets where id=intent_row.asset_id;
  if not v3_platform.has_product_access(intent_row.tenant_id,'golms',true) or intent_row.status<>'pending' or intent_row.expires_at<=now() then raise exception 'UPLOAD_INTENT_NOT_ACTIVE' using errcode='42501'; end if;
  if observed_bytes<>asset_row.expected_bytes or observed_sha256<>asset_row.expected_sha256 or coalesce(observed_s3_version_id,'')='' then raise exception 'UPLOAD_INTEGRITY_MISMATCH' using errcode='22000'; end if;
  insert into v3_storage.asset_versions(asset_id,tenant_id,version_number,bucket_name,object_key,s3_version_id,etag,size_bytes,sha256)
    values(asset_row.id,asset_row.tenant_id,1,intent_row.bucket_name,intent_row.object_key,observed_s3_version_id,observed_etag,observed_bytes,observed_sha256)
    returning * into version_row;
  update v3_storage.upload_intents set status='uploaded',completed_at=now() where id=intent_row.id;
  update v3_storage.assets set state='quarantine',updated_at=now() where id=asset_row.id;
  insert into v3_audit.events(tenant_id,actor_id,action,object_type,object_id,correlation_id)
    values(asset_row.tenant_id,(select auth.uid()),'asset.upload_completed','asset_version',version_row.id::text,intent_row.id);
  return version_row;
end;
$$;

create function public.v3_storage_record_download(target_asset_version uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare version_row v3_storage.asset_versions; asset_row v3_storage.assets;
begin
  select * into version_row from v3_storage.asset_versions where id=target_asset_version;
  select * into asset_row from v3_storage.assets where id=version_row.asset_id;
  if version_row.publication_status<>'published' or version_row.scan_status<>'clean' or version_row.validation_status='invalid'
    or not v3_platform.has_product_access(asset_row.tenant_id,asset_row.product_key,false) then
    raise exception 'ASSET_DOWNLOAD_FORBIDDEN' using errcode='42501';
  end if;
  insert into v3_audit.events(tenant_id,actor_id,action,object_type,object_id)
    values(asset_row.tenant_id,(select auth.uid()),'asset.download_url_created','asset_version',version_row.id::text);
end;
$$;

alter table v3_storage.locations enable row level security;
alter table v3_storage.assets enable row level security;
alter table v3_storage.asset_versions enable row level security;
alter table v3_storage.upload_intents enable row level security;
alter table v3_storage.scan_events enable row level security;

create policy storage_locations_read on v3_storage.locations for select to authenticated using (v3_platform.has_permission(tenant_id,'tenant.manage'));
create policy storage_assets_read on v3_storage.assets for select to authenticated using (v3_platform.has_product_access(tenant_id,product_key,false));
create policy storage_versions_read on v3_storage.asset_versions for select to authenticated using (
  exists(select 1 from v3_storage.assets a where a.id=asset_versions.asset_id and a.tenant_id=asset_versions.tenant_id and v3_platform.has_product_access(a.tenant_id,a.product_key,false))
);
create policy storage_intents_read on v3_storage.upload_intents for select to authenticated using (actor_id=(select auth.uid()) and v3_platform.is_active_member(tenant_id));

revoke all on schema v3_storage from public,anon,authenticated;
grant usage on schema v3_storage to authenticated;
revoke all on all tables in schema v3_storage from public,anon,authenticated;
grant select on v3_storage.locations,v3_storage.assets,v3_storage.asset_versions,v3_storage.upload_intents to authenticated;
revoke all on function public.v3_storage_create_upload_intent(uuid,text,text,text,bigint,text,text),public.v3_storage_complete_upload(uuid,bigint,text,text,text),public.v3_storage_record_download(uuid) from public,anon;
grant execute on function public.v3_storage_create_upload_intent(uuid,text,text,text,bigint,text,text),public.v3_storage_complete_upload(uuid,bigint,text,text,text),public.v3_storage_record_download(uuid) to authenticated;

commit;
