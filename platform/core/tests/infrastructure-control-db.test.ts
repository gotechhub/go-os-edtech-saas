import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const INFRA = "c1000000-0000-4000-8000-000000000001";
const SECURITY = "c1000000-0000-4000-8000-000000000002";
const CUSTOMER = "c1000000-0000-4000-8000-000000000003";
const TENANT = "c2000000-0000-4000-8000-000000000001";
const LOCATION = "c3000000-0000-4000-8000-000000000001";
let db: PGlite;
let storageResourceId: string;
let cdnResourceId: string;

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

async function approve(permission: string, objectType: string, objectId: string) {
  const request = await asUser(INFRA, "aal2", () => db.query<{ id: string }>(
    "select public.v3_core_request_privileged_action($1,$2,$3,'Infrastructure action requires independent approval') id",
    [permission, objectType, objectId],
  ));
  await asUser(SECURITY, "aal2", () => db.query("select public.v3_core_approve_privileged_action($1)", [request.rows[0].id]));
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
  await db.exec(readFileSync("supabase/migrations/202609270001_v3_platform_foundation.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/202609270004_v3_storage_foundation.sql", "utf8"));
  await db.exec(`
    insert into auth.users(id,email) values ('${INFRA}','infra@test.local'),('${SECURITY}','security@test.local'),('${CUSTOMER}','customer@test.local');
    insert into v3_hq.operators(user_id,role_key) values ('${SECURITY}','security');
    insert into v3_platform.tenants(id,legal_name,display_name,mode,status) values ('${TENANT}','Tenant A','Tenant A','customer','active');
    insert into v3_storage.locations(id,tenant_id,bucket_name,region,status,versioning_enabled,public_access_blocked,ownership_enforced)
      values('${LOCATION}','${TENANT}','respongo-beta-eu-north-1-cccccccccccccccccccc','eu-north-1','write_suspended',false,false,false);
  `);
  await db.exec(readFileSync("supabase/migrations/202609300001_v3_internal_control_planes.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010001_v3_core_privileged_approvals.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/202610010008_v3_core_infrastructure_control.sql", "utf8"));
  await db.exec(`insert into v3_core.operators(user_id) values('${INFRA}');insert into v3_core.role_grants(user_id,role_key,reason) values('${INFRA}','infrastructure_operator','Infrastructure operations responsibility');`);
});

afterAll(async () => db?.close());

