import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import yazl from "yazl";
import { describe, expect, it } from "vitest";
import { runNextScormPublication, type ScormPublicationJob, type ScormPublicationRepository } from "../src";

const HASH = "d".repeat(64);
const JOB: ScormPublicationJob = {
  id: "job-publication-1",
  publicationId: "publication-1",
  tenantId: "tenant-1",
  assetVersionId: "asset-version-1",
  bucketName: "private-bucket",
  objectKey: "quarantine/upload/payload.zip",
  s3VersionId: "s3-v1",
  expectedSizeBytes: 1,
  expectedSha256: HASH,
  publishedPrefix: "published/golms/course/course-1/versions/version-1/",
  expectedLaunchPath: "content/index.html",
  status: "processing",
};

const MANIFEST = `<?xml version="1.0"?>
<manifest identifier="course-1" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata><schemaversion>2004 4th Edition</schemaversion></metadata>
  <organizations default="org"><organization identifier="org"><title>Publication</title></organization></organizations>
  <resources><resource identifier="sco" adlcp:scormType="sco" href="content/index.html" /></resources>
</manifest>`;

describe("SCORM immutable publication worker", () => {
  it("extracts, uploads and marks the exact launch object ready", async () => {
    const archivePath = await tempZip([["imsmanifest.xml", MANIFEST], ["content/index.html", "launch"]]);
    const repository = fakeRepository(JOB);
    const uploaded: string[] = [];
    const result = await runNextScormPublication(
      "worker-publish",
      repository,
      { download: async () => ({ filePath: archivePath, sizeBytes: 1, sha256: HASH }) },
      { publish: async (input) => {
        uploaded.push(...input.files);
        expect(await readFile(join(input.rootDirectory, "content", "index.html"), "utf8")).toBe("launch");
      } },
    );
    expect(result).toEqual({ outcome: "succeeded", jobId: JOB.id, fileCount: 2 });
    expect(uploaded).toEqual(["content/index.html", "imsmanifest.xml"]);
    expect(repository.successes).toEqual([`${JOB.publishedPrefix}${JOB.expectedLaunchPath}`]);
    await expect(access(archivePath)).rejects.toThrow();
  });

  it("rejects a package whose manifest launch changed after validation", async () => {
    const changed = MANIFEST.replace("content/index.html", "changed.html");
    const archivePath = await tempZip([["imsmanifest.xml", changed], ["changed.html", "launch"]]);
    const repository = fakeRepository(JOB);
    const result = await runNextScormPublication(
      "worker-publish",
      repository,
      { download: async () => ({ filePath: archivePath, sizeBytes: 1, sha256: HASH }) },
      { publish: async () => { throw new Error("must not publish"); } },
    );
    expect(result).toEqual({ outcome: "rejected", jobId: JOB.id, errorCode: "SCORM_MANIFEST_CHANGED_AFTER_VALIDATION" });
  });

  it("keeps object-store failures retryable", async () => {
    const archivePath = await tempZip([["imsmanifest.xml", MANIFEST], ["content/index.html", "launch"]]);
    const repository = fakeRepository(JOB);
    const result = await runNextScormPublication(
      "worker-publish",
      repository,
      { download: async () => ({ filePath: archivePath, sizeBytes: 1, sha256: HASH }) },
      { publish: async () => { throw new Error("S3 unavailable"); } },
    );
    expect(result).toEqual({ outcome: "failed", jobId: JOB.id, errorCode: "SCORM_PUBLICATION_FAILED" });
    expect(repository.failures).toEqual(["SCORM_PUBLICATION_FAILED"]);
  });
});

function fakeRepository(job: ScormPublicationJob | null): ScormPublicationRepository & { successes: string[]; rejections: string[]; failures: string[] } {
  let claimed = false;
  const successes: string[] = [];
  const rejections: string[] = [];
  const failures: string[] = [];
  return {
    successes, rejections, failures,
    claim: async () => claimed ? null : (claimed = true, job),
    succeed: async (_job, launchKey) => { successes.push(launchKey); },
    reject: async (_job, code) => { rejections.push(code); },
    fail: async (_job, code) => { failures.push(code); },
  };
}

async function tempZip(files: Array<[string, string]>): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "respongo-publish-test-"));
  const filePath = join(directory, "course.zip");
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
