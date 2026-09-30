import { createHash } from "node:crypto";
import type { AssetPurpose, StorageConfig, UploadPolicy, UploadRequest } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;

export const UPLOAD_POLICIES: Record<AssetPurpose, UploadPolicy> = {
  "golms-learning-content": {
    product: "golms",
    resource: "learning-content",
    permission: "golms.manage",
    allowedMimeTypes: [
      "application/zip",
      "application/pdf",
      "video/mp4",
      "video/webm",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
    maxBytes: 2 * 1024 * 1024 * 1024,
  },
};

export function tenantBucketName(prefix: string, environment: string, region: string, tenantId: string): string {
  if (!UUID.test(tenantId)) throw new Error("INVALID_TENANT_ID");
  const digest = createHash("sha256").update(tenantId).digest("hex").slice(0, 20);
  const value = `${prefix}-${environment}-${region}-${digest}`.toLowerCase().replace(/[^a-z0-9.-]/g, "-").replace(/-+/g, "-");
  if (value.length < 3 || value.length > 63) throw new Error("INVALID_BUCKET_NAME");
  return value;
}

export function safeFilename(filename: string): string {
  const normalized = filename.normalize("NFKC").replace(/\\/g, "/");
  if (!normalized || normalized.includes("../") || normalized.startsWith("/") || normalized.includes("\0")) throw new Error("INVALID_FILENAME");
  const leaf = normalized.split("/").at(-1) ?? "";
  const cleaned = leaf.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 180);
  if (!cleaned || cleaned === "." || cleaned === "..") throw new Error("INVALID_FILENAME");
  return cleaned;
}

export function validateUpload(request: UploadRequest): UploadPolicy {
  const policy = UPLOAD_POLICIES[request.purpose];
  if (!policy) throw new Error("UNSUPPORTED_UPLOAD_PURPOSE");
  if (!UUID.test(request.tenantId) || !UUID.test(request.uploadId)) throw new Error("INVALID_UPLOAD_CONTEXT");
  if (!Number.isSafeInteger(request.sizeBytes) || request.sizeBytes < 1 || request.sizeBytes > policy.maxBytes) throw new Error("INVALID_FILE_SIZE");
  if (!policy.allowedMimeTypes.includes(request.mimeType)) throw new Error("UNSUPPORTED_MEDIA_TYPE");
  if (!SHA256.test(request.sha256)) throw new Error("INVALID_SHA256");
  safeFilename(request.filename);
  return policy;
}

export function quarantineKey(request: UploadRequest): string {
  validateUpload(request);
  return `quarantine/${request.uploadId}/${safeFilename(request.filename)}`;
}

export function publishedKey(product: string, resource: string, resourceId: string, versionId: string, filename: string): string {
  for (const value of [product, resource, resourceId, versionId]) if (!/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(value)) throw new Error("INVALID_STORAGE_SEGMENT");
  return `published/${product}/${resource}/${resourceId}/versions/${versionId}/${safeFilename(filename)}`;
}

export function loadStorageConfig(environment: NodeJS.ProcessEnv = process.env): StorageConfig {
  const required = ["AWS_REGION", "AWS_ROLE_ARN", "S3_SYSTEM_BUCKET", "S3_TENANT_BUCKET_PREFIX"] as const;
  for (const key of required) if (!environment[key]) throw new Error(`MISSING_${key}`);
  if (!environment.AWS_ROLE_ARN!.includes(":role/")) throw new Error("AWS_ROLE_ARN_MUST_BE_ROLE");
  return {
    region: environment.AWS_REGION!, roleArn: environment.AWS_ROLE_ARN!, systemBucket: environment.S3_SYSTEM_BUCKET!, tenantBucketPrefix: environment.S3_TENANT_BUCKET_PREFIX!,
    uploadUrlTtlSeconds: boundedTtl(environment.S3_UPLOAD_URL_TTL_SECONDS, 300),
    downloadUrlTtlSeconds: boundedTtl(environment.S3_DOWNLOAD_URL_TTL_SECONDS, 300),
  };
}

function boundedTtl(value: string | undefined, fallback: number): number {
  const parsed = value ? Number(value) : fallback;
  if (!Number.isInteger(parsed) || parsed < 60 || parsed > 900) throw new Error("INVALID_SIGNED_URL_TTL");
  return parsed;
}
