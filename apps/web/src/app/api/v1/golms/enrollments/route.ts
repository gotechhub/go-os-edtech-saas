import { ApplicationError } from "@respongo-os/golms/application";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { commandRuntime } from "@/lib/golms-runtime";

export async function GET() {
  const requestId = randomUUID();
  try {
    const current = await commandRuntime("tr-TR");
    if (current.state !== "ready") throw new ApplicationError(current.state === "unauthenticated" ? "UNAUTHENTICATED" : "FORBIDDEN", "Erişim reddedildi.", current.state === "unauthenticated" ? 401 : 403);
    return NextResponse.json(await current.service.listMyEnrollments(current.context));
  } catch (error) { return apiError(error, requestId); }
}
