import { ApplicationError } from "@respongo-os/golms/application";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { commandRuntime } from "@/lib/golms-runtime";

export async function POST(request: Request, context: { params: Promise<{ versionId: string }> }) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const current = await commandRuntime("tr-TR");
    if (current.state !== "ready") throw new ApplicationError(current.state === "unauthenticated" ? "UNAUTHENTICATED" : "FORBIDDEN", "Erişim reddedildi.", current.state === "unauthenticated" ? 401 : 403);
    const { versionId } = await context.params;
    return NextResponse.json(await current.service.publishLearningObject(current.context, versionId));
  } catch (error) { return apiError(error, requestId); }
}
