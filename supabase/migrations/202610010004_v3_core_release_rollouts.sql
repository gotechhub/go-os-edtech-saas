begin;

create table v3_core.releases(
  id uuid primary key default gen_random_uuid(),
  component text not null check(component in ('web','api','database','worker','mobile')),
  version text not null check(length(trim(version)) between 1 and 80),
  git_sha text not null check(git_sha ~ '^[0-9a-f]{7,40}$'),
  artifact_digest text not null check(artifact_digest ~ '^sha256:[0-9a-f]{64}$'),
  status text not null default 'candidate' check(status in ('candidate','pilot','active','retired','blocked')),
  created_by uuid not null references v3_core.operators(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(component,version)
);

create table v3_core.release_rollouts(
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references v3_core.releases(id) on delete restrict,
  scope text not null check(scope in ('internal','pilot','global')),
  tenant_id uuid references v3_platform.tenants(id) on delete restrict,
  status text not null default 'running' check(status in ('running','succeeded','failed','paused','rolled_back')),
  requested_by uuid not null references v3_core.operators(user_id) on delete restrict,
  approval_request_id uuid not null references v3_core.privileged_action_requests(id) on delete restrict,
  idempotency_key text not null check(length(trim(idempotency_key)) between 8 and 120),
  correlation_id uuid not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rollback_of uuid references v3_core.release_rollouts(id) on delete restrict,
  unique(requested_by,idempotency_key),
  check((scope='pilot' and tenant_id is not null) or (scope<>'pilot' and tenant_id is null))
);

create table v3_core.feature_flags(
  flag_key text primary key check(flag_key ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  description text not null check(length(trim(description))>=8),
  risk text not null check(risk in ('low','high','critical')),
  default_enabled boolean not null default false,
  status text not null default 'active' check(status in ('active','retired')),
  created_by uuid not null references v3_core.operators(user_id) on delete restrict,
  created_at timestamptz not null default now()
);

create table v3_core.feature_flag_changes(
  id uuid primary key default gen_random_uuid(),
  flag_key text not null references v3_core.feature_flags(flag_key) on delete restrict,
  tenant_id uuid references v3_platform.tenants(id) on delete restrict,
  enabled boolean not null,
  reason text not null check(length(trim(reason))>=12),
  changed_by uuid not null references v3_core.operators(user_id) on delete restrict,
  approval_request_id uuid not null references v3_core.privileged_action_requests(id) on delete restrict,
  idempotency_key text not null check(length(trim(idempotency_key)) between 8 and 120),
  correlation_id uuid not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  unique(changed_by,idempotency_key),
  check(ends_at is null or ends_at>starts_at)
);

create function public.v3_core_register_release(target_component text,target_version text,target_git_sha text,target_digest text) returns uuid
language plpgsql security definer set search_path='' as $$
declare release_id uuid;
begin
  if not v3_core.has_permission('core.release.manage') then raise exception 'CORE_RELEASE_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  insert into v3_core.releases(component,version,git_sha,artifact_digest,created_by)
    values(target_component,trim(target_version),lower(target_git_sha),lower(target_digest),(select auth.uid()))
    on conflict(component,version) do update set version=excluded.version
    returning id into release_id;
  return release_id;
end;
$$;

create function public.v3_core_start_release_rollout(target_release uuid,target_scope text,target_tenant uuid,approval_request uuid,request_key text) returns uuid
language plpgsql security definer set search_path='' as $$
declare rollout_id uuid; request_correlation uuid;
begin
  if not v3_core.has_permission('core.release.manage') then raise exception 'CORE_RELEASE_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  select id into rollout_id from v3_core.release_rollouts where requested_by=(select auth.uid()) and idempotency_key=request_key;
  if rollout_id is not null then return rollout_id; end if;
  if not exists(select 1 from v3_core.privileged_action_requests r where r.id=approval_request and r.action_permission='core.release.manage' and r.object_type='release' and r.object_id=target_release::text) then
    raise exception 'CORE_RELEASE_APPROVAL_SCOPE_MISMATCH' using errcode='42501';
  end if;
  request_correlation:=public.v3_core_consume_privileged_action(approval_request);
  insert into v3_core.release_rollouts(release_id,scope,tenant_id,requested_by,approval_request_id,idempotency_key,correlation_id)
    values(target_release,target_scope,target_tenant,(select auth.uid()),approval_request,trim(request_key),request_correlation)
    returning id into rollout_id;
  update v3_core.releases set status=case when target_scope='global' then 'active' else 'pilot' end where id=target_release;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id,reason)
    values(target_tenant,(select auth.uid()),'os_core',request_correlation,'core.release.rollout_started','release_rollout',rollout_id::text,target_scope);
  return rollout_id;
end;
$$;

create function public.v3_core_rollback_release_rollout(target_rollout uuid,approval_request uuid,request_key text) returns uuid
language plpgsql security definer set search_path='' as $$
declare original v3_core.release_rollouts; rollback_id uuid; request_correlation uuid;
begin
  if not v3_core.has_permission('core.release.manage') then raise exception 'CORE_RELEASE_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  select id into rollback_id from v3_core.release_rollouts where requested_by=(select auth.uid()) and idempotency_key=request_key;
  if rollback_id is not null then return rollback_id; end if;
  select * into original from v3_core.release_rollouts where id=target_rollout;
  if original.id is null or not exists(select 1 from v3_core.privileged_action_requests r where r.id=approval_request and r.action_permission='core.release.manage' and r.object_type='release_rollout' and r.object_id=target_rollout::text) then
    raise exception 'CORE_ROLLBACK_APPROVAL_SCOPE_MISMATCH' using errcode='42501';
  end if;
  request_correlation:=public.v3_core_consume_privileged_action(approval_request);
  update v3_core.release_rollouts set status='rolled_back',finished_at=now() where id=target_rollout and status in ('running','succeeded','paused');
  if not found then raise exception 'CORE_ROLLOUT_NOT_ROLLBACKABLE' using errcode='42501'; end if;
  insert into v3_core.release_rollouts(release_id,scope,tenant_id,status,requested_by,approval_request_id,idempotency_key,correlation_id,finished_at,rollback_of)
    values(original.release_id,original.scope,original.tenant_id,'succeeded',(select auth.uid()),approval_request,trim(request_key),request_correlation,now(),target_rollout)
    returning id into rollback_id;
  update v3_core.releases set status='candidate' where id=original.release_id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id)
    values(original.tenant_id,(select auth.uid()),'os_core',request_correlation,'core.release.rolled_back','release_rollout',target_rollout::text);
  return rollback_id;
