import { activeRoles, hasPermission } from "./roles";
import type { AuthorizationDecision, AuthorizationInput, AuthorizationReason, WorkspaceRole } from "./types";

const instant = (value: string) => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("INVALID_INSTANT");
  return parsed;
};

const deny = (reason: AuthorizationReason, roles: readonly WorkspaceRole[] = [], readOnly = false): AuthorizationDecision => ({
  allowed: false,
  reason,
  activeRoles: roles,
  readOnly,
});

export function authorizeProductAccess(input: AuthorizationInput): AuthorizationDecision {
  if (input.tenant.status !== "active") return deny("tenant_inactive");
  if (!input.membership) return deny("membership_missing");
  if (input.membership.tenantId !== input.tenant.id) return deny("tenant_mismatch");
  if (input.membership.status !== "active") return deny("membership_inactive");

  const roles = activeRoles(input.membership.roles, input.now);
  if (!roles.length) return deny("role_inactive");
  if (!hasPermission(roles, input.permission)) return deny("permission_missing", roles);
  if (!input.entitlement) return deny("entitlement_missing", roles);
  if (input.entitlement.tenantId !== input.tenant.id) return deny("tenant_mismatch", roles);
  if (input.entitlement.product !== input.product) return deny("product_mismatch", roles);
  if (input.entitlement.kind === "disabled") return deny("entitlement_disabled", roles);
  if (input.entitlement.kind === "internal" && input.tenant.mode !== "internal_demo") return deny("internal_entitlement_wrong_mode", roles);

  const at = instant(input.now);
  if (instant(input.entitlement.startsAt) > at) return deny("entitlement_not_started", roles);
  const expired = input.entitlement.endsAt !== null && instant(input.entitlement.endsAt) <= at;
  if (expired && input.operation === "write") {
    return deny(input.entitlement.kind === "trial" ? "trial_expired_read_only" : "entitlement_expired_read_only", roles, true);
  }

  return { allowed: true, reason: "allowed", activeRoles: roles, readOnly: expired };
}
