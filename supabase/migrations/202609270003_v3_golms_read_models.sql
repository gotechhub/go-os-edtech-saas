-- Role-scoped read models for web, mobile and reporting surfaces.
begin;

create function public.v3_golms_list_programs(target_tenant uuid)
returns table(id uuid,title text,status text,version integer,locale text,step_count bigint,published_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not v3_platform.has_product_access(target_tenant,'golms',false) or not (
    v3_platform.has_permission(target_tenant,'golms.manage') or v3_platform.has_permission(target_tenant,'golms.report')
  ) then raise exception 'GOLMS_PROGRAM_LIST_FORBIDDEN' using errcode='42501'; end if;
  return query
    select v.id,v.title,v.status,v.version,v.locale,count(s.id),v.published_at
    from v3_golms.program_versions v
    left join v3_golms.program_steps s on s.program_version_id=v.id and s.tenant_id=v.tenant_id
    where v.tenant_id=target_tenant
    group by v.id,v.title,v.status,v.version,v.locale,v.published_at,v.created_at
    order by v.created_at desc;
end;
$$;

create function public.v3_golms_my_enrollments(target_tenant uuid)
returns table(id uuid,program_version_id uuid,program_title text,status text,required boolean,available_at timestamptz,due_at timestamptz,progress_percent integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not v3_platform.has_product_access(target_tenant,'golms',false) then raise exception 'GOLMS_LEARNING_LIST_FORBIDDEN' using errcode='42501'; end if;
  return query
    select e.id,e.program_version_id,p.title,e.status,a.required,a.available_at,a.due_at,
      case when required_steps.total=0 then 100 else round(100.0*coalesce(satisfied_steps.total,0)/required_steps.total)::integer end
    from v3_golms.enrollments e
    join v3_golms.assignments a on a.id=e.assignment_id and a.tenant_id=e.tenant_id
    join v3_golms.program_versions p on p.id=e.program_version_id and p.tenant_id=e.tenant_id
    cross join lateral (select count(*)::integer total from v3_golms.program_steps s where s.program_version_id=e.program_version_id and s.required) required_steps
    cross join lateral (
      select count(*)::integer total from v3_golms.program_steps s
      where s.program_version_id=e.program_version_id and s.required and exists (
        select 1 from v3_golms.attempts t where t.enrollment_id=e.id and t.program_step_id=s.id and t.completion_status='complete'
          and (s.completion_rule='complete' or t.success_status='passed')
      )
    ) satisfied_steps
    where e.tenant_id=target_tenant and e.learner_id=(select auth.uid()) and a.status='assigned'
    order by (a.due_at is null),a.due_at,a.assigned_at desc;
end;
$$;

revoke all on function public.v3_golms_list_programs(uuid),public.v3_golms_my_enrollments(uuid) from public,anon;
grant execute on function public.v3_golms_list_programs(uuid),public.v3_golms_my_enrollments(uuid) to authenticated;

commit;