describe("OS Core infrastructure control", () => {
  it("registers stable storage and CDN resource identities without credentials", async () => {
    const storage = await asUser(INFRA, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_register_infrastructure_resource($1,'aws','storage_location','production','eu-north-1',$2) id",
      [TENANT, "respongo-beta-eu-north-1-cccccccccccccccccccc"],
    ));
    const duplicate = await asUser(INFRA, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_register_infrastructure_resource($1,'aws','storage_location','production','eu-north-1',$2) id",
      [TENANT, "respongo-beta-eu-north-1-cccccccccccccccccccc"],
    ));
    storageResourceId = storage.rows[0].id;
    expect(duplicate.rows[0].id).toBe(storageResourceId);
    const cdn = await asUser(INFRA, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_register_infrastructure_resource(null,'aws','cdn_distribution','production','global','distribution-main') id",
    ));
    cdnResourceId = cdn.rows[0].id;
  });

  it("suspends misconfigured storage and rejects uploads before application logic", async () => {
    await asService(() => db.query(
      "select public.v3_core_record_infrastructure_observation($1,'obs-bad-001','misconfigured',false,false,false,false,null,100,1000,2,'PUBLIC_ACCESS_ENABLED',now())",
      [storageResourceId],
    ));
    const location = await db.query<{ status: string }>("select status from v3_storage.locations where id=$1", [LOCATION]);
    expect(location.rows[0].status).toBe("write_suspended");
    await expect(db.query(`insert into v3_storage.upload_intents(tenant_id,asset_id,actor_id,idempotency_key,bucket_name,object_key,expires_at)
      values($1,'c4000000-0000-4000-8000-000000000001',$2,'blocked-upload-001','respongo-beta-eu-north-1-cccccccccccccccccccc','quarantine/x/payload.zip',now()+interval '5 minutes')`, [TENANT,CUSTOMER]))
      .rejects.toThrow("TENANT_STORAGE_SECURITY_CONTROLS_REQUIRED");
  });

  it("activates storage only after a fresh clean observation and exact approval", async () => {
    await asService(() => db.query(
      "select public.v3_core_record_infrastructure_observation($1,'obs-clean-001','healthy',true,true,true,true,null,250,1000,5,null,now())",
      [storageResourceId],
    ));
    const wrong = await approve("core.storage.manage", "storage_location", "c3000000-0000-4000-8000-000000000009");
    await expect(asUser(INFRA, "aal2", () => db.query(
      "select public.v3_core_activate_storage_location($1,$2,'storage-activate-0001')", [LOCATION,wrong],
    ))).rejects.toThrow("CORE_STORAGE_APPROVAL_SCOPE_MISMATCH");
    const ticket = await approve("core.storage.manage", "storage_location", LOCATION);
    const first = await asUser(INFRA, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_activate_storage_location($1,$2,'storage-activate-0002') id", [LOCATION,ticket],
    ));
    const replay = await asUser(INFRA, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_activate_storage_location($1,$2,'storage-activate-0002') id", [LOCATION,ticket],
    ));
    expect(replay.rows[0].id).toBe(first.rows[0].id);
    const location = await db.query<{ status: string; encryption_key_arn: string }>("select status,encryption_key_arn from v3_storage.locations where id=$1", [LOCATION]);
    expect(location.rows[0]).toEqual({ status: "active", encryption_key_arn: "provider-managed" });
  });

  it("marks a public CDN origin misconfigured and exposes bounded capacity", async () => {
    await asService(() => db.query(
      "select public.v3_core_record_infrastructure_observation($1,'obs-cdn-001','healthy',null,null,null,true,false,250,1000,10,null,now())",
      [cdnResourceId],
    ));
    const overview = await asUser(INFRA, "aal2", () => db.query<Record<string, unknown>>("select * from public.v3_core_infrastructure_overview()"));
    const storage = overview.rows.find((row) => row.resource_id === storageResourceId);
    const cdn = overview.rows.find((row) => row.resource_id === cdnResourceId);
    expect(storage).toMatchObject({ health_status: "healthy", control_status: "verified", capacity_percent: "25.00" });
    expect(cdn).toMatchObject({ control_status: "misconfigured" });
    expect(Object.keys(overview.rows[0])).not.toContain("resource_reference");
  });

  it("denies customers and AAL1 operators from the global inventory", async () => {
    await expect(asUser(CUSTOMER, "aal2", () => db.query("select * from public.v3_core_infrastructure_overview()")))
      .rejects.toThrow("CORE_INFRASTRUCTURE_READ_PERMISSION_MFA_REQUIRED");
    await expect(asUser(INFRA, "aal1", () => db.query("select * from public.v3_core_infrastructure_overview()")))
      .rejects.toThrow("CORE_INFRASTRUCTURE_READ_PERMISSION_MFA_REQUIRED");
  });

  it("creates one approved CDN invalidation command", async () => {
    const ticket = await approve("core.infrastructure.manage", "infrastructure_resource", cdnResourceId);
    const first = await asUser(INFRA, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_request_infrastructure_command($1,'cdn_invalidation','Invalidate compromised cached object',$2,'infra-command-0001') id",
      [cdnResourceId,ticket],
    ));
    const replay = await asUser(INFRA, "aal2", () => db.query<{ id: string }>(
      "select public.v3_core_request_infrastructure_command($1,'cdn_invalidation','Invalidate compromised cached object',$2,'infra-command-0001') id",
      [cdnResourceId,ticket],
    ));
    expect(replay.rows[0].id).toBe(first.rows[0].id);
    await expect(asUser(CUSTOMER,"aal2",()=>db.query("select * from public.v3_core_claim_infrastructure_command('bad-worker',180)")))
      .rejects.toThrow("permission denied for function v3_core_claim_infrastructure_command");
    const claim=await asService(()=>db.query<{command_id:string;resource_reference:string}>("select * from public.v3_core_claim_infrastructure_command('infra-worker',180)"));
    expect(claim.rows[0]).toMatchObject({command_id:first.rows[0].id,resource_reference:"distribution-main"});
    await asService(()=>db.query("select public.v3_core_finish_infrastructure_command($1,'infra-worker','succeeded',null)",[first.rows[0].id]));
  });

  it("requires immutable evidence for a passed AWS migration check",async()=>{
    await expect(asService(()=>db.query("select public.v3_core_record_aws_migration_check('database_export_restore','passed',null,null,now())")))
      .rejects.toThrow("MIGRATION_CHECK_EVIDENCE_REQUIRED");
    await asService(()=>db.query("select public.v3_core_record_aws_migration_check('database_export_restore','passed','evidence/restore/drill-001',$1,now())",["d".repeat(64)]));
    const readiness=await asUser(INFRA,"aal2",()=>db.query<{check_key:string;check_status:string}>("select * from public.v3_core_aws_migration_readiness()"));
    expect(readiness.rows.find(row=>row.check_key==="database_export_restore")?.check_status).toBe("passed");
  });
});
