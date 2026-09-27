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
