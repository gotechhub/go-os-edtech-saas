begin;

create function public.v3_core_portal_inventory() returns table (
  tenant_id uuid,
  portal_id uuid,
  tenant_name text,
  tenant_mode text,
  tenant_status text,
  region text,
  default_locale text,
  portal_slug text,
  industry_key text,
  portal_status text,
  trial_ends_at timestamptz,
  entitlement_count bigint,
  observed_at timestamptz
) language plpgsql stable security definer set search_path='' as $$
begin
  if not v3_core.has_permission('core.read') then
    raise exception 'CORE_INVENTORY_PERMISSION_MFA_REQUIRED' using errcode='42501';
  end if;
  return query
    select t.id,p.id,t.display_name,t.mode,t.status,t.region,t.default_locale,
      p.slug,p.industry_key,p.status,tr.ends_at,
      (select count(*) from v3_platform.product_entitlements e where e.tenant_id=t.id),now()
    from v3_platform.tenants t
    join v3_platform.portals p on p.tenant_id=t.id
    left join v3_platform.tenant_trials tr on tr.tenant_id=t.id
    order by t.created_at,p.created_at;
end;
$$;

revoke all on function public.v3_core_portal_inventory() from public,anon;
grant execute on function public.v3_core_portal_inventory() to authenticated;
comment on function public.v3_core_portal_inventory() is 'OS Core technical tenant/portal inventory; excludes memberships and customer content';

commit;
