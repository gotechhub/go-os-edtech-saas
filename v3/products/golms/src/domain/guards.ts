import type { CommandContext } from "./types";

export function requireWrite(context: CommandContext): void {
  if (!context.canWrite) throw new Error("GOLMS_WRITE_FORBIDDEN");
  if (!context.tenantId || !context.actorId) throw new Error("COMMAND_CONTEXT_REQUIRED");
  requireInstant(context.now);
}

export function requireTenant(expectedTenantId: string, actualTenantId: string): void {
  if (expectedTenantId !== actualTenantId) throw new Error("TENANT_MISMATCH");
}

export function requireInstant(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("INVALID_INSTANT");
  return parsed;
}

export function requireHash(value: string, error = "INVALID_HASH"): void {
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error(error);
}
