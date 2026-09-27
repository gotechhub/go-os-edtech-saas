import type { RequestContext } from "@respongo-os/golms/application";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";

export type ContextResult = { ok: true; context: RequestContext } | { ok: false; reason: "unauthenticated" | "tenant_required" | "forbidden" };

export async function resolveRequestContext(client: SupabaseClient, locale = "tr-TR"): Promise<ContextResult> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  const store = await cookies();
  const selectedTenant = store.get("respongo_active_tenant")?.value;
  const { data, error } = await client.schema("v3_platform").from("memberships").select("tenant_id,user_id,status").eq("user_id", user.id).eq("status", "active");
  if (error || !data?.length) return { ok: false, reason: "forbidden" };
  const membership = selectedTenant ? data.find((item) => item.tenant_id === selectedTenant) : data.length === 1 ? data[0] : null;
  if (!membership) return { ok: false, reason: "tenant_required" };
  const requestHeaders = await headers();
  return { ok: true, context: {
    requestId: requestHeaders.get("x-request-id") ?? randomUUID(), tenantId: membership.tenant_id, actorId: user.id, locale,
    idempotencyKey: requestHeaders.get("idempotency-key") ?? randomUUID(),
  } };
}
