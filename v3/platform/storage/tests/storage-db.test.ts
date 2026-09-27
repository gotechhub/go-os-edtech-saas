import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER = "71000000-0000-4000-8000-000000000001";
const OTHER_OWNER = "71000000-0000-4000-8000-000000000002";
const TENANT = "72000000-0000-4000-8000-000000000001";
const OTHER = "72000000-0000-4000-8000-000000000002";
const SHA = "a".repeat(64);
let db: PGlite;
let intentId: string;

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
  await db.exec(readFileSync("v3/supabase/migrations/202609270004_v3_storage_foundation.sql", "utf8"));
  await db.exec(`
    insert into auth.users(id,email) values ('${OWNER}','owner@test.local'),('${OTHER_OWNER}','other@test.local');
    insert into v3_platform.tenants(id,legal_name,display_name,mode,status) values ('${TENANT}','Tenant A','Tenant A','customer','active'),('${OTHER}','Tenant B','Tenant B','customer','active');
    insert into v3_platform.memberships(id,tenant_id,user_id,status) values
      ('73000000-0000-4000-8000-000000000001','${TENANT}','${OWNER}','active'),
      ('73000000-0000-4000-8000-000000000002','${OTHER}','${OTHER_OWNER}','active');
    insert into v3_platform.role_grants(membership_id,role_key) values
      ('73000000-0000-4000-8000-000000000001','tenant_owner'),
      ('73000000-0000-4000-8000-000000000002','tenant_owner');
    insert into v3_platform.product_entitlements(tenant_id,product_key,kind,starts_at,ends_at,updated_by) values
      ('${TENANT}','golms','trial',now()-interval '1 day',now()+interval '13 days','${OWNER}'),
      ('${OTHER}','golms','trial',now()-interval '20 days',now()-interval '6 days','${OTHER_OWNER}');
    insert into v3_storage.locations(tenant_id,bucket_name,region,status,versioning_enabled,public_access_blocked,ownership_enforced,provisioned_at)
      values('${TENANT}','respongo-beta-eu-north-1-aaaaaaaaaaaaaaaaaaaa','eu-north-1','active',true,true,true,now()),
            ('${OTHER}','respongo-beta-eu-north-1-bbbbbbbbbbbbbbbbbbbb','eu-north-1','active',true,true,true,now());
  `);
});

afterAll(async () => db?.close());

describe("V3 storage migration and RLS", () => {
  it("creates one idempotent quarantine upload intent", async () => {
    const first = await asUser(OWNER, () => db.query<{ intent_id: string; object_key: string }>("select * from public.v3_storage_create_upload_intent($1,$2,$3,$4,$5,$6,$7)", [TENANT,"golms-learning-content","course.zip","application/zip",1024,SHA,"request-0001"]));
    const again = await asUser(OWNER, () => db.query<{ intent_id: string }>("select * from public.v3_storage_create_upload_intent($1,$2,$3,$4,$5,$6,$7)", [TENANT,"golms-learning-content","course.zip","application/zip",1024,SHA,"request-0001"]));
    intentId = first.rows[0].intent_id;
    expect(again.rows[0].intent_id).toBe(intentId);
    expect(first.rows[0].object_key).toMatch(/^quarantine\/[0-9a-f-]+\/payload\.zip$/);
  });

  it("keeps another tenant and expired trial from writing", async () => {
    await expect(asUser(OTHER_OWNER, () => db.query("select * from public.v3_storage_create_upload_intent($1,$2,$3,$4,$5,$6,$7)", [TENANT,"golms-learning-content","x.zip","application/zip",10,SHA,"request-0002"]))).rejects.toThrow(/ASSET_UPLOAD_FORBIDDEN/);
    await expect(asUser(OTHER_OWNER, () => db.query("select * from public.v3_storage_create_upload_intent($1,$2,$3,$4,$5,$6,$7)", [OTHER,"golms-learning-content","x.zip","application/zip",10,SHA,"request-0003"]))).rejects.toThrow(/ASSET_UPLOAD_FORBIDDEN/);
  });

  it("requires exact upload integrity and an S3 version id", async () => {
    await expect(asUser(OWNER, () => db.query("select * from public.v3_storage_complete_upload($1,$2,$3,$4,$5)", [intentId,1023,SHA,"etag", "v1"]))).rejects.toThrow(/UPLOAD_INTEGRITY_MISMATCH/);
    const completed = await asUser(OWNER, () => db.query<{ publication_status: string; scan_status: string }>("select * from public.v3_storage_complete_upload($1,$2,$3,$4,$5)", [intentId,1024,SHA,"etag", "v1"]));
    expect(completed.rows[0]).toMatchObject({ publication_status: "quarantine", scan_status: "pending" });
  });

  it("prevents cross-tenant metadata reads", async () => {
    const visible = await asUser(OWNER, () => db.query("select id from v3_storage.assets"));
    const hidden = await asUser(OTHER_OWNER, () => db.query("select id from v3_storage.assets"));
    expect(visible.rows).toHaveLength(1);
    expect(hidden.rows).toHaveLength(0);
  });
});
