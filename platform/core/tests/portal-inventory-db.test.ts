import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CORE="94000000-0000-4000-8000-000000000001", CUSTOMER="94000000-0000-4000-8000-000000000002", T1="95000000-0000-4000-8000-000000000001", T2="95000000-0000-4000-8000-000000000002";
let db:PGlite;
async function asUser<T>(id:string,aal:"aal1"|"aal2",fn:()=>Promise<T>){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.query("select set_config('request.jwt.claim.aal',$1,false)",[aal]);await db.exec("set role authenticated");try{return await fn();}finally{await db.exec("reset role");}}

beforeAll(async()=>{
  db=new PGlite({extensions:{pgcrypto}});
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text not null);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;grant usage on schema auth to authenticated;grant execute on function auth.uid(),auth.jwt() to authenticated;`);
  await db.exec(readFileSync("supabase/migrations/202609270001_v3_platform_foundation.sql","utf8"));
  await db.exec(`insert into auth.users(id,email) values ('${CORE}','core@test.local'),('${CUSTOMER}','customer@test.local');insert into v3_hq.operators(user_id,role_key) values ('${CORE}','security');insert into v3_platform.tenants(id,legal_name,display_name,mode,status,region) values ('${T1}','A','Tenant A','customer','active','eu-north-1'),('${T2}','B','Internal Demo','internal_demo','active','eu-north-1');insert into v3_platform.portals(tenant_id,slug,industry_key,status) values ('${T1}','tenant-a','legal','active'),('${T2}','internal-demo','generic','draft');insert into v3_platform.memberships(tenant_id,user_id,status) values ('${T1}','${CUSTOMER}','active');`);
  await db.exec(readFileSync("supabase/migrations/202609300001_v3_internal_control_planes.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010003_v3_core_portal_inventory.sql","utf8"));
});
afterAll(async()=>db?.close());

describe("OS Core portal technical inventory",()=>{
  it("requires an MFA Core operator",async()=>{
    await expect(asUser(CUSTOMER,"aal2",()=>db.query("select * from public.v3_core_portal_inventory()"))).rejects.toThrow("CORE_INVENTORY_PERMISSION_MFA_REQUIRED");
    await expect(asUser(CORE,"aal1",()=>db.query("select * from public.v3_core_portal_inventory()"))).rejects.toThrow("CORE_INVENTORY_PERMISSION_MFA_REQUIRED");
  });
  it("returns technical metadata without membership or user fields",async()=>{
    const result=await asUser(CORE,"aal2",()=>db.query<Record<string,unknown>>("select * from public.v3_core_portal_inventory()"));
    expect(result.rows).toHaveLength(2);
    expect(result.fields.map(field=>field.name)).not.toContain("user_id");
    expect(result.fields.map(field=>field.name)).not.toContain("email");
    expect(result.rows.map(row=>row.tenant_mode)).toEqual(["customer","internal_demo"]);
  });
});
