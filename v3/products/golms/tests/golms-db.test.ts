import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER = "91000000-0000-4000-8000-000000000001";
const LEARNER = "91000000-0000-4000-8000-000000000002";
const OUTSIDER = "91000000-0000-4000-8000-000000000003";
const TENANT = "92000000-0000-4000-8000-000000000001";
const OTHER = "92000000-0000-4000-8000-000000000002";
const HASH = "a".repeat(64);
const RAW_HASH = "b".repeat(64);
let db: PGlite;
let courseId: string;
let programId: string;
let stepId: string;
let enrollmentId: string;
let attemptId: string;

async function asUser<T>(id: string, operation: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.query("select set_config('request.jwt.claim.aal','aal1',false)");
  await db.exec("set role authenticated");
  try { return await operation(); } finally { await db.exec("reset role"); }
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text not null);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid(),auth.jwt() to authenticated;
  `);
  await db.exec(readFileSync("v3/supabase/migrations/202609270001_v3_platform_foundation.sql", "utf8"));
  await db.exec(readFileSync("v3/supabase/migrations/202609270002_v3_golms_learning_core.sql", "utf8"));
  await db.exec(readFileSync("v3/supabase/migrations/202609270003_v3_golms_read_models.sql", "utf8"));
  await db.exec(`
    insert into auth.users(id,email) values ('${OWNER}','owner@test.local'),('${LEARNER}','learner@test.local'),('${OUTSIDER}','outsider@test.local');
    insert into v3_platform.tenants(id,legal_name,display_name,mode,status) values ('${TENANT}','Tenant A','Tenant A','customer','active'),('${OTHER}','Tenant B','Tenant B','customer','active');
    insert into v3_platform.memberships(id,tenant_id,user_id,status) values
      ('93000000-0000-4000-8000-000000000001','${TENANT}','${OWNER}','active'),
      ('93000000-0000-4000-8000-000000000002','${TENANT}','${LEARNER}','active'),
      ('93000000-0000-4000-8000-000000000003','${OTHER}','${OUTSIDER}','active');
    insert into v3_platform.role_grants(membership_id,role_key) values
      ('93000000-0000-4000-8000-000000000001','tenant_owner'),
      ('93000000-0000-4000-8000-000000000002','learner'),
      ('93000000-0000-4000-8000-000000000003','tenant_owner');
    insert into v3_platform.product_entitlements(tenant_id,product_key,kind,starts_at,ends_at,updated_by) values
      ('${TENANT}','golms','trial',now()-interval '1 day',now()+interval '13 days','${OWNER}'),
      ('${OTHER}','golms','trial',now()-interval '1 day',now()+interval '13 days','${OUTSIDER}');
  `);
}, 60_000);

afterAll(async () => { await db?.close(); });

describe("GOLMS database vertical slice", () => {
  it("creates and publishes a scanned immutable SCORM version", async () => {
    const draft = await asUser(OWNER, () => db.query<{ id: string }>("select * from public.v3_golms_create_scorm_draft($1,$2,$3,$4)", [TENANT, "Bilgi Güvenliği", "tr-TR", HASH]));
    courseId = draft.rows[0].id;
    await db.query(`insert into v3_golms.scorm_packages(learning_object_version_id,tenant_id,asset_version_id,package_hash,standard,manifest_identifier,launch_path,scan_status,validation_status,validated_at,validator_version,file_count,expanded_bytes) values($1,$2,gen_random_uuid(),$3,'scorm_2004_4th','manifest-a','index.html','clean','valid',now(),'validator-1',12,24000)`, [courseId, TENANT, HASH]);
    const published = await asUser(OWNER, () => db.query<{ status: string }>("select * from public.v3_golms_publish_learning_object($1)", [courseId]));
    expect(published.rows[0].status).toBe("published");
    const hiddenDraft = await asUser(OWNER, () => db.query<{ id: string }>("select * from public.v3_golms_create_scorm_draft($1,$2,$3,$4)", [TENANT, "Yayınlanmamış İçerik", "tr-TR", HASH]));
    const learnerDraftView = await asUser(LEARNER, () => db.query("select id from v3_golms.learning_object_versions where id=$1", [hiddenDraft.rows[0].id]));
    expect(learnerDraftView.rows).toHaveLength(0);
    await expect(db.query("update v3_golms.learning_object_versions set title='Changed' where id=$1", [courseId])).rejects.toThrow(/PUBLISHED_VERSION_IMMUTABLE/);
  });

  it("builds, publishes and assigns one immutable program", async () => {
    const program = await asUser(OWNER, () => db.query<{ id: string }>("select * from public.v3_golms_create_program_draft($1,$2,$3,true)", [TENANT, "Zorunlu Güvenlik", "tr-TR"]));
    programId = program.rows[0].id;
    const step = await asUser(OWNER, () => db.query<{ id: string }>("select * from public.v3_golms_add_program_step($1,$2,1,true,'passed')", [programId, courseId]));
    stepId = step.rows[0].id;
    await asUser(OWNER, () => db.query("select * from public.v3_golms_publish_program($1)", [programId]));
    const assigned = await asUser(OWNER, () => db.query<{ id: string }>("select * from public.v3_golms_assign_program($1,$2,true,now(),now()+interval '14 days')", [programId, LEARNER]));
    enrollmentId = assigned.rows[0].id;
    await expect(db.query("update v3_golms.program_versions set title='Changed' where id=$1", [programId])).rejects.toThrow(/PUBLISHED_VERSION_IMMUTABLE/);
  });

  it("lets the learner launch, resume evidence and complete without duplicate events", async () => {
    const launched = await asUser(LEARNER, () => db.query<{ id: string; status: string }>("select * from public.v3_golms_launch_scorm($1,$2)", [enrollmentId, stepId]));
    attemptId = launched.rows[0].id;
    expect(launched.rows[0].status).toBe("active");
    const first = await asUser(LEARNER, () => db.query<{ last_sequence: number }>("select * from public.v3_golms_record_runtime_event($1,'evt-1',1,'initialized',now(),null,null,0,null,null,0,$2)", [attemptId, RAW_HASH]));
    expect(first.rows[0].last_sequence).toBe(1);
    const duplicate = await asUser(LEARNER, () => db.query<{ last_sequence: number }>("select * from public.v3_golms_record_runtime_event($1,'evt-1',1,'initialized',now(),null,null,0,null,null,0,$2)", [attemptId, RAW_HASH]));
    expect(duplicate.rows[0].last_sequence).toBe(1);
    await expect(asUser(LEARNER, () => db.query("select public.v3_golms_record_runtime_event($1,'evt-3',3,'progressed',now(),null,null,.5,null,null,10,$2)", [attemptId, RAW_HASH]))).rejects.toThrow(/RUNTIME_EVENT_OUT_OF_ORDER/);
    const final = await asUser(LEARNER, () => db.query<{ status: string; completion_status: string; success_status: string; score_raw: string }>("select * from public.v3_golms_record_runtime_event($1,'evt-2',2,'terminated',now(),'complete','passed',1,85,.85,420,$2)", [attemptId, RAW_HASH]));
    expect(final.rows[0]).toMatchObject({ status: "completed", completion_status: "complete", success_status: "passed" });
    const finished = await asUser(LEARNER, () => db.query<{ status: string }>("select status from v3_golms.enrollments where id=$1", [enrollmentId]));
    expect(finished.rows[0].status).toBe("completed");
    const report = await asUser(OWNER, () => db.query<{ enrollment_status: string; attempt_count: number; best_score: string }>("select * from public.v3_golms_program_report($1)", [programId]));
    expect(report.rows[0]).toMatchObject({ enrollment_status: "completed", attempt_count: 1, best_score: "85" });
    const adminPrograms = await asUser(OWNER, () => db.query<{ id: string; step_count: number }>("select * from public.v3_golms_list_programs($1)", [TENANT]));
    expect(adminPrograms.rows).toContainEqual(expect.objectContaining({ id: programId, step_count: 1 }));
    const learnerAssignments = await asUser(LEARNER, () => db.query<{ id: string; progress_percent: number }>("select * from public.v3_golms_my_enrollments($1)", [TENANT]));
    expect(learnerAssignments.rows).toContainEqual(expect.objectContaining({ id: enrollmentId, progress_percent: 100 }));
  });

  it("isolates tenant rows and blocks every runtime write after trial expiry", async () => {
    const outsiderRows = await asUser(OUTSIDER, () => db.query("select id from v3_golms.enrollments"));
    expect(outsiderRows.rows).toHaveLength(0);
    const learnerRows = await asUser(LEARNER, () => db.query("select id from v3_golms.enrollments"));
    expect(learnerRows.rows).toHaveLength(1);
    await db.query("update v3_platform.product_entitlements set ends_at=now()-interval '1 second' where tenant_id=$1 and product_key='golms'", [TENANT]);
    await expect(asUser(LEARNER, () => db.query("select public.v3_golms_record_runtime_event($1,'evt-expired',3,'progressed',now(),null,null,1,null,null,1,$2)", [attemptId, RAW_HASH]))).rejects.toThrow(/GOLMS_WRITE_FORBIDDEN/);
  });
});
