import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ApplicationError } from "@respongo-os/golms/application";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { commandRuntime } from "@/lib/golms-runtime";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const current = await commandRuntime("tr-TR");
    if (current.state !== "ready") throw new ApplicationError(current.state === "unauthenticated" ? "UNAUTHENTICATED" : "FORBIDDEN", "Erişim reddedildi.", current.state === "unauthenticated" ? 401 : 403);
    const playerOrigin = playerOriginConfig();
    const input = await request.json() as { enrollmentId?: unknown; stepId?: unknown };
    if (typeof input.enrollmentId !== "string" || typeof input.stepId !== "string") throw new ApplicationError("VALIDATION_FAILED", "İstek geçersiz.", 400);
    const ticket = randomBytes(32).toString("base64url");
    const ticketHash = createHash("sha256").update(ticket).digest("hex");
    const issued = await current.service.issueScormLaunch(current.context, { enrollmentId: input.enrollmentId, stepId: input.stepId, ticketHash });
    return NextResponse.json({ ...issued, data: { ...issued.data, exchangeUrl: `${playerOrigin}/api/v1/player/scorm/exchange`, ticket } }, { status: 201 });
  } catch (error) { return apiError(error, requestId); }
}

function playerOriginConfig(): string {
  const value = process.env.SCORM_PLAYER_ORIGIN;
  if (!value) throw new ApplicationError("INTERNAL_ERROR", "Player yapılandırılmadı.", 503);
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") throw new ApplicationError("INTERNAL_ERROR", "Player origin güvenli değil.", 503);
  return url.origin;
}
