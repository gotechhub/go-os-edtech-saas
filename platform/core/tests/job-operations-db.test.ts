import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OPERATOR = "a1000000-0000-4000-8000-000000000001";
const SECURITY = "a1000000-0000-4000-8000-000000000002";
const CUSTOMER = "a1000000-0000-4000-8000-000000000003";
const TENANT_A = "a2000000-0000-4000-8000-000000000001";
const TENANT_B = "a2000000-0000-4000-8000-000000000002";
const ASSET_A = "a3000000-0000-4000-8000-000000000001";
const ASSET_B = "a3000000-0000-4000-8000-000000000002";
const VERSION_A = "a4000000-0000-4000-8000-000000000001";
const VERSION_B = "a4000000-0000-4000-8000-000000000002";
const JOB_A = "a5000000-0000-4000-8000-000000000001";
const JOB_B = "a5000000-0000-4000-8000-000000000002";
let db: PGlite;

async function asUser<T>(id: string, aal: "aal1" | "aal2", operation: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.query("select set_config('request.jwt.claim.aal',$1,false)", [aal]);
  await db.exec("set role authenticated");
  try { return await operation(); } finally { await db.exec("reset role"); }
}

async function approve(jobId: string) {
  const request = await asUser(OPERATOR, "aal2", () => db.query<{ id: string }>(
    "select public.v3_core_request_privileged_action('core.jobs.manage','processing_job',$1,'Failed job retry requires independent approval') id",
    [jobId],
  ));
  await asUser(SECURITY, "aal2", () => db.query(
    "select public.v3_core_approve_privileged_action($1)",
    [request.rows[0].id],
  ));
  return request.rows[0].id;
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
  for (const migration of [
    "202609270001_v3_platform_foundation.sql",
    "202609270002_v3_golms_learning_core.sql",
    "202609270004_v3_storage_foundation.sql",
    "202609280001_v3_scorm_ingestion_jobs.sql",
    "202609280002_v3_golms_scorm_asset_bridge.sql",
  ]) await db.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));

  await db.exec(`
    insert into auth.users(id,email) values
      ('${OPERATOR}','operator@test.local'),('${SECURITY}','security@test.local'),('${CUSTOMER}','customer@test.local');
    insert into v3_hq.operators(user_id,role_key) values ('${SECURITY}','security');
    insert into v3_platform.tenants(id,legal_name,display_name,mode,status) values
      ('${TENANT_A}','Tenant A','Tenant A','customer','active'),
      ('${TENANT_B}','Tenant B','Tenant B','customer','active');
  `);
  await db.exec(readFileSync("supabase/migrations/202609300001_v3_internal_control_planes.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010001_v3_core_privileged_approvals.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010005_v3_core_job_operations.sql", "utf8"));
  await db.exec(`
    insert into v3_core.operators(user_id) values ('${OPERATOR}');
    insert into v3_core.role_grants(user_id,role_key,reason)
      values ('${OPERATOR}','platform_operator','Job operations responsibility');
    insert into v3_storage.assets(id,tenant_id,product_key,resource_type,original_filename,media_type,expected_bytes,expected_sha256,rights_status,state,created_by) values
      ('${ASSET_A}','${TENANT_A}','golms','learning-content','a.zip','application/zip',10,'${"a".repeat(64)}','approved','clean','${CUSTOMER}'),
      ('${ASSET_B}','${TENANT_B}','golms','learning-content','b.zip','application/zip',10,'${"b".repeat(64)}','approved','clean','${CUSTOMER}');
    insert into v3_storage.asset_versions(id,asset_id,tenant_id,version_number,bucket_name,object_key,s3_version_id,size_bytes,sha256,scan_status) values
      ('${VERSION_A}','${ASSET_A}','${TENANT_A}',1,'tenant-a-bucket','quarantine/a/payload.zip','v1',10,'${"a".repeat(64)}','clean'),
      ('${VERSION_B}','${ASSET_B}','${TENANT_B}',1,'tenant-b-bucket','quarantine/b/payload.zip','v1',10,'${"b".repeat(64)}','clean');
    insert into v3_storage.processing_jobs(id,tenant_id,asset_version_id,job_type,status,attempt_count,error_code) values
      ('${JOB_A}','${TENANT_A}','${VERSION_A}','scorm_ingestion','failed',5,'ARCHIVE_INVALID'),
      ('${JOB_B}','${TENANT_B}','${VERSION_B}','scorm_ingestion','failed',3,'MANIFEST_INVALID');
  `);
});

