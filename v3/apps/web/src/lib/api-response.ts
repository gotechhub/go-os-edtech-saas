import { ApplicationError } from "@respongo-os/golms/application";
import { NextResponse } from "next/server";

export function apiError(error: unknown, requestId: string) {
  if (error instanceof ApplicationError) return NextResponse.json({ schemaVersion: "2026-09-27", requestId, error: { code: error.code } }, { status: error.status });
  return NextResponse.json({ schemaVersion: "2026-09-27", requestId, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
}
