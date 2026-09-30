import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadStorageConfig } from "@respongo-os/storage";
import { createClient } from "@supabase/supabase-js";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { createHash, randomBytes } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE_PREFIX = "respongo-scorm-";

type RpcRow = Record<string, unknown>;

export class ScormPlayerError extends Error {
  constructor(public readonly code: string, public readonly status: number) { super(code); }
}

export function hashPlayerSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function playerCookieName(sessionId: string): string {
  if (!UUID.test(sessionId)) throw new ScormPlayerError("PLAYER_SESSION_INVALID", 400);
  return `${COOKIE_PREFIX}${sessionId}`;
}

export function normalizeScormPath(segments: readonly string[]): string {
  if (!segments.length) throw new ScormPlayerError("PLAYER_OBJECT_PATH_INVALID", 400);
  const decoded = segments.map((segment) => {
    try { return decodeURIComponent(segment); } catch { throw new ScormPlayerError("PLAYER_OBJECT_PATH_INVALID", 400); }
  });
  const path = decoded.join("/");
  const pathSegments = path.split("/");
  if (!path || path.startsWith("/") || path.includes("\\") || path.includes("\0") || path.includes("://") || path.includes("//")
    || pathSegments.some((segment) => !segment || segment === "." || segment === "..")) throw new ScormPlayerError("PLAYER_OBJECT_PATH_INVALID", 400);
  return path;
}

export function assertPlayerHost(request: Request): URL {
  const configured = process.env.SCORM_PLAYER_ORIGIN;
  if (!configured) throw new ScormPlayerError("PLAYER_UNCONFIGURED", 503);
  const expected = new URL(configured);
  if (expected.protocol !== "https:" && expected.hostname !== "localhost" && expected.hostname !== "127.0.0.1") throw new ScormPlayerError("PLAYER_ORIGIN_INSECURE", 503);
  const actual = new URL(request.url);
  if (actual.host !== expected.host) throw new ScormPlayerError("PLAYER_HOST_FORBIDDEN", 403);
  return expected;
}

