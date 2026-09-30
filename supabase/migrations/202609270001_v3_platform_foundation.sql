-- Respongo OS V3 clean platform foundation.
-- Assumes Supabase auth.users/auth.uid/auth.jwt and the authenticated/anon roles exist.
begin;

create extension if not exists pgcrypto;
create schema if not exists v3_platform;
create schema if not exists v3_hq;
create schema if not exists v3_audit;

create table v3_platform.tenants (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  mode text not null check (mode in ('customer','internal_demo')),
  status text not null default 'provisioning' check (status in ('provisioning','active','suspended','closed')),
  default_locale text not null default 'tr-TR',
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table v3_platform.portals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  slug text not null,
  industry_key text not null,
  status text not null default 'draft' check (status in ('draft','active','suspended','archived')),
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table v3_platform.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'invited' check (status in ('invited','active','suspended','revoked')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  check (ends_at is null or ends_at > starts_at)
);

create table v3_platform.role_permissions (
  role_key text not null,
  permission_key text not null,
  primary key (role_key, permission_key),
  check (role_key in ('tenant_owner','tenant_admin','learning_admin','compliance_admin','report_analyst','instructor','line_manager','learner'))
);

insert into v3_platform.role_permissions(role_key, permission_key) values
  ('tenant_owner','tenant.read'),('tenant_owner','tenant.manage'),('tenant_owner','membership.manage'),('tenant_owner','entitlement.read'),('tenant_owner','localization.manage'),('tenant_owner','golms.learn'),('tenant_owner','golms.manage'),('tenant_owner','golms.compliance.manage'),('tenant_owner','golms.report'),
  ('tenant_admin','tenant.read'),('tenant_admin','membership.manage'),('tenant_admin','entitlement.read'),('tenant_admin','localization.manage'),('tenant_admin','golms.learn'),('tenant_admin','golms.manage'),('tenant_admin','golms.report'),
  ('learning_admin','tenant.read'),('learning_admin','golms.learn'),('learning_admin','golms.manage'),('learning_admin','golms.report'),
  ('compliance_admin','tenant.read'),('compliance_admin','golms.learn'),('compliance_admin','golms.compliance.manage'),('compliance_admin','golms.report'),
  ('report_analyst','tenant.read'),('report_analyst','golms.report'),
  ('instructor','tenant.read'),('instructor','golms.learn'),('instructor','golms.instruct'),
  ('line_manager','tenant.read'),('line_manager','golms.learn'),('line_manager','golms.team.manage'),('line_manager','golms.report'),
  ('learner','tenant.read'),('learner','golms.learn')
on conflict do nothing;

create table v3_platform.role_grants (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references v3_platform.memberships(id) on delete cascade,
  role_key text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (membership_id, role_key, starts_at),
  check (role_key in ('tenant_owner','tenant_admin','learning_admin','compliance_admin','report_analyst','instructor','line_manager','learner')),
  check (ends_at is null or ends_at > starts_at)
);

create table v3_platform.products (
  key text primary key check (key in ('golms','golxp','gocatalog','goauthor_ai','gopm')),
  display_name text not null,
  status text not null check (status in ('planned','released','retired')),
  released_at timestamptz,
  check ((status = 'released' and released_at is not null) or status <> 'released')
);

insert into v3_platform.products(key, display_name, status, released_at) values
  ('golms','GOLMS','released',now()),
  ('golxp','GOLXP','planned',null),
  ('gocatalog','GOCATALOG','planned',null),
  ('goauthor_ai','GOAUTHOR AI','planned',null),
  ('gopm','GOPM','planned',null)
on conflict (key) do nothing;

create table v3_platform.tenant_trials (
  tenant_id uuid primary key references v3_platform.tenants(id) on delete restrict,
  started_at timestamptz not null,
  ends_at timestamptz not null,
  activated_by uuid not null references auth.users(id) on delete restrict,
  activated_at timestamptz not null default now(),
  check (ends_at = started_at + interval '14 days')
);

create table v3_platform.product_entitlements (
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  product_key text not null references v3_platform.products(key) on delete restrict,
  kind text not null check (kind in ('internal','trial','paid','disabled')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (tenant_id, product_key),
  check ((kind = 'trial' and ends_at is not null) or kind <> 'trial'),
  check (ends_at is null or ends_at > starts_at)
);

create table v3_hq.operators (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role_key text not null check (role_key in ('operator','support','billing','security')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table v3_hq.support_sessions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references v3_hq.operators(user_id) on delete restrict,
  tenant_id uuid not null references v3_platform.tenants(id) on delete restrict,
  reason text not null check (length(trim(reason)) >= 8),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at <= starts_at + interval '4 hours')
);

create table v3_audit.events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references v3_platform.tenants(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  correlation_id uuid not null default gen_random_uuid(),
  action text not null,
  object_type text not null,
  object_id text not null,
  reason text,
  occurred_at timestamptz not null default now()
);

create index memberships_user_active_idx on v3_platform.memberships(user_id, tenant_id) where status = 'active';
create index role_grants_membership_active_idx on v3_platform.role_grants(membership_id, starts_at, ends_at);
create index entitlements_product_kind_idx on v3_platform.product_entitlements(product_key, kind);
create index audit_tenant_time_idx on v3_audit.events(tenant_id, occurred_at desc);

create function v3_platform.is_active_member(target_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from v3_platform.memberships m
    where m.tenant_id = target_tenant
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.starts_at <= now()
      and (m.ends_at is null or m.ends_at > now())
  );
$$;

create function v3_platform.has_permission(target_tenant uuid, target_permission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from v3_platform.memberships m
    join v3_platform.role_grants g on g.membership_id = m.id
    join v3_platform.role_permissions p on p.role_key = g.role_key
    where m.tenant_id = target_tenant
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.starts_at <= now()
      and (m.ends_at is null or m.ends_at > now())
      and g.starts_at <= now()
      and (g.ends_at is null or g.ends_at > now())
      and p.permission_key = target_permission
  );
$$;

create function v3_hq.is_operator(required_roles text[] default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'aal' = 'aal2', false) and exists (
    select 1 from v3_hq.operators op
    where op.user_id = (select auth.uid())
      and op.active
      and (required_roles is null or op.role_key = any(required_roles))
  );
$$;

create function v3_platform.has_product_access(target_tenant uuid, target_product text, write_access boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select v3_platform.is_active_member(target_tenant) and exists (
    select 1
    from v3_platform.product_entitlements e
    join v3_platform.products p on p.key = e.product_key
    join v3_platform.tenants t on t.id = e.tenant_id
    where e.tenant_id = target_tenant
      and e.product_key = target_product
      and t.status = 'active'
      and e.starts_at <= now()
      and e.kind <> 'disabled'
      and (e.kind <> 'internal' or t.mode = 'internal_demo')
      and ((not write_access and p.status in ('released','retired')) or (write_access and p.status = 'released'))
      and (not write_access or e.ends_at is null or e.ends_at > now())
  );
$$;

create function public.v3_activate_trial(target_tenant uuid) returns v3_platform.tenant_trials
language plpgsql security definer set search_path = '' as $$
declare
  result v3_platform.tenant_trials;
begin
  if not v3_hq.is_operator(array['operator','billing']) then
    raise exception 'HQ_OPERATOR_MFA_REQUIRED' using errcode = '42501';
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

  insert into v3_audit.events(tenant_id, actor_id, action, object_type, object_id)
    values (target_tenant, (select auth.uid()), 'tenant.trial_activated', 'tenant', target_tenant::text);

  return result;
end;
$$;

create function public.v3_product_access(target_tenant uuid) returns table (
  product_key text,
  product_name text,
  release_status text,
  entitlement_kind text,
  can_read boolean,
  can_write boolean,
  ends_at timestamptz
) language plpgsql stable security definer set search_path = '' as $$
begin
  if not v3_platform.is_active_member(target_tenant) then
    raise exception 'TENANT_ACCESS_FORBIDDEN' using errcode = '42501';
  end if;
  return query
    select p.key, p.display_name, p.status, e.kind,
      v3_platform.has_product_access(target_tenant, p.key, false),
      v3_platform.has_product_access(target_tenant, p.key, true),
      e.ends_at
    from v3_platform.products p
    left join v3_platform.product_entitlements e
      on e.tenant_id = target_tenant and e.product_key = p.key
    order by p.display_name;
end;
$$;

alter table v3_platform.tenants enable row level security;
alter table v3_platform.portals enable row level security;
alter table v3_platform.memberships enable row level security;
alter table v3_platform.role_permissions enable row level security;
alter table v3_platform.role_grants enable row level security;
alter table v3_platform.products enable row level security;
alter table v3_platform.tenant_trials enable row level security;
alter table v3_platform.product_entitlements enable row level security;
alter table v3_hq.operators enable row level security;
alter table v3_hq.support_sessions enable row level security;
alter table v3_audit.events enable row level security;

create policy tenants_read on v3_platform.tenants for select to authenticated using (v3_platform.is_active_member(id));
create policy portals_read on v3_platform.portals for select to authenticated using (v3_platform.is_active_member(tenant_id));
create policy memberships_read on v3_platform.memberships for select to authenticated
  using (user_id = (select auth.uid()) or v3_platform.has_permission(tenant_id, 'membership.manage'));
create policy role_grants_read on v3_platform.role_grants for select to authenticated using (
  exists (
    select 1 from v3_platform.memberships m
    where m.id = role_grants.membership_id
      and (m.user_id = (select auth.uid()) or v3_platform.has_permission(m.tenant_id, 'membership.manage'))
  )
);
create policy role_permissions_read on v3_platform.role_permissions for select to authenticated using (true);
create policy products_read on v3_platform.products for select to authenticated using (true);
create policy trials_read on v3_platform.tenant_trials for select to authenticated using (v3_platform.is_active_member(tenant_id));
create policy entitlements_read on v3_platform.product_entitlements for select to authenticated using (v3_platform.is_active_member(tenant_id));

revoke all on schema v3_platform, v3_hq, v3_audit from public, anon, authenticated;
grant usage on schema v3_platform to authenticated;
revoke all on all tables in schema v3_platform, v3_hq, v3_audit from public, anon, authenticated;
grant select on v3_platform.tenants, v3_platform.portals, v3_platform.memberships, v3_platform.role_permissions, v3_platform.role_grants, v3_platform.products, v3_platform.tenant_trials, v3_platform.product_entitlements to authenticated;

revoke all on function v3_platform.is_active_member(uuid), v3_platform.has_permission(uuid,text), v3_platform.has_product_access(uuid,text,boolean), v3_hq.is_operator(text[]) from public, anon, authenticated;
grant execute on function v3_platform.is_active_member(uuid), v3_platform.has_permission(uuid,text), v3_platform.has_product_access(uuid,text,boolean) to authenticated;
revoke all on function public.v3_activate_trial(uuid), public.v3_product_access(uuid) from public, anon;
grant execute on function public.v3_activate_trial(uuid), public.v3_product_access(uuid) to authenticated;

commit;
