import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { completeUpload } from "@/lib/storage-runtime";

export async function POST(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const { assetId } = await context.params;
    return NextResponse.json(await completeUpload(assetId));
  } catch (error) { return apiError(error, requestId); }
}
