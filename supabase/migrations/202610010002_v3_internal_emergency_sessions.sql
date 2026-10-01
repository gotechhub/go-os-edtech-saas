begin;

create table v3_core.break_glass_sessions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references v3_core.operators(user_id) on delete restrict,
  action_permission text not null check (action_permission like 'core.%'),
  incident_reference text not null check (length(trim(incident_reference)) between 3 and 100),
  reason text not null check (length(trim(reason)) >= 20),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  revoked_at timestamptz,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at <= starts_at + interval '30 minutes')
);

create index core_break_glass_active_idx
  on v3_core.break_glass_sessions(operator_id, ends_at) where revoked_at is null;

create function public.v3_hq_open_support_session(
  target_tenant uuid,
  session_reason text,
  ttl_minutes integer default 60
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare session_id uuid;
begin
  if not v3_hq.has_permission('hq.support_session.manage') then
    raise exception 'HQ_SUPPORT_SESSION_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;
  if ttl_minutes < 5 or ttl_minutes > 240 then
    raise exception 'HQ_SUPPORT_SESSION_TTL_INVALID' using errcode = '22023';
  end if;
  perform 1 from v3_platform.tenants where id = target_tenant and status = 'active';
  if not found then raise exception 'ACTIVE_TENANT_REQUIRED' using errcode = '42501'; end if;

  insert into v3_hq.support_sessions(operator_id,tenant_id,reason,starts_at,ends_at)
    values ((select auth.uid()),target_tenant,trim(session_reason),now(),now()+make_interval(mins=>ttl_minutes))
    returning id into session_id;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,action,object_type,object_id,reason)
    values (target_tenant,(select auth.uid()),'super_admin','hq.support_session.opened','support_session',session_id::text,trim(session_reason));
  return session_id;
end;
$$;

create function public.v3_hq_revoke_support_session(target_session uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare changed integer; target_tenant uuid;
begin
  if not v3_hq.has_permission('hq.support_session.manage') then
    raise exception 'HQ_SUPPORT_SESSION_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;
  update v3_hq.support_sessions set revoked_at=now()
    where id=target_session and revoked_at is null
    returning tenant_id into target_tenant;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'HQ_SUPPORT_SESSION_NOT_REVOCABLE' using errcode='42501'; end if;
  insert into v3_audit.events(tenant_id,actor_id,control_plane,action,object_type,object_id)
    values (target_tenant,(select auth.uid()),'super_admin','hq.support_session.revoked','support_session',target_session::text);
  return true;
end;
$$;

create function v3_hq.has_active_support_session(target_tenant uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select v3_hq.has_permission('hq.support_session.manage') and exists(
    select 1 from v3_hq.support_sessions s
    where s.operator_id=(select auth.uid()) and s.tenant_id=target_tenant
      and s.starts_at<=now() and s.ends_at>now() and s.revoked_at is null
  );
$$;

create function public.v3_core_open_break_glass(
  target_permission text,
  incident_reference text,
  emergency_reason text,
  ttl_minutes integer default 15
) returns uuid
language plpgsql security definer set search_path='' as $$
declare session_id uuid;
begin
  if not v3_core.has_permission(target_permission) then
    raise exception 'CORE_BREAK_GLASS_PERMISSION_MFA_REQUIRED' using errcode='42501';
  end if;
  if target_permission in ('core.read','core.audit.read','core.privileged_actions.approve') then
    raise exception 'CORE_BREAK_GLASS_ACTION_INVALID' using errcode='22023';
  end if;
  if ttl_minutes < 5 or ttl_minutes > 30 then
    raise exception 'CORE_BREAK_GLASS_TTL_INVALID' using errcode='22023';
  end if;
  insert into v3_core.break_glass_sessions(operator_id,action_permission,incident_reference,reason,ends_at)
    values ((select auth.uid()),target_permission,trim(incident_reference),trim(emergency_reason),now()+make_interval(mins=>ttl_minutes))
    returning id into session_id;
  insert into v3_audit.events(actor_id,control_plane,correlation_id,action,object_type,object_id,reason)
    select (select auth.uid()),'os_core',s.correlation_id,'core.break_glass.opened','break_glass_session',s.id::text,s.reason
    from v3_core.break_glass_sessions s where s.id=session_id;
  return session_id;
end;
$$;

create function public.v3_core_revoke_break_glass(target_session uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare changed integer; session_correlation uuid;
begin
  update v3_core.break_glass_sessions s set revoked_at=now()
    where s.id=target_session and s.operator_id=(select auth.uid()) and s.revoked_at is null
      and v3_core.has_permission(s.action_permission)
    returning s.correlation_id into session_correlation;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'CORE_BREAK_GLASS_NOT_REVOCABLE' using errcode='42501'; end if;
  insert into v3_audit.events(actor_id,control_plane,correlation_id,action,object_type,object_id)
    values ((select auth.uid()),'os_core',session_correlation,'core.break_glass.revoked','break_glass_session',target_session::text);
  return true;
end;
$$;

create function v3_core.has_active_break_glass(target_session uuid,target_permission text) returns boolean
language sql stable security definer set search_path='' as $$
  select v3_core.has_permission(target_permission) and exists(
    select 1 from v3_core.break_glass_sessions s
    where s.id=target_session and s.operator_id=(select auth.uid())
      and s.action_permission=target_permission and s.starts_at<=now() and s.ends_at>now() and s.revoked_at is null
  );
$$;

alter table v3_core.break_glass_sessions enable row level security;
revoke all on v3_core.break_glass_sessions from public,anon,authenticated;
grant usage on schema v3_hq to authenticated;
revoke all on function public.v3_hq_open_support_session(uuid,text,integer),public.v3_hq_revoke_support_session(uuid),
  v3_hq.has_active_support_session(uuid),public.v3_core_open_break_glass(text,text,text,integer),
  public.v3_core_revoke_break_glass(uuid),v3_core.has_active_break_glass(uuid,text) from public,anon,authenticated;
grant execute on function public.v3_hq_open_support_session(uuid,text,integer),public.v3_hq_revoke_support_session(uuid),
  v3_hq.has_active_support_session(uuid),public.v3_core_open_break_glass(text,text,text,integer),
  public.v3_core_revoke_break_glass(uuid),v3_core.has_active_break_glass(uuid,text) to authenticated;

commit;