afterAll(async () => db?.close());

describe("OS Core job operations", () => {
  it("denies customer and AAL1 access to the global job projection", async () => {
    await expect(asUser(CUSTOMER, "aal2", () => db.query("select * from public.v3_core_job_overview()")))
      .rejects.toThrow("CORE_JOB_READ_PERMISSION_MFA_REQUIRED");
    await expect(asUser(OPERATOR, "aal1", () => db.query("select * from public.v3_core_job_overview()")))
      .rejects.toThrow("CORE_JOB_READ_PERMISSION_MFA_REQUIRED");
  });

  it("returns operational metadata without payload, path or worker fields", async () => {
    const overview = await asUser(OPERATOR, "aal2", () => db.query<Record<string, unknown>>(
      "select * from public.v3_core_job_overview()",
    ));
    expect(overview.rows).toHaveLength(2);
    expect(Object.keys(overview.rows[0])).not.toEqual(expect.arrayContaining([
      "result", "object_key", "original_filename", "locked_by",
    ]));
    expect(new Set(overview.rows.map((row) => row.tenant_id))).toEqual(new Set([TENANT_A, TENANT_B]));
  });

  it("retries one failed job idempotently with an exact two-person approval", async () => {
    const ticket = await approve(JOB_A);
    const first = await asUser(OPERATOR, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_retry_processing_job($1,'Retry after archive parser correction',$2,'job-retry-0001') id",
      [JOB_A, ticket],
    ));
    const replay = await asUser(OPERATOR, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_retry_processing_job($1,'Retry after archive parser correction',$2,'job-retry-0001') id",
      [JOB_A, ticket],
    ));
    expect(replay.rows[0].id).toBe(first.rows[0].id);
    const state = await db.query<{ status: string; attempt_count: number; operations: number }>(`
      select j.status,j.attempt_count,
        (select count(*)::int from v3_core.job_retry_operations o where o.job_id=j.id) operations
      from v3_storage.processing_jobs j where j.id=$1`, [JOB_A]);
    expect(state.rows[0]).toEqual({ status: "queued", attempt_count: 0, operations: 1 });
    await expect(asUser(OPERATOR, "aal2", () => db.query(
      "select public.v3_core_retry_processing_job($1,'Retry tenant B parser failure',$2,'job-retry-0001')",
      [JOB_B, ticket],
    ))).rejects.toThrow("CORE_JOB_IDEMPOTENCY_SCOPE_MISMATCH");
  });

  it("rejects a ticket scoped to a different tenant job", async () => {
    const wrongTicket = await approve(JOB_A);
    await expect(asUser(OPERATOR, "aal2", () => db.query(
      "select public.v3_core_retry_processing_job($1,'Retry tenant B parser failure',$2,'job-retry-0002')",
      [JOB_B, wrongTicket],
    ))).rejects.toThrow("CORE_JOB_APPROVAL_SCOPE_MISMATCH");
  });

  it("denies customer and AAL1 retry commands", async () => {
    await expect(asUser(CUSTOMER, "aal2", () => db.query(
      "select public.v3_core_retry_processing_job($1,'Customer cannot retry platform jobs',$2,'job-retry-0003')",
      [JOB_B, "a6000000-0000-4000-8000-000000000001"],
    ))).rejects.toThrow("CORE_JOB_PERMISSION_MFA_REQUIRED");
    await expect(asUser(OPERATOR, "aal1", () => db.query(
      "select public.v3_core_retry_processing_job($1,'Weak session cannot retry jobs',$2,'job-retry-0004')",
      [JOB_B, "a6000000-0000-4000-8000-000000000002"],
    ))).rejects.toThrow("CORE_JOB_PERMISSION_MFA_REQUIRED");
  });
});
