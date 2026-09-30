import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractScormPackageFile, ScormValidationError } from "@respongo-os/scorm";
import type { DownloadedObject } from "./scorm-ingestion";

export interface ScormPublicationJob {
  id: string;
  publicationId: string;
  tenantId: string;
  assetVersionId: string;
  bucketName: string;
  objectKey: string;
  s3VersionId: string | null;
  expectedSizeBytes: number;
  expectedSha256: string;
  publishedPrefix: string;
  expectedLaunchPath: string;
  status: "processing";
}

export interface ScormPublicationRepository {
  claim(workerId: string): Promise<ScormPublicationJob | null>;
  succeed(job: ScormPublicationJob, launchObjectKey: string, fileCount: number): Promise<void>;
  reject(job: ScormPublicationJob, errorCode: string): Promise<void>;
  fail(job: ScormPublicationJob, errorCode: string): Promise<void>;
}

export interface PublicationObjectReader {
  download(job: ScormPublicationJob): Promise<DownloadedObject>;
}

export interface ImmutableDirectoryPublisher {
  publish(input: {
    bucketName: string;
    publishedPrefix: string;
    rootDirectory: string;
    files: readonly string[];
  }): Promise<void>;
}

export type ScormPublicationResult =
  | { outcome: "idle" }
  | { outcome: "succeeded"; jobId: string; fileCount: number }
  | { outcome: "rejected"; jobId: string; errorCode: string }
  | { outcome: "failed"; jobId: string; errorCode: string };

export async function runNextScormPublication(
  workerId: string,
  jobs: ScormPublicationRepository,
  objects: PublicationObjectReader,
  publisher: ImmutableDirectoryPublisher,
): Promise<ScormPublicationResult> {
  const job = await jobs.claim(workerId);
  if (!job) return { outcome: "idle" };

  const workspace = await mkdtemp(join(tmpdir(), "respongo-scorm-publish-"));
  let download: DownloadedObject | undefined;
  try {
    download = await objects.download(job);
    if (download.sizeBytes !== job.expectedSizeBytes || download.sha256 !== job.expectedSha256) {
      throw new PublicationRejection("SCORM_OBJECT_INTEGRITY_MISMATCH");
    }
    const cleanRoot = join(workspace, "clean");
    const extracted = await extractScormPackageFile(download.filePath, cleanRoot);
    if (extracted.analysis.manifest.launchPath !== job.expectedLaunchPath) {
      throw new PublicationRejection("SCORM_MANIFEST_CHANGED_AFTER_VALIDATION");
    }
    await publisher.publish({
      bucketName: job.bucketName,
      publishedPrefix: job.publishedPrefix,
      rootDirectory: cleanRoot,
      files: extracted.files,
    });
    const launchObjectKey = `${job.publishedPrefix}${job.expectedLaunchPath}`;
    await jobs.succeed(job, launchObjectKey, extracted.files.length);
    return { outcome: "succeeded", jobId: job.id, fileCount: extracted.files.length };
  } catch (error) {
    if (error instanceof ScormValidationError || error instanceof PublicationRejection) {
      const errorCode = error.code;
      await jobs.reject(job, errorCode);
      return { outcome: "rejected", jobId: job.id, errorCode };
    }
    const errorCode = error instanceof Error && error.name === "AbortError" ? "SCORM_PUBLICATION_ABORTED" : "SCORM_PUBLICATION_FAILED";
    await jobs.fail(job, errorCode);
    return { outcome: "failed", jobId: job.id, errorCode };
  } finally {
    if (download?.filePath) await rm(download.filePath, { force: true });
    await rm(workspace, { recursive: true, force: true });
  }
}

class PublicationRejection extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "PublicationRejection";
  }
}
