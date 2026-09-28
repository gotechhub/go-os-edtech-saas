import { rm } from "node:fs/promises";
import { analyzeScormPackageFile, ScormValidationError, type ScormPackageAnalysis } from "@respongo-os/scorm";

export const SCORM_ANALYZER_VERSION = "respongo-scorm/0.1.0";

export interface ScormIngestionJob {
  id: string;
  tenantId: string;
  assetVersionId: string;
  bucketName: string;
  objectKey: string;
  s3VersionId: string | null;
  expectedSizeBytes: number;
  expectedSha256: string;
  status: "processing";
}

export interface DownloadedObject {
  filePath: string;
  sizeBytes: number;
  sha256: string;
}

export interface ScormManifestResult {
  standard: "scorm_1_2" | "scorm_2004_3rd" | "scorm_2004_4th";
  manifestIdentifier: string;
  title: string | null;
  launchPath: string;
  resourceCount: number;
  scoCount: number;
  organizationCount: number;
  entryCount: number;
  totalCompressedBytes: number;
  totalExpandedBytes: number;
  analyzerVersion: string;
}

export interface ScormJobRepository {
  claim(workerId: string): Promise<ScormIngestionJob | null>;
  succeed(job: ScormIngestionJob, result: ScormManifestResult): Promise<void>;
  reject(job: ScormIngestionJob, errorCode: string): Promise<void>;
  fail(job: ScormIngestionJob, errorCode: string): Promise<void>;
}

export interface QuarantineObjectReader {
  download(job: ScormIngestionJob): Promise<DownloadedObject>;
}

export type ScormWorkerResult =
  | { outcome: "idle" }
  | { outcome: "succeeded"; jobId: string }
  | { outcome: "rejected"; jobId: string; errorCode: string }
  | { outcome: "failed"; jobId: string; errorCode: string };

export async function runNextScormIngestion(
  workerId: string,
  jobs: ScormJobRepository,
  objects: QuarantineObjectReader,
): Promise<ScormWorkerResult> {
  const job = await jobs.claim(workerId);
  if (!job) return { outcome: "idle" };

  let download: DownloadedObject | undefined;
  try {
    download = await objects.download(job);
    if (download.sizeBytes !== job.expectedSizeBytes || download.sha256 !== job.expectedSha256) {
      throw new ScormIngestionRejection("SCORM_OBJECT_INTEGRITY_MISMATCH");
    }
    const analysis = await analyzeScormPackageFile(download.filePath);
    await jobs.succeed(job, toManifestResult(analysis));
    return { outcome: "succeeded", jobId: job.id };
  } catch (error) {
    if (error instanceof ScormValidationError || error instanceof ScormIngestionRejection) {
      await jobs.reject(job, error.code);
      return { outcome: "rejected", jobId: job.id, errorCode: error.code };
    }
    const errorCode = operationalErrorCode(error);
    await jobs.fail(job, errorCode);
    return { outcome: "failed", jobId: job.id, errorCode };
  } finally {
    if (download?.filePath) await rm(download.filePath, { force: true });
  }
}

class ScormIngestionRejection extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ScormIngestionRejection";
  }
}

function toManifestResult(analysis: ScormPackageAnalysis): ScormManifestResult {
  return {
    standard: analysis.manifest.version === "1.2"
      ? "scorm_1_2"
      : analysis.manifest.version === "2004-3rd" ? "scorm_2004_3rd" : "scorm_2004_4th",
    manifestIdentifier: analysis.manifest.identifier,
    title: analysis.manifest.title,
    launchPath: analysis.manifest.launchPath,
    resourceCount: analysis.manifest.resourceCount,
    scoCount: analysis.manifest.scoCount,
    organizationCount: analysis.manifest.organizationCount,
    entryCount: analysis.entries.length,
    totalCompressedBytes: analysis.totalCompressedBytes,
    totalExpandedBytes: analysis.totalExpandedBytes,
    analyzerVersion: SCORM_ANALYZER_VERSION,
  };
}

function operationalErrorCode(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") return "SCORM_DOWNLOAD_ABORTED";
  return "SCORM_INGESTION_FAILED";
}
