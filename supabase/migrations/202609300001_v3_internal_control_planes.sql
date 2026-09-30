begin;

create schema if not exists v3_core;

create table v3_core.operators (
  user_id uuid primary key references auth.users(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table v3_core.roles (
  role_key text primary key,
  display_name text not null,
  check (role_key in ('platform_operator','security_operator','release_manager','infrastructure_operator','data_governance'))
);

insert into v3_core.roles(role_key, display_name) values
  ('platform_operator','Platform operatörü'),
  ('security_operator','Güvenlik operatörü'),
  ('release_manager','Yayın yöneticisi'),
  ('infrastructure_operator','Altyapı operatörü'),
  ('data_governance','Veri yönetişimi')
on conflict (role_key) do update set display_name = excluded.display_name;

create table v3_core.role_permissions (
  role_key text not null references v3_core.roles(role_key) on delete cascade,
  permission_key text not null,
  primary key (role_key, permission_key),
  check (permission_key like 'core.%')
);

insert into v3_core.role_permissions(role_key, permission_key) values
  ('platform_operator','core.read'),
  ('platform_operator','core.system.manage'),
  ('platform_operator','core.jobs.manage'),
  ('platform_operator','core.integrations.manage'),
  ('security_operator','core.read'),
  ('security_operator','core.security.manage'),
  ('security_operator','core.audit.read'),
  ('security_operator','core.sessions.revoke'),
  ('release_manager','core.read'),
  ('release_manager','core.release.manage'),
  ('release_manager','core.migrations.manage'),
  ('release_manager','core.flags.manage'),
  ('infrastructure_operator','core.read'),
  ('infrastructure_operator','core.infrastructure.manage'),
  ('infrastructure_operator','core.providers.manage'),
  ('infrastructure_operator','core.storage.manage'),
  ('data_governance','core.read'),
  ('data_governance','core.data.manage'),
  ('data_governance','core.audit.read'),
  ('data_governance','core.recovery.manage')
on conflict do nothing;

create table v3_core.role_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references v3_core.operators(user_id) on delete cascade,
  role_key text not null references v3_core.roles(role_key) on delete restrict,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  granted_by uuid references auth.users(id) on delete set null,
  reason text not null check (length(trim(reason)) >= 8),
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create unique index core_active_role_grant_key
  on v3_core.role_grants(user_id, role_key)
  where ends_at is null;
create index core_role_grants_access_idx
  on v3_core.role_grants(user_id, starts_at, ends_at);

create table v3_hq.roles (
  role_key text primary key,
  display_name text not null,
  check (role_key in ('customer_ops','support','billing','commercial'))
);

insert into v3_hq.roles(role_key, display_name) values
  ('customer_ops','Müşteri operasyonu'),
  ('support','Destek uzmanı'),
  ('billing','Lisans ve faturalama'),
  ('commercial','Ticari operasyon')
on conflict (role_key) do update set display_name = excluded.display_name;

create table v3_hq.role_permissions (
  role_key text not null references v3_hq.roles(role_key) on delete cascade,
  permission_key text not null,
  primary key (role_key, permission_key),
  check (permission_key like 'hq.%')
);

insert into v3_hq.role_permissions(role_key, permission_key) values
  ('customer_ops','hq.read'),
  ('customer_ops','hq.customer.manage'),
  ('customer_ops','hq.portal.manage'),
  ('customer_ops','hq.trial.manage'),
  ('customer_ops','hq.support.manage'),
  ('support','hq.read'),
  ('support','hq.support.manage'),
  ('support','hq.support_session.manage'),
  ('billing','hq.read'),
  ('billing','hq.trial.manage'),
  ('billing','hq.entitlement.manage'),
  ('billing','hq.billing.manage'),
  ('commercial','hq.read'),
  ('commercial','hq.customer.manage'),
  ('commercial','hq.entitlement.manage')
on conflict do nothing;

create table v3_hq.role_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references v3_hq.operators(user_id) on delete cascade,
  role_key text not null references v3_hq.roles(role_key) on delete restrict,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  granted_by uuid references auth.users(id) on delete set null,
  reason text not null check (length(trim(reason)) >= 8),
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create unique index hq_active_role_grant_key
  on v3_hq.role_grants(user_id, role_key)
  where ends_at is null;
create index hq_role_grants_access_idx
  on v3_hq.role_grants(user_id, starts_at, ends_at);

-- Migration 001 used one mixed internal role column. Preserve commercial/support
-- access as grants and move technical security operators into the Core namespace.
insert into v3_core.operators(user_id, active, created_at, created_by)
select user_id, active, created_at, created_by
from v3_hq.operators
where role_key = 'security'
on conflict (user_id) do nothing;

insert into v3_core.role_grants(user_id, role_key, starts_at, granted_by, reason)
select user_id, 'security_operator', created_at, created_by, 'Legacy security role migration'
from v3_hq.operators
where role_key = 'security'
on conflict (user_id, role_key) where ends_at is null do nothing;

insert into v3_hq.role_grants(user_id, role_key, starts_at, granted_by, reason)
select user_id,
  case role_key when 'operator' then 'customer_ops' else role_key end,
  created_at,
  created_by,
  'Legacy HQ role migration'
from v3_hq.operators
where role_key in ('operator','support','billing')
on conflict (user_id, role_key) where ends_at is null do nothing;

alter table v3_hq.support_sessions drop constraint if exists support_sessions_operator_id_fkey;
alter table v3_hq.support_sessions
  add constraint support_sessions_operator_id_fkey foreign key (operator_id) references auth.users(id) on delete restrict;

delete from v3_hq.operators where role_key = 'security';
alter table v3_hq.operators drop column role_key;

alter table v3_audit.events add column control_plane text not null default 'tenant'
  check (control_plane in ('tenant','super_admin','os_core','system'));
update v3_audit.events set control_plane = 'super_admin' where action = 'tenant.trial_activated';

create function v3_core.has_permission(target_permission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'aal' = 'aal2', false) and exists (
    select 1
    from v3_core.operators op
    join v3_core.role_grants g on g.user_id = op.user_id
    join v3_core.role_permissions p on p.role_key = g.role_key
    where op.user_id = (select auth.uid())
      and op.active
      and g.starts_at <= now()
      and (g.ends_at is null or g.ends_at > now())
      and p.permission_key = target_permission
  );
$$;

create function v3_hq.has_permission(target_permission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'aal' = 'aal2', false) and exists (
    select 1
    from v3_hq.operators op
    join v3_hq.role_grants g on g.user_id = op.user_id
    join v3_hq.role_permissions p on p.role_key = g.role_key
    where op.user_id = (select auth.uid())
      and op.active
      and g.starts_at <= now()
      and (g.ends_at is null or g.ends_at > now())
      and p.permission_key = target_permission
  );
$$;

create or replace function v3_hq.is_operator(required_roles text[] default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'aal' = 'aal2', false) and exists (
    select 1
    from v3_hq.operators op
    join v3_hq.role_grants g on g.user_id = op.user_id
    where op.user_id = (select auth.uid())
      and op.active
      and g.starts_at <= now()
      and (g.ends_at is null or g.ends_at > now())
      and (required_roles is null or g.role_key = any(required_roles))
  );
$$;

create or replace function public.v3_activate_trial(target_tenant uuid) returns v3_platform.tenant_trials
language plpgsql security definer set search_path = '' as $$
declare
  result v3_platform.tenant_trials;
begin
  if not v3_hq.has_permission('hq.trial.manage') then
    raise exception 'HQ_TRIAL_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;

  perform 1 from v3_platform.tenants t
    where t.id = target_tenant and t.mode = 'customer' and t.status = 'active'
    for update;
  if not found then
    raise exception 'ACTIVE_CUSTOMER_TENANT_REQUIRED' using errcode = '42501';
  end if;

  insert into v3_platform.tenant_trials(tenant_id, started_at, ends_at, activated_by)
    values (target_tenant, now(), now() + interval '14 days', (select auth.uid()))
    on conflict (tenant_id) do nothing
    returning * into result;

  if result.tenant_id is null then
    select * into result from v3_platform.tenant_trials where tenant_id = target_tenant;
    return result;
  end if;

  insert into v3_platform.product_entitlements(tenant_id, product_key, kind, starts_at, ends_at, updated_by)
    select target_tenant, p.key, 'trial', result.started_at, result.ends_at, (select auth.uid())
    from v3_platform.products p
    where p.status = 'released'
    on conflict (tenant_id, product_key) do nothing;

  insert into v3_audit.events(tenant_id, actor_id, control_plane, action, object_type, object_id)
    values (target_tenant, (select auth.uid()), 'super_admin', 'tenant.trial_activated', 'tenant', target_tenant::text);

  return result;
end;
$$;

create function public.v3_my_internal_access() returns table (
  control_plane text,
  role_key text,
  permission_key text
) language sql stable security definer set search_path = '' as $$
  select 'os_core'::text, g.role_key, p.permission_key
  from v3_core.operators op
  join v3_core.role_grants g on g.user_id = op.user_id
  join v3_core.role_permissions p on p.role_key = g.role_key
  where coalesce(auth.jwt() ->> 'aal' = 'aal2', false)
    and op.user_id = (select auth.uid())
    and op.active
    and g.starts_at <= now()
    and (g.ends_at is null or g.ends_at > now())
  union all
  select 'super_admin'::text, g.role_key, p.permission_key
  from v3_hq.operators op
  join v3_hq.role_grants g on g.user_id = op.user_id
  join v3_hq.role_permissions p on p.role_key = g.role_key
  where coalesce(auth.jwt() ->> 'aal' = 'aal2', false)
    and op.user_id = (select auth.uid())
    and op.active
    and g.starts_at <= now()
    and (g.ends_at is null or g.ends_at > now())
  order by 1, 2, 3;
$$;

alter table v3_core.operators enable row level security;
alter table v3_core.roles enable row level security;
alter table v3_core.role_permissions enable row level security;
alter table v3_core.role_grants enable row level security;
alter table v3_hq.roles enable row level security;
alter table v3_hq.role_permissions enable row level security;
alter table v3_hq.role_grants enable row level security;

revoke all on schema v3_core from public, anon, authenticated;
revoke all on all tables in schema v3_core from public, anon, authenticated;
revoke all on v3_hq.roles, v3_hq.role_permissions, v3_hq.role_grants from public, anon, authenticated;
revoke all on function v3_core.has_permission(text), v3_hq.has_permission(text), public.v3_my_internal_access() from public, anon, authenticated;
grant usage on schema v3_core to authenticated;
grant execute on function v3_core.has_permission(text), v3_hq.has_permission(text), public.v3_my_internal_access() to authenticated;

comment on schema v3_core is 'Respongo OS Core privileged technical control plane';
comment on table v3_hq.operators is 'Respongo Super Admin identities; access is granted through v3_hq.role_grants';
comment on table v3_core.operators is 'Respongo OS Core technical identities; never derived from tenant membership';

commit;
