import { createSupabaseServerClient } from "./supabase/server";

export interface SecurityIncidentRow {
  incident_id: string;
  tenant_id: string | null;
  title_code: string;
  severity: "low" | "medium" | "high" | "critical";
  incident_status: "open" | "triaged" | "contained" | "recovering" | "closed";
  signal_type: string;
  summary_code: string;
  evidence_count: number;
  action_count: number;
  opened_at: string;
  updated_at: string;
  observed_at: string;
}

export interface AuditEventRow {
  event_id: string;
  tenant_id: string | null;
  actor_id: string | null;
  control_plane: string;
  correlation_id: string;
  action: string;
  object_type: string;
  object_id: string;
  occurred_at: string;
}

export type SecurityOverviewResult =
  | { state: "ready"; incidents: SecurityIncidentRow[]; audit: AuditEventRow[] }
  | { state: "unconfigured" | "migration_required" | "error" };

export async function loadSecurityOverview(): Promise<SecurityOverviewResult> {
  const client = await createSupabaseServerClient();
  if (!client) return { state: "unconfigured" };
  const [incidents, audit] = await Promise.all([
    client.rpc("v3_core_security_overview"),
    client.rpc("v3_core_audit_search", { target_tenant: null, target_action_prefix: "core.", result_limit: 50 }),
  ]);
  const error = incidents.error ?? audit.error;
  if (error) return { state: error.code === "PGRST202" || error.code === "42883" ? "migration_required" : "error" };
  return { state: "ready", incidents: (incidents.data ?? []) as SecurityIncidentRow[], audit: (audit.data ?? []) as AuditEventRow[] };
}
