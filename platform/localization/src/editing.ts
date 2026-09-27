import { languageLicense } from "./license";
import { assertPublishablePack } from "./manifest";
import { assertEditableTemplate } from "./templates";
import type { LabelWriteAccess, LanguagePack, LocaleRegistry, TenantLanguageContext, TenantOverlay } from "./types";

function assertWriteAccess(registry: LocaleRegistry, context: TenantLanguageContext, pack: LanguagePack, access: LabelWriteAccess): void {
  if (access.tenantId !== context.tenantId || !access.canManageLabels) throw new Error("LABEL_PERMISSION_DENIED");
  if (!access.canWrite) throw new Error("TENANT_READ_ONLY");
  if (!context.enabledLocales.includes(pack.locale) || !["included", "granted"].includes(languageLicense(registry, context, pack.locale))) throw new Error("LOCALE_NOT_ENTITLED");
  if (pack.status !== "published") throw new Error("UNPUBLISHED_PACK");
  assertPublishablePack(pack, registry);
}

/** "Clone" creates a sparse overlay, not a full copy of every system message. */
export function createTenantOverlay(registry: LocaleRegistry, context: TenantLanguageContext, pack: LanguagePack, access: LabelWriteAccess): TenantOverlay {
  assertWriteAccess(registry, context, pack, access);
  return { tenantId: context.tenantId, locale: pack.locale, baseVersion: pack.version, revision: 0, values: {} };
}

/** A new version is returned; persistence must perform its own transaction/RLS and expected-revision check. */
export function changeTenantLabel(
  registry: LocaleRegistry,
  context: TenantLanguageContext,
  pack: LanguagePack,
  overlay: TenantOverlay,
  access: LabelWriteAccess,
  key: string,
  text: string,
  expectedRevision: number,
): TenantOverlay {
  assertWriteAccess(registry, context, pack, access);
  if (overlay.tenantId !== context.tenantId) throw new Error("TENANT_MISMATCH");
  if (overlay.locale !== pack.locale || overlay.baseVersion !== pack.version) throw new Error("OVERLAY_VERSION_MISMATCH");
  if (overlay.revision !== expectedRevision) throw new Error("OVERLAY_REVISION_CONFLICT");
  const definition = Object.hasOwn(pack.definitions, key) ? pack.definitions[key] : undefined;
  if (!definition || !Object.hasOwn(pack.messages, key)) throw new Error("UNKNOWN_LABEL_KEY");
  assertEditableTemplate(definition, text);
  const values = { ...overlay.values };
  if (text === pack.messages[key]) delete values[key];
  else values[key] = { text, baseTextAtEdit: pack.messages[key] };
  return { ...overlay, revision: overlay.revision + 1, values };
}
