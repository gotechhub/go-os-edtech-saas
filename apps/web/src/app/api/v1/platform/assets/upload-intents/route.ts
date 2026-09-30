import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createUploadIntent, StorageApiError } from "@/lib/storage-runtime";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const input = await request.json() as Record<string, unknown>;
    if (typeof input.filename !== "string" || typeof input.mimeType !== "string" || typeof input.sizeBytes !== "number" || typeof input.sha256 !== "string" || input.purpose !== "golms-learning-content") throw new StorageApiError("VALIDATION_FAILED", 400);
    return NextResponse.json(await createUploadIntent({ filename: input.filename, mimeType: input.mimeType, sizeBytes: input.sizeBytes, sha256: input.sha256, purpose: input.purpose }), { status: 201 });
  } catch (error) { return apiError(error, requestId); }
}
