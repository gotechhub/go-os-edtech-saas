import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { loadOsCoreAccess } from "@/lib/internal-access";

const statusFor = (state: Exclude<Awaited<ReturnType<typeof loadOsCoreAccess>>, { state: "ready" }>["state"]) => {
  if (state === "unauthenticated") return 401;
  if (state === "mfa_required" || state === "forbidden") return 403;
  if (state === "unconfigured" || state === "migration_required") return 503;
  return 500;
};

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const result = await loadOsCoreAccess();
  if (result.state !== "ready") {
    return NextResponse.json({ schemaVersion: "2026-09-30", requestId, error: { code: result.state.toUpperCase() } }, { status: statusFor(result.state) });
  }
  return NextResponse.json({ schemaVersion: "2026-09-30", requestId, data: { controlPlane: "os_core", roles: result.roles, permissions: result.permissions } });
}
