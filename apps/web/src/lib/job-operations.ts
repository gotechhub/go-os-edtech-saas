import { createSupabaseServerClient } from "./supabase/server";

export interface JobOperationRow {
  job_id: string;
  tenant_id: string;
  job_type: "scorm_ingestion" | "scorm_publication" | string;
  job_status: "queued" | "processing" | "succeeded" | "rejected" | "failed" | string;
  attempt_count: number;
  lease_state: "none" | "active" | "expired";
  error_code: string | null;
  created_at: string;
  updated_at: string;
  observed_at: string;
}

export type JobOperationsResult =
  | { state: "ready"; jobs: JobOperationRow[] }
  | { state: "unconfigured" | "migration_required" | "error" };

export async function loadJobOperations(): Promise<JobOperationsResult> {
  const client = await createSupabaseServerClient();
  if (!client) return { state: "unconfigured" };
  const { data, error } = await client.rpc("v3_core_job_overview");
  if (error) {
    return {
      state: error.code === "PGRST202" || error.code === "42883"
        ? "migration_required"
        : "error",
    };
  }
  return { state: "ready", jobs: (data ?? []) as JobOperationRow[] };
}
