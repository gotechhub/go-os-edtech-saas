import { NextResponse } from "next/server";
import { assertPlayerHost, exchangeScormTicket, playerCookieName, ScormPlayerError } from "@/lib/scorm-player-runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const origin = assertPlayerHost(request);
    const contentType = request.headers.get("content-type") ?? "";
    const input = contentType.includes("application/json")
      ? await request.json() as { sessionId?: unknown; ticket?: unknown }
      : Object.fromEntries((await request.formData()).entries());
    if (typeof input.sessionId !== "string" || typeof input.ticket !== "string") throw new ScormPlayerError("LAUNCH_TICKET_INVALID", 400);
    const exchanged = await exchangeScormTicket(input.sessionId, input.ticket);
    const playerUrl = new URL(`/api/v1/player/scorm/sessions/${input.sessionId}/player`, origin);
    const response = contentType.includes("application/json")
      ? NextResponse.json({ schemaVersion: "2026-09-27", data: { playerUrl: playerUrl.toString(), standard: exchanged.standard, expiresAt: exchanged.expiresAt } })
      : NextResponse.redirect(playerUrl, 303);
    response.cookies.set(playerCookieName(input.sessionId), exchanged.accessToken, {
      httpOnly: true, secure: origin.protocol === "https:", sameSite: "strict",
      path: `/api/v1/player/scorm/sessions/${input.sessionId}`, expires: new Date(exchanged.expiresAt),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const status = error instanceof ScormPlayerError ? error.status : 500;
    const code = error instanceof ScormPlayerError ? error.code : "PLAYER_INTERNAL_ERROR";
    return NextResponse.json({ schemaVersion: "2026-09-27", error: { code } }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
