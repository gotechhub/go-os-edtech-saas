import { access, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import yazl from "yazl";
import { describe, expect, it } from "vitest";
import { runNextScormIngestion, type QuarantineObjectReader, type ScormIngestionJob, type ScormJobRepository, type ScormManifestResult } from "../src";

const JOB: ScormIngestionJob = {
  id: "job-1",
  tenantId: "tenant-1",
  assetVersionId: "asset-version-1",
  bucketName: "private-bucket",
  objectKey: "quarantine/upload-1/payload.zip",
  s3VersionId: "s3-version-1",
  expectedSizeBytes: 1,
  expectedSha256: "a".repeat(64),
  status: "processing",
};

const MANIFEST = `<?xml version="1.0"?>
<manifest identifier="course-1" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schemaversion>1.2</schemaversion></metadata>
  <organizations default="org"><organization identifier="org"><title>Worker Testi</title></organization></organizations>
  <resources><resource identifier="sco" adlcp:scormtype="sco" href="index.html" /></resources>
</manifest>`;

describe("SCORM ingestion worker", () => {
  it("stores one immutable manifest result and removes the temporary download", async () => {
    const filePath = await tempZip([["imsmanifest.xml", MANIFEST], ["index.html", "ok"]]);
    const repository = fakeRepository(JOB);
    const result = await runNextScormIngestion("worker-a", repository, reader(filePath));

    expect(result).toEqual({ outcome: "succeeded", jobId: JOB.id });
    expect(repository.results).toHaveLength(1);
    expect(repository.results[0]).toMatchObject({ standard: "scorm_1_2", launchPath: "index.html", manifestIdentifier: "course-1" });
    await expect(access(filePath)).rejects.toThrow();
  });

  it("records a deterministic validation rejection without retrying it", async () => {
    const filePath = await tempZip([["readme.txt", "manifest yok"]]);
    const repository = fakeRepository(JOB);
    const result = await runNextScormIngestion("worker-a", repository, reader(filePath));

    expect(result).toEqual({ outcome: "rejected", jobId: JOB.id, errorCode: "SCORM_MANIFEST_MISSING" });
    expect(repository.rejections).toEqual(["SCORM_MANIFEST_MISSING"]);
    expect(repository.failures).toEqual([]);
    await expect(access(filePath)).rejects.toThrow();
  });

  it("marks transport failures as retryable operational failures", async () => {
    const repository = fakeRepository(JOB);
    const result = await runNextScormIngestion("worker-a", repository, { download: async () => { throw new Error("S3 unavailable"); } });

    expect(result).toEqual({ outcome: "failed", jobId: JOB.id, errorCode: "SCORM_INGESTION_FAILED" });
    expect(repository.failures).toEqual(["SCORM_INGESTION_FAILED"]);
  });

  it("rejects a downloaded object whose integrity differs from the recorded asset version", async () => {
    const filePath = await tempZip([["imsmanifest.xml", MANIFEST], ["index.html", "ok"]]);
    const repository = fakeRepository(JOB);
    const result = await runNextScormIngestion("worker-a", repository, {
      download: async () => ({ filePath, sizeBytes: 2, sha256: "b".repeat(64) }),
    });
    expect(result).toEqual({ outcome: "rejected", jobId: JOB.id, errorCode: "SCORM_OBJECT_INTEGRITY_MISMATCH" });
    await expect(access(filePath)).rejects.toThrow();
  });

  it("is idle when the repository has no claimable job", async () => {
    const repository = fakeRepository(null);
    const result = await runNextScormIngestion("worker-a", repository, { download: async () => { throw new Error("must not run"); } });
    expect(result).toEqual({ outcome: "idle" });
  });
});

function fakeRepository(job: ScormIngestionJob | null): ScormJobRepository & { results: ScormManifestResult[]; rejections: string[]; failures: string[] } {
  const results: ScormManifestResult[] = [];
  const rejections: string[] = [];
  const failures: string[] = [];
  let claimed = false;
  return {
    results,
    rejections,
    failures,
    claim: async () => claimed ? null : (claimed = true, job),
    succeed: async (_job, result) => { results.push(result); },
    reject: async (_job, code) => { rejections.push(code); },
    fail: async (_job, code) => { failures.push(code); },
  };
}

function reader(filePath: string): QuarantineObjectReader {
  return { download: async () => ({ filePath, sizeBytes: 1, sha256: "a".repeat(64) }) };
}

async function tempZip(files: Array<[string, string]>): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "respongo-scorm-"));
  const filePath = join(directory, "package.zip");
  await writeFile(filePath, await zip(files));
  return filePath;
}

function zip(files: Array<[string, string]>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = new yazl.ZipFile();
    const chunks: Buffer[] = [];
    archive.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.outputStream.on("error", reject);
    archive.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    for (const [name, content] of files) archive.addBuffer(Buffer.from(content), name);
    archive.end();
  });
}
