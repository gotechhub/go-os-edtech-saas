import type {
  InternalAuthorizationDecision,
  InternalAuthorizationInput,
  InternalPermission,
  InternalRole,
  OsCoreRole,
  SuperAdminRole,
} from "./types";

const CORE_PERMISSIONS: Readonly<Record<OsCoreRole, readonly InternalPermission[]>> = {
  platform_operator: ["core.read", "core.system.manage", "core.jobs.manage", "core.integrations.manage"],
  security_operator: ["core.read", "core.security.manage", "core.audit.read", "core.sessions.revoke"],
  release_manager: ["core.read", "core.release.manage", "core.migrations.manage", "core.flags.manage"],
  infrastructure_operator: ["core.read", "core.infrastructure.manage", "core.providers.manage", "core.storage.manage"],
  data_governance: ["core.read", "core.data.manage", "core.audit.read", "core.recovery.manage"],
};

const HQ_PERMISSIONS: Readonly<Record<SuperAdminRole, readonly InternalPermission[]>> = {
  customer_ops: ["hq.read", "hq.customer.manage", "hq.portal.manage", "hq.trial.manage", "hq.support.manage"],
  support: ["hq.read", "hq.support.manage", "hq.support_session.manage"],
  billing: ["hq.read", "hq.trial.manage", "hq.entitlement.manage", "hq.billing.manage"],
  commercial: ["hq.read", "hq.customer.manage", "hq.entitlement.manage"],
};

const CORE_ROLES = new Set<InternalRole>(Object.keys(CORE_PERMISSIONS) as OsCoreRole[]);
const HQ_ROLES = new Set<InternalRole>(Object.keys(HQ_PERMISSIONS) as SuperAdminRole[]);

const instant = (value: string) => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("INVALID_INSTANT");
  return parsed;
};

const decision = (allowed: boolean, reason: InternalAuthorizationDecision["reason"], activeRoles: readonly InternalRole[] = []): InternalAuthorizationDecision => ({ allowed, reason, activeRoles });

export function authorizeInternalAccess(input: InternalAuthorizationInput): InternalAuthorizationDecision {
  if (input.assuranceLevel !== "aal2") return decision(false, "mfa_required");
  if (!input.operatorActive) return decision(false, "operator_inactive");

  const at = instant(input.now);
  const activeRoles = [...new Set(input.grants
    .filter((grant) => instant(grant.startsAt) <= at && (grant.endsAt === null || instant(grant.endsAt) > at))
    .map((grant) => grant.role))];
  if (!activeRoles.length) return decision(false, "role_inactive");

  const expectedRoles = input.controlPlane === "os_core" ? CORE_ROLES : HQ_ROLES;
  const scopedRoles = activeRoles.filter((role) => expectedRoles.has(role));
  if (!scopedRoles.length) return decision(false, "wrong_control_plane", activeRoles);

  const permissionPrefix = input.controlPlane === "os_core" ? "core." : "hq.";
  if (!input.permission.startsWith(permissionPrefix)) return decision(false, "wrong_control_plane", scopedRoles);

  const allowed = scopedRoles.some((role) => {
    const permissions = CORE_ROLES.has(role)
      ? CORE_PERMISSIONS[role as OsCoreRole]
      : HQ_PERMISSIONS[role as SuperAdminRole];
    return permissions.includes(input.permission);
  });
  return allowed ? decision(true, "allowed", scopedRoles) : decision(false, "permission_missing", scopedRoles);
}

export function permissionsForInternalRole(role: InternalRole): readonly InternalPermission[] {
  return CORE_ROLES.has(role) ? CORE_PERMISSIONS[role as OsCoreRole] : HQ_PERMISSIONS[role as SuperAdminRole];
}
