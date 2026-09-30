export type TenantMode = "customer" | "internal_demo";
export type TenantStatus = "provisioning" | "active" | "suspended" | "closed";
export type MembershipStatus = "invited" | "active" | "suspended" | "revoked";

export type ProductKey = "golms" | "golxp" | "gocatalog" | "goauthor_ai" | "gopm";
export type ProductReleaseStatus = "planned" | "released" | "retired";
export type EntitlementKind = "internal" | "trial" | "paid" | "disabled";

export type WorkspaceRole =
  | "tenant_owner"
  | "tenant_admin"
  | "learning_admin"
  | "compliance_admin"
  | "report_analyst"
  | "instructor"
  | "line_manager"
  | "learner";

export type PermissionKey =
  | "tenant.read"
  | "tenant.manage"
  | "membership.manage"
  | "entitlement.read"
  | "localization.manage"
  | "golms.learn"
  | "golms.instruct"
  | "golms.team.manage"
  | "golms.manage"
  | "golms.compliance.manage"
  | "golms.report";

export interface Tenant {
  id: string;
  mode: TenantMode;
  status: TenantStatus;
}

export interface RoleGrant {
  role: WorkspaceRole;
  startsAt: string;
  endsAt: string | null;
}

export interface Membership {
  tenantId: string;
  userId: string;
  status: MembershipStatus;
  roles: readonly RoleGrant[];
}

export interface ProductRelease {
  key: ProductKey;
  status: ProductReleaseStatus;
}

export interface ProductEntitlement {
  tenantId: string;
  product: ProductKey;
  kind: EntitlementKind;
  startsAt: string;
  endsAt: string | null;
}

export interface TenantTrial {
  tenantId: string;
  startedAt: string;
  endsAt: string;
  activatedBy: string;
}

export interface TrialActivationResult {
  trial: TenantTrial;
  entitlements: readonly ProductEntitlement[];
  created: boolean;
}

export interface AuthorizationInput {
  tenant: Tenant;
  membership: Membership | null;
  entitlement: ProductEntitlement | null;
  product: ProductKey;
  permission: PermissionKey;
  operation: "read" | "write";
  now: string;
}

export type AuthorizationReason =
  | "allowed"
  | "tenant_inactive"
  | "membership_missing"
  | "membership_inactive"
  | "role_inactive"
  | "permission_missing"
  | "entitlement_missing"
  | "entitlement_not_started"
  | "entitlement_disabled"
  | "internal_entitlement_wrong_mode"
  | "trial_expired_read_only"
  | "entitlement_expired_read_only"
  | "product_mismatch"
  | "tenant_mismatch";

export interface AuthorizationDecision {
  allowed: boolean;
  reason: AuthorizationReason;
  activeRoles: readonly WorkspaceRole[];
  readOnly: boolean;
}

export type AssuranceLevel = "aal1" | "aal2";
export type InternalControlPlane = "os_core" | "super_admin";
export type OsCoreRole = "platform_operator" | "security_operator" | "release_manager" | "infrastructure_operator" | "data_governance";
export type SuperAdminRole = "customer_ops" | "support" | "billing" | "commercial";
export type InternalRole = OsCoreRole | SuperAdminRole;

export type OsCorePermission =
  | "core.read"
  | "core.system.manage"
  | "core.jobs.manage"
  | "core.integrations.manage"
  | "core.security.manage"
  | "core.audit.read"
  | "core.sessions.revoke"
  | "core.release.manage"
  | "core.migrations.manage"
  | "core.flags.manage"
  | "core.infrastructure.manage"
  | "core.providers.manage"
  | "core.storage.manage"
  | "core.data.manage"
  | "core.recovery.manage";

export type SuperAdminPermission =
  | "hq.read"
  | "hq.customer.manage"
  | "hq.portal.manage"
  | "hq.trial.manage"
  | "hq.support.manage"
  | "hq.support_session.manage"
  | "hq.entitlement.manage"
  | "hq.billing.manage";

export type InternalPermission = OsCorePermission | SuperAdminPermission;

export interface InternalRoleGrant {
  role: InternalRole;
  startsAt: string;
  endsAt: string | null;
}

export interface InternalAuthorizationInput {
  controlPlane: InternalControlPlane;
  assuranceLevel: AssuranceLevel;
  operatorActive: boolean;
  grants: readonly InternalRoleGrant[];
  permission: InternalPermission;
  now: string;
}

export type InternalAuthorizationReason = "allowed" | "mfa_required" | "operator_inactive" | "role_inactive" | "wrong_control_plane" | "permission_missing";

export interface InternalAuthorizationDecision {
  allowed: boolean;
  reason: InternalAuthorizationReason;
  activeRoles: readonly InternalRole[];
}
