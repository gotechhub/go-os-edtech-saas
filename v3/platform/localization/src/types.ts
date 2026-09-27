export interface LocaleDefinition {
  code: string;
  nameTr: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  license: "included" | "addon";
  packageId: string;
}

export interface LocaleRegistry {
  defaultLocale: string;
  locales: readonly LocaleDefinition[];
}

export interface MessageDefinition {
  key: string;
  params: readonly string[];
  customerEditable: boolean;
  critical: boolean;
}

export interface LanguagePack {
  packageId: string;
  locale: string;
  version: string;
  direction: "ltr" | "rtl";
  status: "draft" | "published";
  definitions: Readonly<Record<string, MessageDefinition>>;
  messages: Readonly<Record<string, string>>;
}

export interface TenantLanguageGrant {
  tenantId: string;
  locale: string;
  kind: "paid" | "trial" | "internal";
  startsAt: string;
  endsAt: string | null;
}

export interface TenantLanguageContext {
  tenantId: string;
  tenantMode: "customer" | "internal_demo";
  defaultLocale: string;
  enabledLocales: readonly string[];
  grants: readonly TenantLanguageGrant[];
  now: string;
}

export interface OverrideValue {
  text: string;
  baseTextAtEdit: string;
}

export interface TenantOverlay {
  tenantId: string;
  locale: string;
  baseVersion: string;
  revision: number;
  values: Readonly<Record<string, OverrideValue>>;
}

export interface LabelWriteAccess {
  tenantId: string;
  canManageLabels: boolean;
  canWrite: boolean;
}

export interface RebaseConflict {
  key: string;
  targetKey: string | null;
  kind: "base_changed" | "removed" | "protected" | "incompatible" | "stale_source" | "alias_collision";
  blocking: boolean;
}

export interface RebaseResult {
  overlay: TenantOverlay;
  addedBaseKeys: string[];
  conflicts: RebaseConflict[];
  canActivate: boolean;
}
