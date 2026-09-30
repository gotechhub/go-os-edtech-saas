import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { assertPlayerHost, playerCookieName, recordScormRuntimeEvent, ScormPlayerError, type PlayerRuntimeEvent } from "@/lib/scorm-player-runtime";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    assertPlayerHost(request);
    const { sessionId } = await context.params;
    const accessToken = readCookie(request.headers.get("cookie"), playerCookieName(sessionId));
    if (!accessToken) throw new ScormPlayerError("PLAYER_ACCESS_INVALID", 403);
    const raw = await request.text();
    const input = JSON.parse(raw) as Omit<PlayerRuntimeEvent, "evidenceHash">;
    const result = await recordScormRuntimeEvent(sessionId, accessToken, { ...input, evidenceHash: createHash("sha256").update(raw).digest("hex") });
    return NextResponse.json({ schemaVersion: "2026-09-27", data: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof ScormPlayerError ? error.status : 500;
    const code = error instanceof ScormPlayerError ? error.code : "PLAYER_INTERNAL_ERROR";
    return NextResponse.json({ schemaVersion: "2026-09-27", error: { code } }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

function readCookie(header: string | null, name: string): string | null {
  for (const part of (header ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}
