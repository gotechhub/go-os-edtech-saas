begin;

insert into v3_core.role_permissions(role_key, permission_key) values
  ('security_operator','core.privileged_actions.approve')
on conflict do nothing;

create table v3_core.privileged_action_requests (
  id uuid primary key default gen_random_uuid(),
  action_permission text not null check (action_permission like 'core.%'),
  object_type text not null check (length(trim(object_type)) between 2 and 80),
  object_id text not null check (length(trim(object_id)) between 1 and 200),
  reason text not null check (length(trim(reason)) >= 12),
  status text not null default 'pending' check (status in ('pending','approved','consumed','rejected','cancelled','expired')),
  requested_by uuid not null references v3_core.operators(user_id) on delete restrict,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  approved_by uuid references v3_core.operators(user_id) on delete restrict,
  approved_at timestamptz,
  consumed_by uuid references v3_core.operators(user_id) on delete restrict,
  consumed_at timestamptz,
  correlation_id uuid not null default gen_random_uuid(),
  check (expires_at > requested_at and expires_at <= requested_at + interval '1 hour'),
  check (approved_by is null or approved_by <> requested_by),
  check ((status in ('approved','consumed') and approved_by is not null and approved_at is not null) or status not in ('approved','consumed')),
  check ((status = 'consumed' and consumed_by is not null and consumed_at is not null) or status <> 'consumed')
);

create index core_privileged_action_queue_idx
  on v3_core.privileged_action_requests(status, expires_at, requested_at);

create function public.v3_core_request_privileged_action(
  target_permission text,
  target_object_type text,
  target_object_id text,
  request_reason text,
  ttl_minutes integer default 15
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  request_id uuid;
begin
  if not v3_core.has_permission(target_permission) then
    raise exception 'CORE_ACTION_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;
  if target_permission in ('core.read','core.audit.read','core.privileged_actions.approve') then
    raise exception 'CORE_ACTION_NOT_PRIVILEGED' using errcode = '22023';
  end if;
  if ttl_minutes < 5 or ttl_minutes > 60 then
    raise exception 'CORE_ACTION_TTL_INVALID' using errcode = '22023';
  end if;

  insert into v3_core.privileged_action_requests(
    action_permission, object_type, object_id, reason, requested_by, expires_at
  ) values (
    target_permission, trim(target_object_type), trim(target_object_id), trim(request_reason),
    (select auth.uid()), now() + make_interval(mins => ttl_minutes)
  ) returning id into request_id;

  insert into v3_audit.events(actor_id, control_plane, correlation_id, action, object_type, object_id, reason)
  select (select auth.uid()), 'os_core', r.correlation_id, 'core.privileged_action.requested',
    'privileged_action_request', r.id::text, r.reason
  from v3_core.privileged_action_requests r where r.id = request_id;
  return request_id;
end;
$$;

create function public.v3_core_approve_privileged_action(target_request uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  approved_count integer;
begin
  if not v3_core.has_permission('core.privileged_actions.approve') then
    raise exception 'CORE_APPROVER_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;

  update v3_core.privileged_action_requests r
    set status = 'approved', approved_by = (select auth.uid()), approved_at = now()
    where r.id = target_request
      and r.status = 'pending'
      and r.expires_at > now()
      and r.requested_by <> (select auth.uid());
  get diagnostics approved_count = row_count;
  if approved_count <> 1 then
    raise exception 'CORE_ACTION_NOT_APPROVABLE' using errcode = '42501';
  end if;

  insert into v3_audit.events(actor_id, control_plane, correlation_id, action, object_type, object_id)
  select (select auth.uid()), 'os_core', r.correlation_id, 'core.privileged_action.approved',
    'privileged_action_request', r.id::text
  from v3_core.privileged_action_requests r where r.id = target_request;
  return true;
end;
$$;

create function public.v3_core_consume_privileged_action(target_request uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  consumed_count integer;
  request_correlation uuid;
  required_permission text;
begin
  select r.action_permission into required_permission
  from v3_core.privileged_action_requests r where r.id = target_request;
  if required_permission is null or not v3_core.has_permission(required_permission) then
    raise exception 'CORE_ACTION_PERMISSION_MFA_REQUIRED' using errcode = '42501';
  end if;

  update v3_core.privileged_action_requests r
    set status = 'consumed', consumed_by = (select auth.uid()), consumed_at = now()
    where r.id = target_request
      and r.status = 'approved'
      and r.expires_at > now()
      and r.requested_by = (select auth.uid())
    returning r.correlation_id into request_correlation;
  get diagnostics consumed_count = row_count;
  if consumed_count <> 1 then
    raise exception 'CORE_ACTION_NOT_CONSUMABLE' using errcode = '42501';
  end if;

  insert into v3_audit.events(actor_id, control_plane, correlation_id, action, object_type, object_id)
    values ((select auth.uid()), 'os_core', request_correlation, 'core.privileged_action.consumed',
      'privileged_action_request', target_request::text);
  return request_correlation;
end;
$$;

alter table v3_core.privileged_action_requests enable row level security;
revoke all on v3_core.privileged_action_requests from public, anon, authenticated;
revoke all on function public.v3_core_request_privileged_action(text,text,text,text,integer),
  public.v3_core_approve_privileged_action(uuid), public.v3_core_consume_privileged_action(uuid)
  from public, anon;
grant execute on function public.v3_core_request_privileged_action(text,text,text,text,integer),
  public.v3_core_approve_privileged_action(uuid), public.v3_core_consume_privileged_action(uuid)
  to authenticated;

comment on table v3_core.privileged_action_requests is
  'Short-lived two-person approval tickets; consuming a ticket authorizes one matching command and never executes it by itself';

commit;
