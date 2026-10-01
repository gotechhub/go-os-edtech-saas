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

export interface IntegrationDeliveryRow {
  delivery_id: string;
  tenant_id: string;
  provider_key: string;
  capability: string;
  event_type: string;
  delivery_status: "queued" | "processing" | "succeeded" | "failed" | "dead_letter" | "cancelled" | string;
  attempt_count: number;
  lease_state: "none" | "active" | "expired";
  response_code: number | null;
  error_code: string | null;
  updated_at: string;
  observed_at: string;
}

export interface WorkerOperationRow {
  worker_id: string;
  worker_kind: string;
  worker_status: "healthy" | "degraded" | "stopping";
  runtime_version: string;
  active_job_id: string | null;
  processed_count: number;
  failed_count: number;
  freshness: "live" | "stale";
  observed_at: string;
}

export type JobOperationsResult =
  | { state: "ready"; jobs: JobOperationRow[]; deliveries: IntegrationDeliveryRow[]; workers: WorkerOperationRow[] }
  | { state: "unconfigured" | "migration_required" | "error" };

export async function loadJobOperations(): Promise<JobOperationsResult> {
  const client = await createSupabaseServerClient();
  if (!client) return { state: "unconfigured" };
  const [jobs, deliveries, workers] = await Promise.all([
    client.rpc("v3_core_job_overview"),
    client.rpc("v3_core_integration_delivery_overview"),
    client.rpc("v3_core_worker_overview"),
  ]);
  const error = jobs.error ?? deliveries.error ?? workers.error;
  if (error) {
    return {
      state: error.code === "PGRST202" || error.code === "42883"
        ? "migration_required"
        : "error",
    };
  }
  return {
    state: "ready",
    jobs: (jobs.data ?? []) as JobOperationRow[],
    deliveries: (deliveries.data ?? []) as IntegrationDeliveryRow[],
    workers: (workers.data ?? []) as WorkerOperationRow[],
  };
}
