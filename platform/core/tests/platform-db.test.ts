import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OPERATOR = "81000000-0000-4000-8000-000000000001";
const SUPPORT = "81000000-0000-4000-8000-000000000002";
const OWNER = "81000000-0000-4000-8000-000000000003";
const LEARNER = "81000000-0000-4000-8000-000000000004";
const OUTSIDER = "81000000-0000-4000-8000-000000000005";
const CUSTOMER = "82000000-0000-4000-8000-000000000001";
const OTHER = "82000000-0000-4000-8000-000000000002";
const DEMO = "82000000-0000-4000-8000-000000000003";
let db: PGlite;

async function asUser<T>(id: string, assurance: "aal1" | "aal2", operation: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.query("select set_config('request.jwt.claim.aal',$1,false)", [assurance]);
  await db.exec("set role authenticated");
  try { return await operation(); } finally { await db.exec("reset role"); }
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, email text not null);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid(), auth.jwt() to authenticated;
  `);
  await db.exec(readFileSync("supabase/migrations/202609270001_v3_platform_foundation.sql", "utf8"));
  await db.exec(`
    insert into auth.users(id,email) values
      ('${OPERATOR}','operator@test.local'),('${SUPPORT}','support@test.local'),('${OWNER}','owner@test.local'),
      ('${LEARNER}','learner@test.local'),('${OUTSIDER}','outsider@test.local');
    insert into v3_platform.tenants(id,legal_name,display_name,mode,status) values
      ('${CUSTOMER}','Customer A','Customer A','customer','active'),
      ('${OTHER}','Customer B','Customer B','customer','active'),
      ('${DEMO}','Internal Demo','Internal Demo','internal_demo','active');
    insert into v3_platform.portals(tenant_id,slug,industry_key,status) values
      ('${CUSTOMER}','customer-a','legal','active'),('${OTHER}','customer-b','hospitality','active'),('${DEMO}','demo','legal','active');
    insert into v3_platform.memberships(id,tenant_id,user_id,status) values
      ('83000000-0000-4000-8000-000000000001','${CUSTOMER}','${OWNER}','active'),
      ('83000000-0000-4000-8000-000000000002','${CUSTOMER}','${LEARNER}','active'),
      ('83000000-0000-4000-8000-000000000003','${OTHER}','${OUTSIDER}','active');
    insert into v3_platform.role_grants(membership_id,role_key) values
      ('83000000-0000-4000-8000-000000000001','tenant_owner'),
      ('83000000-0000-4000-8000-000000000002','learner'),
      ('83000000-0000-4000-8000-000000000003','tenant_owner');
    insert into v3_hq.operators(user_id,role_key) values ('${OPERATOR}','operator'),('${SUPPORT}','support');
    insert into v3_platform.product_entitlements(tenant_id,product_key,kind,starts_at) values ('${DEMO}','golms','internal',now());
  `);
});

afterAll(async () => db?.close());

describe("Respongo OS platform migration and RLS", () => {
  it("requires an HQ operator with MFA to activate a customer trial", async () => {
    await expect(asUser(OWNER, "aal2", () => db.query("select * from public.v3_activate_trial($1)", [CUSTOMER]))).rejects.toThrow("HQ_OPERATOR_MFA_REQUIRED");
    await expect(asUser(OPERATOR, "aal1", () => db.query("select * from public.v3_activate_trial($1)", [CUSTOMER]))).rejects.toThrow("HQ_OPERATOR_MFA_REQUIRED");
    await expect(asUser(SUPPORT, "aal2", () => db.query("select * from public.v3_activate_trial($1)", [CUSTOMER]))).rejects.toThrow("HQ_OPERATOR_MFA_REQUIRED");
  });

  it("starts one clock, grants only released products and stays idempotent", async () => {
    const first = await asUser(OPERATOR, "aal2", () => db.query<{ started_at: string; ends_at: string }>("select * from public.v3_activate_trial($1)", [CUSTOMER]));
    const second = await asUser(OPERATOR, "aal2", () => db.query<{ started_at: string; ends_at: string }>("select * from public.v3_activate_trial($1)", [CUSTOMER]));
    expect(Date.parse(second.rows[0].started_at)).toBe(Date.parse(first.rows[0].started_at));
    expect(Date.parse(first.rows[0].ends_at) - Date.parse(first.rows[0].started_at)).toBe(14 * 24 * 60 * 60 * 1000);
    const grants = await db.query<{ product_key: string }>("select product_key from v3_platform.product_entitlements where tenant_id=$1 order by product_key", [CUSTOMER]);
    expect(grants.rows.map((item) => item.product_key)).toEqual(["golms"]);
    const audit = await db.query<{ count: string }>("select count(*) from v3_audit.events where tenant_id=$1 and action='tenant.trial_activated'", [CUSTOMER]);
    expect(Number(audit.rows[0].count)).toBe(1);
  });

  it("keeps an internal demo outside the customer trial", async () => {
    await expect(asUser(OPERATOR, "aal2", () => db.query("select * from public.v3_activate_trial($1)", [DEMO]))).rejects.toThrow("ACTIVE_CUSTOMER_TENANT_REQUIRED");
    const demoTrials = await db.query<{ count: string }>("select count(*) from v3_platform.tenant_trials where tenant_id=$1", [DEMO]);
    expect(Number(demoTrials.rows[0].count)).toBe(0);
  });

  it("enforces tenant isolation for RLS reads", async () => {
    const own = await asUser(OWNER, "aal1", () => db.query<{ display_name: string }>("select display_name from v3_platform.tenants order by display_name"));
    expect(own.rows.map((item) => item.display_name)).toEqual(["Customer A"]);
    const other = await asUser(OUTSIDER, "aal1", () => db.query<{ display_name: string }>("select display_name from v3_platform.tenants order by display_name"));
    expect(other.rows.map((item) => item.display_name)).toEqual(["Customer B"]);
  });

  it("keeps expired trial data readable while every product write is denied", async () => {
    const before = await asUser(LEARNER, "aal1", () => db.query<{ can_read: boolean; can_write: boolean }>("select v3_platform.has_product_access($1,'golms',false) can_read,v3_platform.has_product_access($1,'golms',true) can_write", [CUSTOMER]));
    expect(before.rows[0]).toMatchObject({ can_read: true, can_write: true });
    await db.exec(`update v3_platform.tenant_trials set started_at=now()-interval '15 days',ends_at=now()-interval '1 day' where tenant_id='${CUSTOMER}';
      update v3_platform.product_entitlements set starts_at=now()-interval '15 days',ends_at=now()-interval '1 day' where tenant_id='${CUSTOMER}' and kind='trial';`);
    const after = await asUser(LEARNER, "aal1", () => db.query<{ can_read: boolean; can_write: boolean }>("select v3_platform.has_product_access($1,'golms',false) can_read,v3_platform.has_product_access($1,'golms',true) can_write", [CUSTOMER]));
    expect(after.rows[0]).toMatchObject({ can_read: true, can_write: false });
    const matrix = await asUser(OWNER, "aal1", () => db.query<{ product_key: string; can_read: boolean; can_write: boolean }>("select * from public.v3_product_access($1)", [CUSTOMER]));
    expect(matrix.rows.find((item) => item.product_key === "golms")).toMatchObject({ can_read: true, can_write: false });
    expect(matrix.rows.find((item) => item.product_key === "gopm")).toMatchObject({ can_read: false, can_write: false });
  });

  it("does not grant tenant permissions from a different tenant role", async () => {
    const foreign = await asUser(OUTSIDER, "aal1", () => db.query<{ allowed: boolean }>("select v3_platform.has_permission($1,'golms.manage') allowed", [CUSTOMER]));
    expect(foreign.rows[0].allowed).toBe(false);
    await expect(asUser(OUTSIDER, "aal1", () => db.query("select * from public.v3_product_access($1)", [CUSTOMER]))).rejects.toThrow("TENANT_ACCESS_FORBIDDEN");
  });
});
