import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { loadOsCoreAccess } from "@/lib/internal-access";
import { collectSystemHealth } from "@/lib/system-health";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const access = await loadOsCoreAccess();
  if (access.state !== "ready") return NextResponse.json({ schemaVersion: "2026-10-01", requestId, error: { code: access.state.toUpperCase() } }, { status: access.state === "unauthenticated" ? 401 : 403 });
  if (!access.permissions.includes("core.read")) return NextResponse.json({ schemaVersion: "2026-10-01", requestId, error: { code: "FORBIDDEN" } }, { status: 403 });
  const health = await collectSystemHealth();
  return NextResponse.json({ schemaVersion: "2026-10-01", requestId, data: health });
}
