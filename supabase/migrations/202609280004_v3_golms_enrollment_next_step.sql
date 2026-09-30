-- Adds the server-authorized next actionable program step to learner enrollment cards.
begin;

drop function public.v3_golms_my_enrollments(uuid);
create function public.v3_golms_my_enrollments(target_tenant uuid)
returns table(id uuid,program_version_id uuid,program_title text,status text,required boolean,available_at timestamptz,due_at timestamptz,progress_percent integer,next_step_id uuid,next_step_kind text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not v3_platform.has_product_access(target_tenant,'golms',false) then raise exception 'GOLMS_LEARNING_LIST_FORBIDDEN' using errcode='42501'; end if;
  return query
    select e.id,e.program_version_id,p.title,e.status,a.required,a.available_at,a.due_at,
      case when required_steps.total=0 then 100 else round(100.0*coalesce(satisfied_steps.total,0)/required_steps.total)::integer end,
      next_step.id,next_step.kind
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
    left join lateral (
      select s.id,s.kind from v3_golms.program_steps s
      where s.program_version_id=e.program_version_id and not exists (
        select 1 from v3_golms.attempts t where t.enrollment_id=e.id and t.program_step_id=s.id and t.completion_status='complete'
          and (s.completion_rule='complete' or t.success_status='passed')
      ) order by s.position limit 1
    ) next_step on true
    where e.tenant_id=target_tenant and e.learner_id=(select auth.uid()) and a.status='assigned'
    order by (a.due_at is null),a.due_at,a.assigned_at desc;
end;
$$;

revoke all on function public.v3_golms_my_enrollments(uuid) from public,anon;
grant execute on function public.v3_golms_my_enrollments(uuid) to authenticated;

commit;
