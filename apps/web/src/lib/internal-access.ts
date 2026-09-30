import { createSupabaseServerClient } from "./supabase/server";

export type InternalAccessRow = {
  control_plane: "os_core" | "super_admin";
  role_key: string;
  permission_key: string;
};

export type InternalAccessResult =
  | { state: "ready"; roles: string[]; permissions: string[] }
  | { state: "unconfigured" | "unauthenticated" | "mfa_required" | "forbidden" | "migration_required" | "error" };

export async function loadOsCoreAccess(): Promise<InternalAccessResult> {
  const client = await createSupabaseServerClient();
  if (!client) return { state: "unconfigured" };

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) return { state: "error" };
  if (!user) return { state: "unauthenticated" };

  const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) return { state: "error" };
  if (assurance.currentLevel !== "aal2") return { state: "mfa_required" };

  const { data, error } = await client.rpc("v3_my_internal_access");
  if (error) return { state: error.code === "PGRST202" || error.code === "42883" ? "migration_required" : "error" };
  const rows = ((data ?? []) as InternalAccessRow[]).filter((row) => row.control_plane === "os_core");
  if (!rows.length) return { state: "forbidden" };
  return {
    state: "ready",
    roles: [...new Set(rows.map((row) => row.role_key))].sort(),
    permissions: [...new Set(rows.map((row) => row.permission_key))].sort(),
  };
}
