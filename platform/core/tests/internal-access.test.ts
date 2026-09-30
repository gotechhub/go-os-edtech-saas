import { describe, expect, it } from "vitest";
import { authorizeInternalAccess, permissionsForInternalRole } from "../src";
import type { InternalAuthorizationInput, InternalRoleGrant } from "../src";

const NOW = "2026-09-30T12:00:00.000Z";
const grant = (role: InternalRoleGrant["role"], endsAt: string | null = null): InternalRoleGrant => ({
  role,
  startsAt: "2026-09-01T00:00:00.000Z",
  endsAt,
});
const request = (changes: Partial<InternalAuthorizationInput> = {}): InternalAuthorizationInput => ({
  controlPlane: "os_core",
  assuranceLevel: "aal2",
  operatorActive: true,
  grants: [grant("security_operator")],
  permission: "core.security.manage",
  now: NOW,
  ...changes,
});

describe("internal control plane authorization", () => {
  it("requires MFA and an active time-bounded role", () => {
    expect(authorizeInternalAccess(request({ assuranceLevel: "aal1" }))).toMatchObject({ allowed: false, reason: "mfa_required" });
    expect(authorizeInternalAccess(request({ operatorActive: false }))).toMatchObject({ allowed: false, reason: "operator_inactive" });
    expect(authorizeInternalAccess(request({ grants: [grant("security_operator", NOW)] }))).toMatchObject({ allowed: false, reason: "role_inactive" });
  });

  it("never turns a Super Admin grant into OS Core access", () => {
    expect(authorizeInternalAccess(request({ grants: [grant("customer_ops")] }))).toMatchObject({ allowed: false, reason: "wrong_control_plane" });
    expect(authorizeInternalAccess(request({ controlPlane: "super_admin", permission: "hq.portal.manage", grants: [grant("security_operator")] }))).toMatchObject({ allowed: false, reason: "wrong_control_plane" });
  });

  it("prevents permission names from crossing control planes", () => {
    expect(authorizeInternalAccess(request({ permission: "hq.portal.manage" }))).toMatchObject({ allowed: false, reason: "wrong_control_plane" });
    expect(authorizeInternalAccess(request({ controlPlane: "super_admin", permission: "core.read", grants: [grant("customer_ops")] }))).toMatchObject({ allowed: false, reason: "wrong_control_plane" });
  });

  it("grants only the explicit permission of the active role", () => {
    expect(authorizeInternalAccess(request())).toMatchObject({ allowed: true, reason: "allowed", activeRoles: ["security_operator"] });
    expect(authorizeInternalAccess(request({ permission: "core.release.manage" }))).toMatchObject({ allowed: false, reason: "permission_missing" });
    expect(permissionsForInternalRole("billing")).toEqual(expect.arrayContaining(["hq.trial.manage", "hq.billing.manage"]));
  });
});
