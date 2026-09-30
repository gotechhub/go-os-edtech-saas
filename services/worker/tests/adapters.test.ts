import type { SupabaseClient } from "@supabase/supabase-js";
import { HeadObjectCommand, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { S3ImmutableDirectoryPublisher, SupabaseScormJobRepository, SupabaseScormPublicationRepository } from "../src";

describe("SCORM worker database adapters", () => {
  it("returns the same worker lease when finishing ingestion", async () => {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const client = fakeClient(calls, [{ job_id: "job-1", tenant_id: "tenant-1", asset_version_id: "asset-1", bucket_name: "bucket", object_key: "quarantine/a.zip", s3_version_id: "v1", expected_size_bytes: 10, expected_sha256: "a".repeat(64) }]);
    const repository = new SupabaseScormJobRepository(client);
    const job = await repository.claim("worker-a");
    expect(job?.id).toBe("job-1");
    await repository.succeed(job!, { standard: "scorm_1_2", manifestIdentifier: "m", title: null, launchPath: "index.html", resourceCount: 1, scoCount: 1, organizationCount: 1, entryCount: 2, totalCompressedBytes: 10, totalExpandedBytes: 20, analyzerVersion: "test" });
    expect(calls.at(-1)).toMatchObject({ name: "v3_storage_finish_scorm_job", args: { worker_id: "worker-a", outcome: "succeeded" } });
  });

  it("returns the same worker lease when finishing publication", async () => {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const client = fakeClient(calls, [{ job_id: "job-2", publication_id: "pub-1", tenant_id: "tenant-1", asset_version_id: "asset-1", bucket_name: "bucket", object_key: "quarantine/a.zip", s3_version_id: "v1", expected_size_bytes: 10, expected_sha256: "a".repeat(64), published_prefix: "published/golms/course/c/versions/v/", expected_launch_path: "index.html" }]);
    const repository = new SupabaseScormPublicationRepository(client);
    const job = await repository.claim("worker-b");
    await repository.succeed(job!, `${job!.publishedPrefix}index.html`, 2);
    expect(calls.at(-1)).toMatchObject({ name: "v3_storage_finish_scorm_publication", args: { worker_id: "worker-b", outcome: "succeeded", published_file_count: 2 } });
  });

  it("publishes an immutable object and accepts only an identical retry", async () => {
    const root = await mkdtemp(join(tmpdir(), "respongo-publisher-test-"));
    await writeFile(join(root, "index.html"), "ok");
    const sent: string[] = [];
    const store: { current: { metadata: Record<string,string>; size: number } | null } = { current: null };
    const s3 = { send: vi.fn(async (command: HeadObjectCommand | PutObjectCommand) => {
      if (command instanceof HeadObjectCommand) {
        if (!store.current) throw Object.assign(new Error("missing"), { $metadata: { httpStatusCode: 404 } });
        return { Metadata: store.current.metadata, ContentLength: store.current.size };
      }
      sent.push(String(command.input.Key));
      store.current = { metadata: command.input.Metadata ?? {}, size: Number(command.input.ContentLength) };
      return {};
    }) } as unknown as S3Client;
    const publisher = new S3ImmutableDirectoryPublisher(s3);
    const input = { bucketName: "bucket", publishedPrefix: "published/golms/course/c/versions/v/", rootDirectory: root, files: ["index.html"] };
    try {
      await publisher.publish(input);
      await publisher.publish(input);
      expect(sent).toEqual(["published/golms/course/c/versions/v/index.html"]);
      expect(store.current).not.toBeNull();
      expect(store.current!.metadata["sha256-hex"]).toMatch(/^[0-9a-f]{64}$/);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});

function fakeClient(calls: Array<{ name: string; args: Record<string, unknown> }>, claimRows: unknown[]): SupabaseClient {
  let first = true;
  return { rpc: vi.fn(async (name: string, args: Record<string, unknown>) => { calls.push({ name, args }); if (first) { first = false; return { data: claimRows, error: null }; } return { data: null, error: null }; }) } as unknown as SupabaseClient;
}
