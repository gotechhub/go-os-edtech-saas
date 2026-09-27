import type { ProductEntitlement, ProductRelease, Tenant, TenantTrial, TrialActivationResult } from "./types";

export const TRIAL_DURATION_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const instant = (value: string) => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("INVALID_INSTANT");
  return parsed;
};

export function activateTrial(
  tenant: Tenant,
  releases: readonly ProductRelease[],
  activatedBy: string,
  now: string,
  existingTrial: TenantTrial | null = null,
  existingEntitlements: readonly ProductEntitlement[] = [],
): TrialActivationResult {
  if (tenant.mode !== "customer") throw new Error("CUSTOMER_TENANT_REQUIRED");
  if (tenant.status !== "active") throw new Error("ACTIVE_TENANT_REQUIRED");

  if (existingTrial) {
    if (existingTrial.tenantId !== tenant.id) throw new Error("TRIAL_TENANT_MISMATCH");
    return { trial: existingTrial, entitlements: existingEntitlements, created: false };
  }

  const startedAt = new Date(instant(now)).toISOString();
  const endsAt = new Date(instant(startedAt) + TRIAL_DURATION_DAYS * DAY_MS).toISOString();
  const trial: TenantTrial = { tenantId: tenant.id, startedAt, endsAt, activatedBy };
  const entitlementByProduct = new Map(existingEntitlements.map((entitlement) => [entitlement.product, entitlement]));

  for (const release of releases) {
    if (release.status !== "released" || entitlementByProduct.has(release.key)) continue;
    entitlementByProduct.set(release.key, {
      tenantId: tenant.id,
      product: release.key,
      kind: "trial",
      startsAt: startedAt,
      endsAt,
    });
  }

  return { trial, entitlements: [...entitlementByProduct.values()], created: true };
}

export function internalDemoEntitlements(tenant: Tenant, releases: readonly ProductRelease[], now: string): ProductEntitlement[] {
  if (tenant.mode !== "internal_demo") throw new Error("INTERNAL_DEMO_REQUIRED");
  if (tenant.status !== "active") throw new Error("ACTIVE_TENANT_REQUIRED");
  const startsAt = new Date(instant(now)).toISOString();
  return releases.filter((release) => release.status === "released").map((release) => ({
    tenantId: tenant.id,
    product: release.key,
    kind: "internal",
    startsAt,
    endsAt: null,
  }));
}
