import { GolmsApplicationService, type EnrollmentSummary, type ProgramReportRow, type ProgramSummary, type ScormContentSummary } from "@respongo-os/golms/application";
import { SupabaseGolmsGateway } from "@/infrastructure/supabase-golms-gateway";
import { resolveRequestContext } from "./request-context";
import { createSupabaseServerClient } from "./supabase/server";

export type PageData<T> = { state: "ready"; data: readonly T[] } | { state: "unconfigured" | "unauthenticated" | "tenant_required" | "forbidden" | "error"; data: readonly T[] };

async function runtime(locale: string) {
  const client = await createSupabaseServerClient();
  if (!client) return { state: "unconfigured" as const };
  const context = await resolveRequestContext(client, locale);
  if (!context.ok) return { state: context.reason as "unauthenticated" | "tenant_required" | "forbidden" };
  return { state: "ready" as const, context: context.context, service: new GolmsApplicationService(new SupabaseGolmsGateway(client)) };
}

export async function loadPrograms(locale: string): Promise<PageData<ProgramSummary>> {
  const current = await runtime(locale);
  if (current.state !== "ready") return { state: current.state, data: [] };
  try { return { state: "ready", data: (await current.service.listPrograms(current.context)).data }; } catch { return { state: "error", data: [] }; }
}

export async function loadScormContent(locale: string): Promise<PageData<ScormContentSummary>> {
  const current = await runtime(locale);
  if (current.state !== "ready") return { state: current.state, data: [] };
  try { return { state: "ready", data: (await current.service.listScormContent(current.context)).data }; } catch { return { state: "error", data: [] }; }
}

export async function loadEnrollments(locale: string): Promise<PageData<EnrollmentSummary>> {
  const current = await runtime(locale);
  if (current.state !== "ready") return { state: current.state, data: [] };
  try { return { state: "ready", data: (await current.service.listMyEnrollments(current.context)).data }; } catch { return { state: "error", data: [] }; }
}

export async function loadProgramReport(locale: string, programVersionId: string): Promise<PageData<ProgramReportRow>> {
  const current = await runtime(locale);
  if (current.state !== "ready") return { state: current.state, data: [] };
  try { return { state: "ready", data: (await current.service.getProgramReport(current.context, programVersionId)).data }; } catch { return { state: "error", data: [] }; }
}

export async function commandRuntime(locale: string) {
  const current = await runtime(locale);
  if (current.state !== "ready") return current;
  return current;
}
