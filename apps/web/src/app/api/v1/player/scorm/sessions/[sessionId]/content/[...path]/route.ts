import { NextResponse } from "next/server";
import { assertPlayerHost, fetchScormObject, normalizeScormPath, playerCookieName, ScormPlayerError } from "@/lib/scorm-player-runtime";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string; path: string[] }> }) {
  try {
    assertPlayerHost(request);
    const { sessionId, path } = await context.params;
    const accessToken = readCookie(request.headers.get("cookie"), playerCookieName(sessionId));
    if (!accessToken) throw new ScormPlayerError("PLAYER_ACCESS_INVALID", 403);
    const object = await fetchScormObject(sessionId, accessToken, normalizeScormPath(path), request.headers.get("range"));
    const headers = new Headers({
      "Content-Type": object.contentType,
      "Cache-Control": "private, max-age=60, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": playerCsp(),
    });
    if (object.contentLength !== undefined) headers.set("Content-Length", String(object.contentLength));
    if (object.contentRange) headers.set("Content-Range", object.contentRange);
    if (object.acceptRanges) headers.set("Accept-Ranges", object.acceptRanges);
    if (object.etag) headers.set("ETag", object.etag);
    return new Response(object.body.transformToWebStream() as ReadableStream, { status: object.contentRange ? 206 : 200, headers });
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

function playerCsp(): string {
  const appOrigin = process.env.RESPONGO_APP_ORIGIN;
  const frameAncestors = appOrigin ? new URL(appOrigin).origin : "'none'";
  return `default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; object-src 'self' blob:; frame-src 'self' data: blob:; worker-src 'self' blob:; frame-ancestors ${frameAncestors}; base-uri 'self'`;
}
