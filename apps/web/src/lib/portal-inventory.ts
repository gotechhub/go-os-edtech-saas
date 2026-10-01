import { createSupabaseServerClient } from "./supabase/server";

export interface PortalInventoryItem {
  tenant_id: string;
  portal_id: string;
  tenant_name: string;
  tenant_mode: "customer" | "internal_demo";
  tenant_status: string;
  region: string | null;
  default_locale: string;
  portal_slug: string;
  industry_key: string;
  portal_status: string;
  trial_ends_at: string | null;
  entitlement_count: number;
  observed_at: string;
}

export type PortalInventoryResult = { state: "ready"; items: PortalInventoryItem[] } | { state: "unconfigured" | "migration_required" | "error" };

export async function loadPortalInventory(): Promise<PortalInventoryResult> {
  const client=await createSupabaseServerClient();
  if(!client)return {state:"unconfigured"};
  const {data,error}=await client.rpc("v3_core_portal_inventory");
  if(error)return {state:error.code==="PGRST202"||error.code==="42883"?"migration_required":"error"};
  return {state:"ready",items:(data??[]) as PortalInventoryItem[]};
}
