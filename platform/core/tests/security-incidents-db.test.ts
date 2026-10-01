import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SECURITY_A = "b1000000-0000-4000-8000-000000000001";
const SECURITY_B = "b1000000-0000-4000-8000-000000000002";
const CUSTOMER = "b1000000-0000-4000-8000-000000000003";
const TENANT = "b2000000-0000-4000-8000-000000000001";
const OTHER_TENANT = "b2000000-0000-4000-8000-000000000002";
const SESSION_REFERENCE = "b3000000-0000-4000-8000-000000000001";
const SHA = "c".repeat(64);
let db: PGlite;
let signalId: string;
let incidentId: string;
let revocationId: string;

async function asUser<T>(id: string, aal: "aal1" | "aal2", operation: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.query("select set_config('request.jwt.claim.aal',$1,false)", [aal]);
  await db.exec("set role authenticated");
  try { return await operation(); } finally { await db.exec("reset role"); }
}

async function asService<T>(operation: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.role','service_role',false)");
  await db.exec("set role service_role");
  try { return await operation(); } finally { await db.exec("reset role"); }
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key,email text not null);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;
    create function auth.role() returns text language sql stable as $$select nullif(current_setting('request.jwt.claim.role',true),'')$$;
    grant usage on schema auth to authenticated,service_role;
    grant execute on function auth.uid(),auth.jwt(),auth.role() to authenticated,service_role;
  `);
  await db.exec(readFileSync("supabase/migrations/202609270001_v3_platform_foundation.sql", "utf8"));
  await db.exec(`
    insert into auth.users(id,email) values
      ('${SECURITY_A}','security-a@test.local'),('${SECURITY_B}','security-b@test.local'),('${CUSTOMER}','customer@test.local');
    insert into v3_hq.operators(user_id,role_key) values ('${SECURITY_A}','security'),('${SECURITY_B}','security');
    insert into v3_platform.tenants(id,legal_name,display_name,mode,status) values
      ('${TENANT}','Tenant A','Tenant A','customer','active'),('${OTHER_TENANT}','Tenant B','Tenant B','customer','active');
  `);
  await db.exec(readFileSync("supabase/migrations/202609300001_v3_internal_control_planes.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010001_v3_core_privileged_approvals.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010007_v3_core_security_incidents.sql", "utf8"));
});

afterAll(async () => db?.close());

describe("OS Core security incidents and audit", () => {
  it("ingests one idempotent minimized security signal via service role", async () => {
    const first = await asService(() => db.query<{ id: string }>(
      "select public.v3_security_record_signal($1,'supabase_auth','provider-event-001','auth.session.anomaly','high','AUTH_SESSION_ANOMALY',$2,now()) id",
      [TENANT, `sha256:${SHA}`],
    ));
    const duplicate = await asService(() => db.query<{ id: string }>(
      "select public.v3_security_record_signal($1,'supabase_auth','provider-event-001','auth.session.anomaly','high','AUTH_SESSION_ANOMALY',$2,now()) id",
      [TENANT, `sha256:${SHA}`],
    ));
    signalId = first.rows[0].id;
    expect(duplicate.rows[0].id).toBe(signalId);
  });

  it("denies tenant and AAL1 users from incident and audit projections", async () => {
    await expect(asUser(CUSTOMER, "aal2", () => db.query("select * from public.v3_core_security_overview()")))
      .rejects.toThrow("CORE_AUDIT_PERMISSION_MFA_REQUIRED");
    await expect(asUser(SECURITY_A, "aal1", () => db.query("select * from public.v3_core_audit_search()")))
      .rejects.toThrow("CORE_AUDIT_PERMISSION_MFA_REQUIRED");
  });

  it("opens one incident, stores evidence digest and enforces runbook order", async () => {
    const first = await asUser(SECURITY_A, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_open_security_incident($1,'SUSPICIOUS_SESSION_ACTIVITY','high') id", [signalId],
    ));
    const duplicate = await asUser(SECURITY_A, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_open_security_incident($1,'SUSPICIOUS_SESSION_ACTIVITY','high') id", [signalId],
    ));
    incidentId = first.rows[0].id;
    expect(duplicate.rows[0].id).toBe(incidentId);
    const evidence = await asUser(SECURITY_A, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_add_incident_evidence($1,'provider_event','evidence/security/provider-event-001',$2) id",
      [incidentId, SHA],
    ));
    const sameEvidence = await asUser(SECURITY_A, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_add_incident_evidence($1,'provider_event','evidence/security/provider-event-001',$2) id",
      [incidentId, SHA],
    ));
    expect(sameEvidence.rows[0].id).toBe(evidence.rows[0].id);
    await expect(asUser(SECURITY_A, "aal2", () => db.query(
      "select public.v3_core_record_incident_action($1,'close','FALSE_POSITIVE')", [incidentId],
    ))).rejects.toThrow("INCIDENT_RUNBOOK_TRANSITION_INVALID");
    await asUser(SECURITY_A, "aal2", () => db.query(
      "select public.v3_core_record_incident_action($1,'triage','SESSION_CONFIRMED')", [incidentId],
    ));
    await asUser(SECURITY_A, "aal2", () => db.query(
      "select public.v3_core_record_incident_action($1,'contain','SESSION_SCOPE_CONTAINED')", [incidentId],
    ));
    const overview = await asUser(SECURITY_A, "aal2", () => db.query<{ incident_status: string; evidence_count: number; action_count: number }>(
      "select * from public.v3_core_security_overview()",
    ));
    expect(overview.rows[0]).toMatchObject({ incident_status: "contained", evidence_count: 1, action_count: 2 });
  });

  it("queues an exact two-person approved session revocation and lets only service role execute it", async () => {
    const approval = await asUser(SECURITY_A, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_request_privileged_action('core.sessions.revoke','user_session',$1,'Compromised session must be revoked') id",
      [SESSION_REFERENCE],
    ));
    await asUser(SECURITY_B, "aal2", () => db.query("select public.v3_core_approve_privileged_action($1)", [approval.rows[0].id]));
    const request = await asUser(SECURITY_A, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_request_revocation($1,$2,'user_session',$3,$4,'revoke-request-0001') id",
      [incidentId, TENANT, SESSION_REFERENCE, approval.rows[0].id],
    ));
    const replay = await asUser(SECURITY_A, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_request_revocation($1,$2,'user_session',$3,$4,'revoke-request-0001') id",
      [incidentId, TENANT, SESSION_REFERENCE, approval.rows[0].id],
    ));
    revocationId = request.rows[0].id;
    expect(replay.rows[0].id).toBe(revocationId);
    await expect(asUser(SECURITY_A, "aal2", () => db.query(
      "select public.v3_core_request_revocation($1,$2,'user_session',$3,$4,'revoke-request-0001')",
      [incidentId, TENANT, "b3000000-0000-4000-8000-000000000009", approval.rows[0].id],
    ))).rejects.toThrow("CORE_REVOCATION_IDEMPOTENCY_SCOPE_MISMATCH");
    await expect(asUser(CUSTOMER, "aal2", () => db.query("select * from public.v3_security_claim_revocation('bad-worker',120)")))
      .rejects.toThrow("permission denied for function v3_security_claim_revocation");
    const claim = await asService(() => db.query<{ revocation_id: string; target_reference: string }>(
      "select * from public.v3_security_claim_revocation('security-worker',120)",
    ));
    expect(claim.rows[0]).toMatchObject({ revocation_id: revocationId, target_reference: SESSION_REFERENCE });
    await asService(() => db.query("select public.v3_security_finish_revocation($1,'security-worker','succeeded',null)", [revocationId]));
  });

  it("returns bounded audit metadata without reason and blocks audit mutation", async () => {
    const audit = await asUser(SECURITY_A, "aal2", () => db.query<Record<string, unknown>>(
      "select * from public.v3_core_audit_search($1,'core.',100)", [TENANT],
    ));
    expect(audit.rows.length).toBeGreaterThan(0);
    expect(Object.keys(audit.rows[0])).not.toContain("reason");
    await expect(db.query("update v3_audit.events set action='tampered' where id=$1", [audit.rows[0].event_id]))
      .rejects.toThrow("AUDIT_EVENTS_APPEND_ONLY");
    await expect(db.query("delete from v3_audit.events where id=$1", [audit.rows[0].event_id]))
      .rejects.toThrow("AUDIT_EVENTS_APPEND_ONLY");
  });

  it("rejects revocation when incident and tenant scopes differ", async () => {
    const approval = await asUser(SECURITY_A, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_request_privileged_action('core.sessions.revoke','user_session',$1,'Second session revocation approval') id",
      ["b3000000-0000-4000-8000-000000000002"],
    ));
    await asUser(SECURITY_B, "aal2", () => db.query("select public.v3_core_approve_privileged_action($1)", [approval.rows[0].id]));
    await expect(asUser(SECURITY_A, "aal2", () => db.query(
      "select public.v3_core_request_revocation($1,$2,'user_session',$3,$4,'revoke-request-0002')",
      [incidentId, OTHER_TENANT, "b3000000-0000-4000-8000-000000000002", approval.rows[0].id],
    ))).rejects.toThrow("CORE_REVOCATION_INCIDENT_SCOPE_MISMATCH");
  });
});
