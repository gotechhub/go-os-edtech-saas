import { describe, expect, it } from "vitest";
import { activateTrial, authorizeProductAccess, internalDemoEntitlements, permissionsForRole, TRIAL_DURATION_DAYS } from "../src";
import type { AuthorizationInput, Membership, ProductEntitlement, ProductRelease, Tenant } from "../src";

const NOW = "2026-09-27T12:00:00.000Z";
const CUSTOMER: Tenant = { id: "tenant-a", mode: "customer", status: "active" };
const DEMO: Tenant = { id: "demo-a", mode: "internal_demo", status: "active" };
const RELEASES: ProductRelease[] = [
  { key: "golms", status: "released" },
  { key: "golxp", status: "released" },
  { key: "gopm", status: "planned" },
];
const membership = (changes: Partial<Membership> = {}): Membership => ({
  tenantId: CUSTOMER.id,
  userId: "user-a",
  status: "active",
  roles: [{ role: "learner", startsAt: "2026-01-01T00:00:00.000Z", endsAt: null }],
  ...changes,
});
const entitlement = (changes: Partial<ProductEntitlement> = {}): ProductEntitlement => ({
  tenantId: CUSTOMER.id,
  product: "golms",
  kind: "trial",
  startsAt: NOW,
  endsAt: "2026-10-11T12:00:00.000Z",
  ...changes,
});
const request = (changes: Partial<AuthorizationInput> = {}): AuthorizationInput => ({
  tenant: CUSTOMER,
  membership: membership(),
  entitlement: entitlement(),
  product: "golms",
  permission: "golms.learn",
  operation: "read",
  now: NOW,
  ...changes,
});

describe("tenant trial", () => {
  it("starts one 14-day tenant clock and grants only released products", () => {
    const activated = activateTrial(CUSTOMER, RELEASES, "operator-a", NOW);
    expect(activated.created).toBe(true);
    expect(Date.parse(activated.trial.endsAt) - Date.parse(activated.trial.startedAt)).toBe(TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
    expect(activated.entitlements.map((item) => item.product)).toEqual(["golms", "golxp"]);
    expect(activated.entitlements.every((item) => item.kind === "trial" && item.endsAt === activated.trial.endsAt)).toBe(true);
  });

  it("is idempotent and never restarts an existing customer trial", () => {
    const first = activateTrial(CUSTOMER, RELEASES, "operator-a", NOW);
    const second = activateTrial(CUSTOMER, RELEASES, "operator-b", "2026-10-01T12:00:00.000Z", first.trial, first.entitlements);
    expect(second).toEqual({ ...first, created: false });
  });

  it("keeps internal demos outside the customer trial and creates internal rights separately", () => {
    expect(() => activateTrial(DEMO, RELEASES, "operator-a", NOW)).toThrow("CUSTOMER_TENANT_REQUIRED");
    expect(internalDemoEntitlements(DEMO, RELEASES, NOW).map((item) => [item.product, item.kind])).toEqual([["golms", "internal"], ["golxp", "internal"]]);
  });
});

describe("role and entitlement authorization", () => {
  it("allows an active learner with a matching product right", () => {
    expect(authorizeProductAccess(request())).toMatchObject({ allowed: true, reason: "allowed", activeRoles: ["learner"], readOnly: false });
  });

  it("blocks cross-tenant membership and entitlement records", () => {
    expect(authorizeProductAccess(request({ membership: membership({ tenantId: "tenant-b" }) }))).toMatchObject({ allowed: false, reason: "tenant_mismatch" });
    expect(authorizeProductAccess(request({ entitlement: entitlement({ tenantId: "tenant-b" }) }))).toMatchObject({ allowed: false, reason: "tenant_mismatch" });
  });

  it("keeps expired trials readable and rejects every write", () => {
    const expired = entitlement({ endsAt: NOW });
    expect(authorizeProductAccess(request({ entitlement: expired, operation: "read" }))).toMatchObject({ allowed: true, readOnly: true });
    expect(authorizeProductAccess(request({ entitlement: expired, operation: "write" }))).toMatchObject({ allowed: false, reason: "trial_expired_read_only", readOnly: true });
  });

  it("requires an active real role and ignores UI role preview concepts", () => {
    const expiredRole = membership({ roles: [{ role: "tenant_admin", startsAt: "2026-01-01T00:00:00.000Z", endsAt: NOW }] });
    expect(authorizeProductAccess(request({ membership: expiredRole, operation: "write", permission: "golms.manage" }))).toMatchObject({ allowed: false, reason: "role_inactive" });
    expect(permissionsForRole("learner")).not.toContain("golms.manage");
    expect(authorizeProductAccess(request({ operation: "write", permission: "golms.manage" }))).toMatchObject({ allowed: false, reason: "permission_missing" });
  });

  it("does not allow an internal entitlement on a customer tenant", () => {
    expect(authorizeProductAccess(request({ entitlement: entitlement({ kind: "internal", endsAt: null }), operation: "write" }))).toMatchObject({ allowed: false, reason: "internal_entitlement_wrong_mode" });
  });
});