end;
$$;

create function public.v3_core_release_overview() returns table(release_id uuid,component text,version text,git_sha text,release_status text,rollout_id uuid,rollout_scope text,rollout_status text,tenant_id uuid,observed_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not v3_core.has_permission('core.read') then raise exception 'CORE_RELEASE_READ_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  return query select r.id,r.component,r.version,r.git_sha,r.status,ro.id,ro.scope,ro.status,ro.tenant_id,now()
    from v3_core.releases r left join v3_core.release_rollouts ro on ro.release_id=r.id order by r.created_at desc,ro.started_at desc;
end;
$$;

create function public.v3_core_register_feature_flag(target_key text,target_description text,target_risk text,default_state boolean default false) returns text
language plpgsql security definer set search_path='' as $$
begin
  if not v3_core.has_permission('core.flags.manage') then raise exception 'CORE_FLAG_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  insert into v3_core.feature_flags(flag_key,description,risk,default_enabled,created_by)
    values(lower(trim(target_key)),trim(target_description),target_risk,default_state,(select auth.uid()))
    on conflict(flag_key) do update set description=excluded.description
    returning flag_key into target_key;
  return target_key;
end;
$$;

create function public.v3_core_set_feature_flag(target_key text,target_tenant uuid,target_enabled boolean,change_reason text,approval_request uuid,request_key text) returns uuid
language plpgsql security definer set search_path='' as $$
declare change_id uuid; request_correlation uuid;
begin
  if not v3_core.has_permission('core.flags.manage') then raise exception 'CORE_FLAG_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  select id into change_id from v3_core.feature_flag_changes where changed_by=(select auth.uid()) and idempotency_key=request_key;
  if change_id is not null then return change_id; end if;
  if not exists(select 1 from v3_core.privileged_action_requests r where r.id=approval_request and r.action_permission='core.flags.manage' and r.object_type='feature_flag' and r.object_id=target_key) then
    raise exception 'CORE_FLAG_APPROVAL_SCOPE_MISMATCH' using errcode='42501';
  end if;
  request_correlation:=public.v3_core_consume_privileged_action(approval_request);
  update v3_core.feature_flag_changes set ends_at=now() where flag_key=target_key and tenant_id is not distinct from target_tenant and ends_at is null;
  insert into v3_core.feature_flag_changes(flag_key,tenant_id,enabled,reason,changed_by,approval_request_id,idempotency_key,correlation_id)
    values(target_key,target_tenant,target_enabled,trim(change_reason),(select auth.uid()),approval_request,trim(request_key),request_correlation)
    returning id into change_id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,correlation_id,action,object_type,object_id,reason)
    values(target_tenant,(select auth.uid()),'os_core',request_correlation,case when target_tenant is null then 'core.feature_flag.global_changed' else 'core.feature_flag.tenant_changed' end,'feature_flag',target_key,trim(change_reason));
  return change_id;
end;
$$;

create function public.v3_core_feature_flag_overview() returns table(flag_key text,risk text,default_enabled boolean,tenant_id uuid,override_enabled boolean,starts_at timestamptz,observed_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not v3_core.has_permission('core.read') then raise exception 'CORE_FLAG_READ_PERMISSION_MFA_REQUIRED' using errcode='42501'; end if;
  return query select f.flag_key,f.risk,f.default_enabled,c.tenant_id,c.enabled,c.starts_at,now()
    from v3_core.feature_flags f left join v3_core.feature_flag_changes c on c.flag_key=f.flag_key and c.ends_at is null where f.status='active' order by f.flag_key,c.starts_at desc;
end;
$$;

alter table v3_core.releases enable row level security;
alter table v3_core.release_rollouts enable row level security;
alter table v3_core.feature_flags enable row level security;
alter table v3_core.feature_flag_changes enable row level security;
revoke all on v3_core.releases,v3_core.release_rollouts,v3_core.feature_flags,v3_core.feature_flag_changes from public,anon,authenticated;
revoke all on function public.v3_core_register_release(text,text,text,text),public.v3_core_start_release_rollout(uuid,text,uuid,uuid,text),public.v3_core_rollback_release_rollout(uuid,uuid,text),public.v3_core_release_overview(),public.v3_core_register_feature_flag(text,text,text,boolean),public.v3_core_set_feature_flag(text,uuid,boolean,text,uuid,text),public.v3_core_feature_flag_overview() from public,anon;
grant execute on function public.v3_core_register_release(text,text,text,text),public.v3_core_start_release_rollout(uuid,text,uuid,uuid,text),public.v3_core_rollback_release_rollout(uuid,uuid,text),public.v3_core_release_overview(),public.v3_core_register_feature_flag(text,text,text,boolean),public.v3_core_set_feature_flag(text,uuid,boolean,text,uuid,text),public.v3_core_feature_flag_overview() to authenticated;

commit;
