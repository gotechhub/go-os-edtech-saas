import { createSupabaseServerClient } from "./supabase/server";

export interface InfrastructureResourceRow {
  resource_id: string;
  tenant_id: string | null;
  provider: string;
  resource_type: string;
  environment: string;
  region: string | null;
  resource_status: string;
  health_status: string | null;
  capacity_percent: string | null;
  control_status: "verified" | "misconfigured" | "unknown";
  observed_at: string | null;
  freshness: "live" | "stale" | "unknown";
}

export interface MigrationReadinessRow {
  check_key: string;
  check_status: "pending" | "passed" | "failed" | "not_applicable";
  evidence_reference: string | null;
  evidence_sha256: string | null;
  observed_at: string | null;
}

export type InfrastructureOverviewResult =
  | { state: "ready"; resources: InfrastructureResourceRow[]; migrationReadiness: MigrationReadinessRow[] }
  | { state: "unconfigured" | "migration_required" | "error" };

export async function loadInfrastructureOverview(): Promise<InfrastructureOverviewResult> {
  const client = await createSupabaseServerClient();
  if (!client) return { state: "unconfigured" };
  const [resources, migrationReadiness] = await Promise.all([
    client.rpc("v3_core_infrastructure_overview"),
    client.rpc("v3_core_aws_migration_readiness"),
  ]);
  const error = resources.error ?? migrationReadiness.error;
  if (error) return { state: error.code === "PGRST202" || error.code === "42883" ? "migration_required" : "error" };
  return { state: "ready", resources: (resources.data ?? []) as InfrastructureResourceRow[], migrationReadiness: (migrationReadiness.data ?? []) as MigrationReadinessRow[] };
}
