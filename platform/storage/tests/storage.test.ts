import { describe, expect, it } from "vitest";
import { loadStorageConfig, publishedKey, quarantineKey, tenantBucketName } from "../src";

const TENANT = "92000000-0000-4000-8000-000000000001";
const UPLOAD = "93000000-0000-4000-8000-000000000001";

describe("Respongo OS storage key and configuration policy", () => {
  it("uses an opaque deterministic tenant bucket without customer text", () => {
    const name = tenantBucketName("respongo-assets", "beta", "eu-north-1", TENANT);
    expect(name).toMatch(/^respongo-assets-beta-eu-north-1-[a-f0-9]{20}$/);
    expect(name).not.toContain("customer");
  });

  it("keeps every upload in quarantine and rejects traversal", () => {
    expect(quarantineKey({ tenantId: TENANT, uploadId: UPLOAD, filename: "egitim.zip", mimeType: "application/zip", sizeBytes: 1024, sha256: "a".repeat(64), purpose: "golms-learning-content" }))
      .toBe(`quarantine/${UPLOAD}/egitim.zip`);
    expect(() => quarantineKey({ tenantId: TENANT, uploadId: UPLOAD, filename: "../secret.zip", mimeType: "application/zip", sizeBytes: 1024, sha256: "a".repeat(64), purpose: "golms-learning-content" })).toThrow("INVALID_FILENAME");
  });

  it("builds immutable published paths", () => {
    expect(publishedKey("golms", "course", "course_01", "version_01", "launch.html"))
      .toBe("published/golms/course/course_01/versions/version_01/launch.html");
  });

  it("requires an IAM role and bounded signed URL TTL", () => {
    expect(() => loadStorageConfig({ AWS_REGION: "eu-north-1", AWS_ROLE_ARN: "arn:aws:iam::1:user/legacy", S3_SYSTEM_BUCKET: "system", S3_TENANT_BUCKET_PREFIX: "tenant" })).toThrow("AWS_ROLE_ARN_MUST_BE_ROLE");
    expect(loadStorageConfig({ AWS_REGION: "eu-north-1", AWS_ROLE_ARN: "arn:aws:iam::1:role/vercel", S3_SYSTEM_BUCKET: "system", S3_TENANT_BUCKET_PREFIX: "tenant" }).uploadUrlTtlSeconds).toBe(300);
  });
});