export function validatePlayerRange(range?: string | null): string | undefined {
  if (!range) return undefined;
  if (!/^bytes=(?:\d+-\d*|\d*-\d+)$/.test(range)) throw new ScormPlayerError("PLAYER_RANGE_INVALID", 416);
  return range;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new ScormPlayerError("PLAYER_UNCONFIGURED", 503);
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function one(data: unknown): RpcRow {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") throw new ScormPlayerError("PLAYER_ACCESS_INVALID", 403);
  return row as RpcRow;
}

function mapRpcError(message?: string): never {
  if (message?.includes("PATH_INVALID")) throw new ScormPlayerError("PLAYER_OBJECT_PATH_INVALID", 400);
  if (message?.includes("ACCESS_INVALID") || message?.includes("TICKET_INVALID")) throw new ScormPlayerError("PLAYER_ACCESS_INVALID", 403);
  if (message?.includes("OUT_OF_ORDER") || message?.includes("EVENT_INVALID")) throw new ScormPlayerError("RUNTIME_EVENT_CONFLICT", 409);
  if (message?.includes("EVIDENCE_INVALID") || message?.includes("STATE_INVALID")) throw new ScormPlayerError("RUNTIME_EVENT_INVALID", 400);
  throw new ScormPlayerError("PLAYER_DEPENDENCY_UNAVAILABLE", 503);
}

export async function exchangeScormTicket(sessionId: string, ticket: string) {
  if (!UUID.test(sessionId) || !/^[A-Za-z0-9_-]{40,128}$/.test(ticket)) throw new ScormPlayerError("LAUNCH_TICKET_INVALID", 400);
  const accessToken = randomBytes(32).toString("base64url");
  const client = serviceClient();
  const { data, error } = await client.rpc("v3_golms_exchange_scorm_launch", {
    target_session: sessionId,
    launch_ticket_hash: hashPlayerSecret(ticket),
    player_access_hash: hashPlayerSecret(accessToken),
  });
  if (error) mapRpcError(error.message);
  const row = one(data);
  return {
    accessToken,
    launchPath: String(row.launch_path),
    standard: String(row.standard),
    initialState: isRecord(row.initial_state) ? row.initial_state : {},
    initialSequence: Number(row.initial_sequence),
    expiresAt: String(row.access_expires_at),
  };
}

export async function getScormPlayer(sessionId: string, accessToken: string) {
  if (!UUID.test(sessionId) || !/^[A-Za-z0-9_-]{40,128}$/.test(accessToken)) throw new ScormPlayerError("PLAYER_ACCESS_INVALID", 403);
  const client = serviceClient();
  const { data, error } = await client.rpc("v3_golms_get_scorm_player", { target_session: sessionId, player_access_hash: hashPlayerSecret(accessToken) });
  if (error) mapRpcError(error.message);
  const row = one(data);
  return { launchPath: String(row.launch_path), standard: String(row.standard), initialState: isRecord(row.initial_state) ? row.initial_state : {}, initialSequence: Number(row.initial_sequence), expiresAt: String(row.access_expires_at) };
}

export async function fetchScormObject(sessionId: string, accessToken: string, requestedPath: string, range?: string | null) {
  if (!UUID.test(sessionId) || !/^[A-Za-z0-9_-]{40,128}$/.test(accessToken)) throw new ScormPlayerError("PLAYER_ACCESS_INVALID", 403);
  const safeRange = validatePlayerRange(range);
  const client = serviceClient();
  const { data, error } = await client.rpc("v3_golms_resolve_scorm_object", {
    target_session: sessionId,
    player_access_hash: hashPlayerSecret(accessToken),
    requested_path: requestedPath,
  });
  if (error) mapRpcError(error.message);
  const row = one(data);
  const config = loadStorageConfig();
  const s3 = new S3Client({ region: config.region, credentials: awsCredentialsProvider({ roleArn: config.roleArn, audience: "sts.amazonaws.com" }) });
  const object = await s3.send(new GetObjectCommand({ Bucket: String(row.bucket_name), Key: String(row.object_key), Range: safeRange }));
  if (!object.Body) throw new ScormPlayerError("PLAYER_OBJECT_NOT_FOUND", 404);
  return { body: object.Body, contentType: object.ContentType ?? "application/octet-stream", contentLength: object.ContentLength, contentRange: object.ContentRange, acceptRanges: object.AcceptRanges, etag: object.ETag };
}

export interface PlayerRuntimeEvent {
  idempotencyKey: string;
  sequence: number;
  kind: "initialized" | "progressed" | "suspended" | "submitted" | "terminated";
  occurredAt: string;
  completionStatus?: "unknown" | "incomplete" | "complete" | null;
  successStatus?: "unknown" | "passed" | "failed" | null;
  progress?: number | null;
  scoreRaw?: number | null;
  scoreScaled?: number | null;
  sessionDurationSeconds?: number;
  evidenceHash: string;
  stateSnapshot: Record<string, string>;
}

export async function recordScormRuntimeEvent(sessionId: string, accessToken: string, event: PlayerRuntimeEvent) {
  if (!UUID.test(sessionId) || !/^[A-Za-z0-9_-]{40,128}$/.test(accessToken)) throw new ScormPlayerError("PLAYER_ACCESS_INVALID", 403);
  if (!event.idempotencyKey || event.idempotencyKey.length > 200 || !Number.isInteger(event.sequence) || event.sequence < 1
    || !["initialized","progressed","suspended","submitted","terminated"].includes(event.kind)
    || !Number.isFinite(Date.parse(event.occurredAt)) || !/^[0-9a-f]{64}$/.test(event.evidenceHash)
    || !isRecord(event.stateSnapshot) || Object.values(event.stateSnapshot).some((value) => typeof value !== "string")
    || Buffer.byteLength(JSON.stringify(event.stateSnapshot), "utf8") > 1048576) throw new ScormPlayerError("RUNTIME_EVENT_INVALID", 400);
  const client = serviceClient();
  const { data, error } = await client.rpc("v3_golms_record_player_runtime_event", {
    target_session: sessionId, player_access_hash: hashPlayerSecret(accessToken), event_key: event.idempotencyKey,
    event_sequence: event.sequence, event_kind: event.kind, event_occurred_at: event.occurredAt,
    new_completion: event.completionStatus ?? null, new_success: event.successStatus ?? null,
    new_progress: event.progress ?? null, new_score_raw: event.scoreRaw ?? null, new_score_scaled: event.scoreScaled ?? null,
    session_seconds: event.sessionDurationSeconds ?? 0, evidence_hash: event.evidenceHash, state_snapshot: event.stateSnapshot,
  });
  if (error) mapRpcError(error.message);
  const row = one(data);
  return { attemptId: String(row.id), status: String(row.status), completionStatus: String(row.completion_status), successStatus: String(row.success_status), lastSequence: Number(row.last_sequence) };
}

function isRecord(value: unknown): value is Record<string, string> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
