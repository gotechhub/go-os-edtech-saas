import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RELEASE = "91000000-0000-4000-8000-000000000001";
const SECURITY = "91000000-0000-4000-8000-000000000002";
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
    create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, email text not null);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid(),auth.jwt() to authenticated;
  `);
  await db.exec(readFileSync("supabase/migrations/202609270001_v3_platform_foundation.sql", "utf8"));
  await db.exec(`insert into auth.users(id,email) values ('${RELEASE}','release@test.local'),('${SECURITY}','security@test.local');
    insert into v3_hq.operators(user_id,role_key) values ('${SECURITY}','security');`);
  await db.exec(readFileSync("supabase/migrations/202609300001_v3_internal_control_planes.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010001_v3_core_privileged_approvals.sql", "utf8"));
  await db.exec(`insert into v3_core.operators(user_id) values ('${RELEASE}');
    insert into v3_core.role_grants(user_id,role_key,reason) values ('${RELEASE}','release_manager','Release duty assignment');`);
});

afterAll(async () => db?.close());

describe("OS Core privileged action approvals", () => {
  it("requires MFA and the exact action permission", async () => {
    await expect(asUser(RELEASE, "aal1", () => db.query("select public.v3_core_request_privileged_action('core.release.manage','release','r1','Production rollout approval')"))).rejects.toThrow("CORE_ACTION_PERMISSION_MFA_REQUIRED");
    await expect(asUser(RELEASE, "aal2", () => db.query("select public.v3_core_request_privileged_action('core.security.manage','incident','i1','Unauthorized action attempt')"))).rejects.toThrow("CORE_ACTION_PERMISSION_MFA_REQUIRED");
  });

  it("requires a different security operator and permits one consumption", async () => {
    const requested = await asUser(RELEASE, "aal2", () => db.query<{ id: string }>("select public.v3_core_request_privileged_action('core.release.manage','release','r2','Production release requires approval') id"));
    const id = requested.rows[0].id;
    await expect(asUser(RELEASE, "aal2", () => db.query("select public.v3_core_approve_privileged_action($1)", [id]))).rejects.toThrow("CORE_APPROVER_PERMISSION_MFA_REQUIRED");
    await expect(asUser(SECURITY, "aal1", () => db.query("select public.v3_core_approve_privileged_action($1)", [id]))).rejects.toThrow("CORE_APPROVER_PERMISSION_MFA_REQUIRED");
    await asUser(SECURITY, "aal2", () => db.query("select public.v3_core_approve_privileged_action($1)", [id]));
    const consumed = await asUser(RELEASE, "aal2", () => db.query<{ correlation: string }>("select public.v3_core_consume_privileged_action($1) correlation", [id]));
    expect(consumed.rows[0].correlation).toMatch(/^[0-9a-f-]{36}$/);
    await expect(asUser(RELEASE, "aal2", () => db.query("select public.v3_core_consume_privileged_action($1)", [id]))).rejects.toThrow("CORE_ACTION_NOT_CONSUMABLE");
  });

  it("rejects expired approval requests", async () => {
    const requested = await asUser(RELEASE, "aal2", () => db.query<{ id: string }>("select public.v3_core_request_privileged_action('core.release.manage','release','r3','Emergency release review request') id"));
    await db.query("update v3_core.privileged_action_requests set requested_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' where id=$1", [requested.rows[0].id]);
    await expect(asUser(SECURITY, "aal2", () => db.query("select public.v3_core_approve_privileged_action($1)", [requested.rows[0].id]))).rejects.toThrow("CORE_ACTION_NOT_APPROVABLE");
  });

  it("records request, approval and consumption under one correlation id", async () => {
    const rows = await db.query<{ correlation_id: string; count: string }>("select correlation_id,count(*) from v3_audit.events where action like 'core.privileged_action.%' group by correlation_id having count(*)=3");
    expect(rows.rows).toHaveLength(1);
    expect(Number(rows.rows[0].count)).toBe(3);
  });
});
