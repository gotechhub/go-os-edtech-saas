import { NextResponse } from "next/server";
import { assertPlayerHost, getScormPlayer, normalizeScormPath, playerCookieName, ScormPlayerError } from "@/lib/scorm-player-runtime";
import { renderScormPlayerShell } from "@/lib/scorm-player-shell";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    assertPlayerHost(request);
    const { sessionId } = await context.params;
    const accessToken = readCookie(request.headers.get("cookie"), playerCookieName(sessionId));
    if (!accessToken) throw new ScormPlayerError("PLAYER_ACCESS_INVALID", 403);
    const player = await getScormPlayer(sessionId, accessToken);
    const launchPath = normalizeScormPath(player.launchPath.split("/"));
    const html = renderScormPlayerShell({ sessionId, launchPath, standard: player.standard, initialState: player.initialState, initialSequence: player.initialSequence });
    return new Response(html, { headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": shellCsp(),
    } });
  } catch (error) {
    const status = error instanceof ScormPlayerError ? error.status : 500;
    const code = error instanceof ScormPlayerError ? error.code : "PLAYER_INTERNAL_ERROR";
    return NextResponse.json({ schemaVersion: "2026-09-27", error: { code } }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

function readCookie(header: string | null, name: string): string | null {
  for (const part of (header ?? "").split(";")) { const [key, ...rest] = part.trim().split("="); if (key === name) return decodeURIComponent(rest.join("=")); }
  return null;
}

function shellCsp(): string {
  const appOrigin = process.env.RESPONGO_APP_ORIGIN;
  const frameAncestors = appOrigin ? new URL(appOrigin).origin : "'none'";
  return `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; connect-src 'self'; frame-ancestors ${frameAncestors}; base-uri 'none'; form-action 'none'`;
}
