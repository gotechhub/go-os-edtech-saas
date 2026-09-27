import type { PermissionKey, RoleGrant, WorkspaceRole } from "./types";

const ROLE_PERMISSIONS: Readonly<Record<WorkspaceRole, readonly PermissionKey[]>> = {
  tenant_owner: ["tenant.read", "tenant.manage", "membership.manage", "entitlement.read", "localization.manage", "golms.learn", "golms.manage", "golms.compliance.manage", "golms.report"],
  tenant_admin: ["tenant.read", "membership.manage", "entitlement.read", "localization.manage", "golms.learn", "golms.manage", "golms.report"],
  learning_admin: ["tenant.read", "golms.learn", "golms.manage", "golms.report"],
  compliance_admin: ["tenant.read", "golms.learn", "golms.compliance.manage", "golms.report"],
  report_analyst: ["tenant.read", "golms.report"],
  instructor: ["tenant.read", "golms.learn", "golms.instruct"],
  line_manager: ["tenant.read", "golms.learn", "golms.team.manage", "golms.report"],
  learner: ["tenant.read", "golms.learn"],
};

const instant = (value: string) => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("INVALID_INSTANT");
  return parsed;
};

export function activeRoles(grants: readonly RoleGrant[], now: string): WorkspaceRole[] {
  const at = instant(now);
  return [...new Set(grants.filter((grant) => instant(grant.startsAt) <= at && (grant.endsAt === null || instant(grant.endsAt) > at)).map((grant) => grant.role))];
}

export function hasPermission(roles: readonly WorkspaceRole[], permission: PermissionKey): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
}

export function permissionsForRole(role: WorkspaceRole): readonly PermissionKey[] {
  return ROLE_PERMISSIONS[role];
}
