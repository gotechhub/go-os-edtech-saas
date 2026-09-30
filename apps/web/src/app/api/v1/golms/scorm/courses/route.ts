import { ApplicationError } from "@respongo-os/golms/application";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { commandRuntime } from "@/lib/golms-runtime";

async function currentRuntime(requestId: string) {
  const current = await commandRuntime("tr-TR");
  if (current.state !== "ready") throw new ApplicationError(current.state === "unauthenticated" ? "UNAUTHENTICATED" : "FORBIDDEN", "Erişim reddedildi.", current.state === "unauthenticated" ? 401 : 403);
  return current;
}

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const current = await currentRuntime(requestId);
    return NextResponse.json(await current.service.listScormContent(current.context));
  } catch (error) { return apiError(error, requestId); }
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const current = await currentRuntime(requestId);
    const input = await request.json() as { title?: unknown; locale?: unknown; contentHash?: unknown };
    if (typeof input.title !== "string" || typeof input.locale !== "string" || typeof input.contentHash !== "string") throw new ApplicationError("VALIDATION_FAILED", "İstek geçersiz.", 400);
    return NextResponse.json(await current.service.createScormDraft(current.context, { title: input.title, locale: input.locale, contentHash: input.contentHash }), { status: 201 });
  } catch (error) { return apiError(error, requestId); }
}
