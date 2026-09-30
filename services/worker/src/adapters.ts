import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { open, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import type { DownloadedObject, QuarantineObjectReader, ScormIngestionJob, ScormJobRepository, ScormManifestResult } from "./scorm-ingestion";
import type { ImmutableDirectoryPublisher, PublicationObjectReader, ScormPublicationJob, ScormPublicationRepository } from "./scorm-publication";

type RpcRow = Record<string, unknown>;

export class SupabaseScormJobRepository implements ScormJobRepository {
  private readonly workers = new Map<string, string>();
  constructor(private readonly client: SupabaseClient) {}
  async claim(workerId: string): Promise<ScormIngestionJob | null> {
    const row = await rpcOne(this.client, "v3_storage_claim_scorm_job", { worker_id: workerId, lease_seconds: 600 });
    if (!row) return null;
    const job = { id: String(row.job_id), tenantId: String(row.tenant_id), assetVersionId: String(row.asset_version_id), bucketName: String(row.bucket_name), objectKey: String(row.object_key), s3VersionId: row.s3_version_id ? String(row.s3_version_id) : null, expectedSizeBytes: Number(row.expected_size_bytes), expectedSha256: String(row.expected_sha256), status: "processing" as const };
    this.workers.set(job.id, workerId); return job;
  }
  succeed(job: ScormIngestionJob, result: ScormManifestResult) { return finishIngestion(this.client, job, this.worker(job.id), "succeeded", null, result).then(() => { this.workers.delete(job.id); }); }
  reject(job: ScormIngestionJob, errorCode: string) { return finishIngestion(this.client, job, this.worker(job.id), "rejected", errorCode, null).then(() => { this.workers.delete(job.id); }); }
  fail(job: ScormIngestionJob, errorCode: string) { return finishIngestion(this.client, job, this.worker(job.id), "failed", errorCode, null).then(() => { this.workers.delete(job.id); }); }
  private worker(jobId: string): string { const value = this.workers.get(jobId); if (!value) throw new Error("SCORM_WORKER_LEASE_MISSING"); return value; }
}

export class SupabaseScormPublicationRepository implements ScormPublicationRepository {
  private readonly workers = new Map<string, string>();
  constructor(private readonly client: SupabaseClient) {}
  async claim(workerId: string): Promise<ScormPublicationJob | null> {
    const row = await rpcOne(this.client, "v3_storage_claim_scorm_publication", { worker_id: workerId, lease_seconds: 900 });
    if (!row) return null;
    const job = { id: String(row.job_id), publicationId: String(row.publication_id), tenantId: String(row.tenant_id), assetVersionId: String(row.asset_version_id), bucketName: String(row.bucket_name), objectKey: String(row.object_key), s3VersionId: row.s3_version_id ? String(row.s3_version_id) : null, expectedSizeBytes: Number(row.expected_size_bytes), expectedSha256: String(row.expected_sha256), publishedPrefix: String(row.published_prefix), expectedLaunchPath: String(row.expected_launch_path), status: "processing" as const };
    this.workers.set(job.id, workerId); return job;
  }
  succeed(job: ScormPublicationJob, launchObjectKey: string, fileCount: number) { return finishPublication(this.client, job, this.worker(job.id), "succeeded", null, launchObjectKey, fileCount).then(() => { this.workers.delete(job.id); }); }
  reject(job: ScormPublicationJob, errorCode: string) { return finishPublication(this.client, job, this.worker(job.id), "rejected", errorCode, null, null).then(() => { this.workers.delete(job.id); }); }
  fail(job: ScormPublicationJob, errorCode: string) { return finishPublication(this.client, job, this.worker(job.id), "failed", errorCode, null, null).then(() => { this.workers.delete(job.id); }); }
  private worker(jobId: string): string { const value = this.workers.get(jobId); if (!value) throw new Error("SCORM_WORKER_LEASE_MISSING"); return value; }
}

export class S3ScormObjectReader implements QuarantineObjectReader, PublicationObjectReader {
  constructor(private readonly s3: S3Client) {}
  async download(job: ScormIngestionJob | ScormPublicationJob): Promise<DownloadedObject> {
    const filePath = join(tmpdir(), `respongo-scorm-object-${randomUUID()}.zip`);
    try {
      const object = await this.s3.send(new GetObjectCommand({ Bucket: job.bucketName, Key: job.objectKey, VersionId: job.s3VersionId ?? undefined }));
      if (!object.Body) throw new Error("S3_OBJECT_BODY_MISSING");
      const handle = await open(filePath, "wx");
      const digest = createHash("sha256");
      let sizeBytes = 0;
      try {
        for await (const chunk of object.Body as AsyncIterable<Uint8Array>) { const buffer = Buffer.from(chunk); sizeBytes += buffer.length; digest.update(buffer); await handle.write(buffer); }
      } finally { await handle.close(); }
      return { filePath, sizeBytes, sha256: digest.digest("hex") };
    } catch (error) { await rm(filePath, { force: true }); throw error; }
  }
}

export class S3ImmutableDirectoryPublisher implements ImmutableDirectoryPublisher {
  constructor(private readonly s3: S3Client) {}
  async publish(input: { bucketName: string; publishedPrefix: string; rootDirectory: string; files: readonly string[] }): Promise<void> {
    const root = resolve(input.rootDirectory);
    for (const relative of input.files) {
      const source = resolve(root, ...relative.split("/"));
      if (source !== root && !source.startsWith(`${root}${sep}`)) throw new Error("SCORM_PUBLICATION_PATH_ESCAPE");
      const key = `${input.publishedPrefix}${relative}`;
      const file = await stat(source);
      const sha256 = await sha256File(source);
      try {
        const existing = await this.s3.send(new HeadObjectCommand({ Bucket: input.bucketName, Key: key }));
        if (existing.Metadata?.["sha256-hex"] !== sha256 || existing.ContentLength !== file.size) throw new Error("SCORM_IMMUTABLE_OBJECT_CONFLICT");
        continue;
      } catch (error) {
        if (!isNotFound(error)) throw error;
      }
      await this.s3.send(new PutObjectCommand({ Bucket: input.bucketName, Key: key, Body: createReadStream(source), ContentLength: file.size, ContentType: mediaType(relative), Metadata: { "sha256-hex": sha256 }, IfNoneMatch: "*" }));
    }
  }
}

export function createWorkerDependencies(environment: NodeJS.ProcessEnv = process.env) {
  const supabaseUrl = required(environment, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = required(environment, "SUPABASE_SERVICE_ROLE_KEY");
  const region = required(environment, "AWS_REGION");
  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const s3 = new S3Client({ region });
  return { ingestionJobs: new SupabaseScormJobRepository(client), publicationJobs: new SupabaseScormPublicationRepository(client), objects: new S3ScormObjectReader(s3), publisher: new S3ImmutableDirectoryPublisher(s3) };
}

async function finishIngestion(client: SupabaseClient, job: ScormIngestionJob, workerId: string, outcome: string, code: string | null, manifest: ScormManifestResult | null): Promise<void> {
  const { error } = await client.rpc("v3_storage_finish_scorm_job", { target_job: job.id, worker_id: workerId, outcome, outcome_code: code, manifest });
  if (error) throw new Error(`SCORM_JOB_FINISH_FAILED:${error.message}`);
}

async function finishPublication(client: SupabaseClient, job: ScormPublicationJob, workerId: string, outcome: string, code: string | null, launchKey: string | null, fileCount: number | null): Promise<void> {
  const { error } = await client.rpc("v3_storage_finish_scorm_publication", { target_job: job.id, worker_id: workerId, outcome, outcome_code: code, published_launch_key: launchKey, published_file_count: fileCount });
  if (error) throw new Error(`SCORM_PUBLICATION_FINISH_FAILED:${error.message}`);
}

async function rpcOne(client: SupabaseClient, name: string, args: Record<string, unknown>): Promise<RpcRow | null> {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name.toUpperCase()}_FAILED:${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === "object" ? row as RpcRow : null;
}

function required(environment: NodeJS.ProcessEnv, key: string): string { const value = environment[key]; if (!value) throw new Error(`MISSING_${key}`); return value; }
function isNotFound(error: unknown): boolean { const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode; const name = (error as { name?: string })?.name; return status === 404 || name === "NotFound" || name === "NoSuchKey"; }
function mediaType(path: string): string { return ({ ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".xml": "application/xml", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf" } as Record<string,string>)[extname(path).toLowerCase()] ?? "application/octet-stream"; }
async function sha256File(path: string): Promise<string> { const digest=createHash("sha256"); for await (const chunk of createReadStream(path)) digest.update(chunk); return digest.digest("hex"); }
