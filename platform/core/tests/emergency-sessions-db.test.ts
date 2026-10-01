import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SUPPORT="92000000-0000-4000-8000-000000000001", RELEASE="92000000-0000-4000-8000-000000000002", TENANT="93000000-0000-4000-8000-000000000001", CUSTOMER="92000000-0000-4000-8000-000000000003";
let db:PGlite;
async function asUser<T>(id:string,aal:"aal1"|"aal2",fn:()=>Promise<T>){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.query("select set_config('request.jwt.claim.aal',$1,false)",[aal]);await db.exec("set role authenticated");try{return await fn();}finally{await db.exec("reset role");}}

beforeAll(async()=>{
  db=new PGlite({extensions:{pgcrypto}});
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text not null);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;grant usage on schema auth to authenticated;grant execute on function auth.uid(),auth.jwt() to authenticated;`);
  await db.exec(readFileSync("supabase/migrations/202609270001_v3_platform_foundation.sql","utf8"));
  await db.exec(`insert into auth.users(id,email) values ('${SUPPORT}','support@test.local'),('${RELEASE}','release@test.local'),('${CUSTOMER}','customer@test.local');insert into v3_platform.tenants(id,legal_name,display_name,mode,status) values ('${TENANT}','Tenant','Tenant','customer','active');insert into v3_hq.operators(user_id,role_key) values ('${SUPPORT}','support');`);
  await db.exec(readFileSync("supabase/migrations/202609300001_v3_internal_control_planes.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010001_v3_core_privileged_approvals.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010002_v3_internal_emergency_sessions.sql","utf8"));
  await db.exec(`insert into v3_core.operators(user_id) values ('${RELEASE}');insert into v3_core.role_grants(user_id,role_key,reason) values ('${RELEASE}','release_manager','Release emergency responsibility');`);
});
afterAll(async()=>db?.close());

describe("internal emergency sessions",()=>{
  it("opens tenant-scoped support only for MFA HQ support",async()=>{
    await expect(asUser(CUSTOMER,"aal2",()=>db.query("select public.v3_hq_open_support_session($1,'Customer approved investigation',30)",[TENANT]))).rejects.toThrow("HQ_SUPPORT_SESSION_PERMISSION_MFA_REQUIRED");
    await expect(asUser(SUPPORT,"aal1",()=>db.query("select public.v3_hq_open_support_session($1,'Customer approved investigation',30)",[TENANT]))).rejects.toThrow("HQ_SUPPORT_SESSION_PERMISSION_MFA_REQUIRED");
    const opened=await asUser(SUPPORT,"aal2",()=>db.query<{id:string}>("select public.v3_hq_open_support_session($1,'Customer approved investigation',30) id",[TENANT]));
    const active=await asUser(SUPPORT,"aal2",()=>db.query<{allowed:boolean}>("select v3_hq.has_active_support_session($1) allowed",[TENANT]));
    expect(active.rows[0].allowed).toBe(true);
    await asUser(SUPPORT,"aal2",()=>db.query("select public.v3_hq_revoke_support_session($1)",[opened.rows[0].id]));
    const revoked=await asUser(SUPPORT,"aal2",()=>db.query<{allowed:boolean}>("select v3_hq.has_active_support_session($1) allowed",[TENANT]));
    expect(revoked.rows[0].allowed).toBe(false);
  });

  it("limits break-glass to the operator permission and 30 minutes",async()=>{
    await expect(asUser(RELEASE,"aal1",()=>db.query("select public.v3_core_open_break_glass('core.release.manage','INC-1','Emergency release rollback required',15)"))).rejects.toThrow("CORE_BREAK_GLASS_PERMISSION_MFA_REQUIRED");
    await expect(asUser(RELEASE,"aal2",()=>db.query("select public.v3_core_open_break_glass('core.security.manage','INC-1','Emergency security change required',15)"))).rejects.toThrow("CORE_BREAK_GLASS_PERMISSION_MFA_REQUIRED");
    await expect(asUser(RELEASE,"aal2",()=>db.query("select public.v3_core_open_break_glass('core.release.manage','INC-1','Emergency release rollback required',31)"))).rejects.toThrow("CORE_BREAK_GLASS_TTL_INVALID");
    const opened=await asUser(RELEASE,"aal2",()=>db.query<{id:string}>("select public.v3_core_open_break_glass('core.release.manage','INC-1','Emergency release rollback required',15) id"));
    const active=await asUser(RELEASE,"aal2",()=>db.query<{allowed:boolean}>("select v3_core.has_active_break_glass($1,'core.release.manage') allowed",[opened.rows[0].id]));
    expect(active.rows[0].allowed).toBe(true);
    await asUser(RELEASE,"aal2",()=>db.query("select public.v3_core_revoke_break_glass($1)",[opened.rows[0].id]));
    const revoked=await asUser(RELEASE,"aal2",()=>db.query<{allowed:boolean}>("select v3_core.has_active_break_glass($1,'core.release.manage') allowed",[opened.rows[0].id]));
    expect(revoked.rows[0].allowed).toBe(false);
  });

  it("writes open and revoke events without exposing session tables",async()=>{
    const audit=await db.query<{action:string}>("select action from v3_audit.events where action in ('hq.support_session.opened','hq.support_session.revoked','core.break_glass.opened','core.break_glass.revoked') order by action");
    expect(audit.rows.map(x=>x.action)).toEqual(['core.break_glass.opened','core.break_glass.revoked','hq.support_session.opened','hq.support_session.revoked']);
    await expect(asUser(SUPPORT,"aal2",()=>db.query("select * from v3_hq.support_sessions"))).rejects.toThrow();
  });
});
