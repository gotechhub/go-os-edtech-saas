import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER = "81000000-0000-4000-8000-000000000001";
const TENANT = "82000000-0000-4000-8000-000000000001";
const OTHER = "82000000-0000-4000-8000-000000000002";
const HASH = "c".repeat(64);
const ASSET = "83000000-0000-4000-8000-000000000001";
const VERSION = "84000000-0000-4000-8000-000000000001";
let db: PGlite;
let courseId: string;

async function asUser<T>(operation: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [OWNER]);
  await db.query("select set_config('request.jwt.claim.aal','aal1',false)");
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
  for (const migration of [
    "202609270001_v3_platform_foundation.sql",
    "202609270002_v3_golms_learning_core.sql",
    "202609270004_v3_storage_foundation.sql",
    "202609280001_v3_scorm_ingestion_jobs.sql",
    "202609280002_v3_golms_scorm_asset_bridge.sql",
  ]) await db.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));

  await db.exec(`
    insert into auth.users(id,email) values ('${OWNER}','owner@test.local');
    insert into v3_platform.tenants(id,legal_name,display_name,mode,status) values
      ('${TENANT}','Tenant A','Tenant A','customer','active'),('${OTHER}','Tenant B','Tenant B','customer','active');
    insert into v3_platform.memberships(id,tenant_id,user_id,status)
      values('85000000-0000-4000-8000-000000000001','${TENANT}','${OWNER}','active');
    insert into v3_platform.role_grants(membership_id,role_key)
      values('85000000-0000-4000-8000-000000000001','tenant_owner');
    insert into v3_platform.product_entitlements(tenant_id,product_key,kind,starts_at,ends_at,updated_by)
      values('${TENANT}','golms','trial',now()-interval '1 day',now()+interval '13 days','${OWNER}');
    insert into v3_storage.assets(id,tenant_id,product_key,resource_type,original_filename,media_type,expected_bytes,expected_sha256,rights_status,state,created_by)
      values('${ASSET}','${TENANT}','golms','learning-content','course.zip','application/zip',1000,'${HASH}','approved','clean','${OWNER}');
    insert into v3_storage.asset_versions(id,asset_id,tenant_id,version_number,bucket_name,object_key,s3_version_id,size_bytes,sha256,scan_status,validation_status)
      values('${VERSION}','${ASSET}','${TENANT}',1,'respongo-test-bucket','quarantine/upload/course.zip','s3-v1',1000,'${HASH}','clean','valid');
    insert into v3_storage.package_manifests(asset_version_id,tenant_id,standard,manifest_identifier,title,launch_path,resource_count,sco_count,organization_count,entry_count,total_compressed_bytes,total_expanded_bytes,analyzer_version)
      values('${VERSION}','${TENANT}','scorm_2004_4th','manifest-1','Test Course','content/index.html',1,1,1,2,900,1200,'test/1');
  `);
});

afterAll(async () => db?.close());

describe("GOLMS validated SCORM asset bridge", () => {
  it("binds one tenant-owned package idempotently and queues one publication", async () => {
    const draft = await asUser(() => db.query<{ id: string }>(
      "select * from public.v3_golms_create_scorm_draft($1,$2,$3,$4)", [TENANT,"SCORM Köprü Testi","tr-TR",HASH],
    ));
    courseId = draft.rows[0].id;
    const first = await asUser(() => db.query<{ asset_version_id: string; standard: string }>(
      "select * from public.v3_golms_bind_scorm_asset($1,$2)", [courseId,VERSION],
    ));
    const again = await asUser(() => db.query<{ asset_version_id: string }>(
      "select * from public.v3_golms_bind_scorm_asset($1,$2)", [courseId,VERSION],
    ));
    expect(first.rows[0]).toMatchObject({ asset_version_id: VERSION, standard: "scorm_2004_4th" });
    expect(again.rows[0].asset_version_id).toBe(VERSION);
    const counts = await db.query<{ publications: number; jobs: number }>(`
      select (select count(*)::int from v3_storage.scorm_publications) publications,
             (select count(*)::int from v3_storage.processing_jobs where job_type='scorm_publication') jobs`);
    expect(counts.rows[0]).toEqual({ publications: 1, jobs: 1 });
  });

  it("blocks LMS publication until immutable S3 publication is ready", async () => {
    await expect(asUser(() => db.query("select * from public.v3_golms_publish_learning_object($1)", [courseId])))
      .rejects.toThrow(/READY_PUBLISHED_SCORM_REQUIRED/);

    const claim = await asService(() => db.query<{ job_id: string; published_prefix: string; expected_launch_path: string }>(
      "select * from public.v3_storage_claim_scorm_publication($1,$2)", ["worker-publication",600],
    ));
    expect(claim.rows).toHaveLength(1);
    const launchKey = `${claim.rows[0].published_prefix}${claim.rows[0].expected_launch_path}`;
    await asService(() => db.query("select public.v3_storage_finish_scorm_publication($1,$2,$3,$4,$5,$6)", [
      claim.rows[0].job_id,"worker-publication","succeeded",null,launchKey,2,
    ]));
    const published = await asUser(() => db.query<{ status: string }>("select * from public.v3_golms_publish_learning_object($1)", [courseId]));
    expect(published.rows[0].status).toBe("published");
  });

  it("rejects an asset from another tenant", async () => {
    const foreignAsset = "83000000-0000-4000-8000-000000000002";
    const foreignVersion = "84000000-0000-4000-8000-000000000002";
    await db.exec(`
      insert into v3_storage.assets(id,tenant_id,product_key,resource_type,original_filename,media_type,expected_bytes,expected_sha256,rights_status,state,created_by)
        values('${foreignAsset}','${OTHER}','golms','learning-content','foreign.zip','application/zip',1000,'${HASH}','approved','clean','${OWNER}');
      insert into v3_storage.asset_versions(id,asset_id,tenant_id,version_number,bucket_name,object_key,s3_version_id,size_bytes,sha256,scan_status,validation_status)
        values('${foreignVersion}','${foreignAsset}','${OTHER}',1,'other-test-bucket','quarantine/foreign/course.zip','s3-v1',1000,'${HASH}','clean','valid');
      insert into v3_storage.package_manifests(asset_version_id,tenant_id,standard,manifest_identifier,launch_path,resource_count,sco_count,organization_count,entry_count,total_compressed_bytes,total_expanded_bytes,analyzer_version)
        values('${foreignVersion}','${OTHER}','scorm_1_2','foreign','index.html',1,1,1,2,900,1200,'test/1');
    `);
    const draft = await asUser(() => db.query<{ id: string }>(
      "select * from public.v3_golms_create_scorm_draft($1,$2,$3,$4)", [TENANT,"Tenant sınırı","tr-TR",HASH],
    ));
    await expect(asUser(() => db.query("select * from public.v3_golms_bind_scorm_asset($1,$2)", [draft.rows[0].id,foreignVersion])))
      .rejects.toThrow(/SCORM_ASSET_TENANT_MISMATCH/);
  });
});
