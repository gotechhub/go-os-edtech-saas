import { HeadObjectCommand, PutObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { validateUpload, loadStorageConfig, type AssetPurpose } from "@respongo-os/storage";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "./supabase/server";
import { resolveRequestContext } from "./request-context";

export class StorageApiError extends Error {
  constructor(public readonly code: string, public readonly status: number) { super(code); }
}

export async function storageRuntime() {
  const client = await createSupabaseServerClient();
  if (!client) throw new StorageApiError("STORAGE_UNCONFIGURED", 503);
  const context = await resolveRequestContext(client, "tr-TR");
  if (!context.ok) throw new StorageApiError(context.reason === "unauthenticated" ? "UNAUTHENTICATED" : "FORBIDDEN", context.reason === "unauthenticated" ? 401 : 403);
  let config;
  try { config = loadStorageConfig(); } catch { throw new StorageApiError("STORAGE_UNCONFIGURED", 503); }
  const s3 = new S3Client({
    region: config.region,
    credentials: awsCredentialsProvider({ roleArn: config.roleArn, audience: "sts.amazonaws.com" }),
  });
  return { client, context: context.context, config, s3 };
}

export async function createUploadIntent(input: { filename: string; mimeType: string; sizeBytes: number; sha256: string; purpose: AssetPurpose }) {
  const current = await storageRuntime();
  validateUpload({ ...input, tenantId: current.context.tenantId, uploadId: randomUUID(), purpose: input.purpose });
  const { data, error } = await current.client.rpc("v3_storage_create_upload_intent", {
    target_tenant: current.context.tenantId,
    target_purpose: input.purpose,
    source_filename: input.filename,
    source_media_type: input.mimeType,
    source_bytes: input.sizeBytes,
    source_sha256: input.sha256,
    request_idempotency_key: current.context.idempotencyKey,
  });
  if (error || !data?.[0]) throw mapStorageDatabaseError(error?.message);
  const intent = data[0] as { intent_id: string; asset_id: string; bucket_name: string; object_key: string; expires_at: string };
  const sha256Base64 = Buffer.from(input.sha256, "hex").toString("base64");
  const uploadUrl = await getSignedUrl(current.s3, new PutObjectCommand({
    Bucket: intent.bucket_name,
    Key: intent.object_key,
    ContentType: input.mimeType,
    ContentLength: input.sizeBytes,
    ChecksumSHA256: sha256Base64,
    Metadata: { "respongo-asset-id": intent.asset_id, "sha256-hex": input.sha256 },
  }), { expiresIn: current.config.uploadUrlTtlSeconds });
  return { schemaVersion: "2026-09-27", requestId: current.context.requestId, data: { intentId: intent.intent_id, assetId: intent.asset_id, uploadUrl, expiresAt: intent.expires_at, requiredHeaders: { "content-type": input.mimeType, "x-amz-checksum-sha256": sha256Base64, "x-amz-meta-respongo-asset-id": intent.asset_id, "x-amz-meta-sha256-hex": input.sha256 } } };
}

export async function completeUpload(assetId: string) {
  const current = await storageRuntime();
  const { data: intent, error } = await current.client.schema("v3_storage").from("upload_intents").select("id,asset_id,bucket_name,object_key,status").eq("asset_id", assetId).eq("status", "pending").single();
  if (error || !intent || intent.status !== "pending") throw new StorageApiError("UPLOAD_INTENT_NOT_ACTIVE", 409);
  const head = await current.s3.send(new HeadObjectCommand({ Bucket: intent.bucket_name, Key: intent.object_key }));
  const checksum = head.Metadata?.["sha256-hex"];
  if (!head.ContentLength || !checksum || !head.VersionId) throw new StorageApiError("UPLOAD_INTEGRITY_MISSING", 409);
  const { data, error: completionError } = await current.client.rpc("v3_storage_complete_upload", {
    target_intent: intent.id,
    observed_bytes: head.ContentLength,
    observed_sha256: checksum,
    observed_etag: head.ETag ?? null,
    observed_s3_version_id: head.VersionId,
  });
  if (completionError || !data) throw mapStorageDatabaseError(completionError?.message);
  return { schemaVersion: "2026-09-27", requestId: current.context.requestId, data: { assetId: intent.asset_id, state: "quarantine", scanStatus: "pending" } };
}

export async function createDownload(assetId: string) {
  const current = await storageRuntime();
  const { data: asset, error: assetError } = await current.client.schema("v3_storage").from("assets").select("id,original_filename,state").eq("id", assetId).single();
  if (assetError || !asset || asset.state !== "published") throw new StorageApiError("ASSET_NOT_DOWNLOADABLE", 404);
  const { data: version, error: versionError } = await current.client.schema("v3_storage").from("asset_versions").select("id,bucket_name,object_key,s3_version_id,scan_status,validation_status,publication_status").eq("asset_id", assetId).eq("publication_status", "published").eq("scan_status", "clean").order("version_number", { ascending: false }).limit(1).single();
  if (versionError || !version || version.validation_status === "invalid") throw new StorageApiError("ASSET_NOT_DOWNLOADABLE", 404);
  const downloadUrl = await getSignedUrl(current.s3, new GetObjectCommand({ Bucket: version.bucket_name, Key: version.object_key, VersionId: version.s3_version_id ?? undefined, ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(asset.original_filename)}` }), { expiresIn: current.config.downloadUrlTtlSeconds });
  const { error: auditError } = await current.client.rpc("v3_storage_record_download", { target_asset_version: version.id });
  if (auditError) throw new StorageApiError("ASSET_AUDIT_FAILED", 500);
  return { schemaVersion: "2026-09-27", requestId: current.context.requestId, data: { downloadUrl, expiresInSeconds: current.config.downloadUrlTtlSeconds } };
}

function mapStorageDatabaseError(message?: string): StorageApiError {
  if (message?.includes("FORBIDDEN")) return new StorageApiError("FORBIDDEN", 403);
  if (message?.includes("NOT_READY")) return new StorageApiError("TENANT_STORAGE_NOT_READY", 409);
  if (message?.includes("INVALID") || message?.includes("MISMATCH")) return new StorageApiError("VALIDATION_FAILED", 400);
  if (message?.includes("NOT_ACTIVE")) return new StorageApiError("UPLOAD_INTENT_NOT_ACTIVE", 409);
  return new StorageApiError("STORAGE_OPERATION_FAILED", 500);
}
