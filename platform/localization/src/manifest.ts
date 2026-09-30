import { languageLicense } from "./license";
import { localeDefinition } from "./registry";
import { assertEditableTemplate, validateTemplate } from "./templates";
import type { LanguagePack, LocaleRegistry, TenantLanguageContext, TenantOverlay } from "./types";

export interface ResolvedManifest {
  locale: string;
  direction: "ltr" | "rtl";
  basePackageVersion: string;
  tenantOverlayRevision: number | null;
  messages: Readonly<Record<string, string>>;
}

export function assertPublishablePack(pack: LanguagePack, registry: LocaleRegistry): void {
  const locale = localeDefinition(registry, pack.locale);
  if (!locale || pack.packageId !== locale.packageId || pack.direction !== locale.direction) throw new Error("INVALID_PACK_IDENTITY");
  for (const [key, definition] of Object.entries(pack.definitions)) {
    if (definition.key !== key) throw new Error("INVALID_DEFINITION_KEY");
    const text = Object.hasOwn(pack.messages, key) ? pack.messages[key] : undefined;
    if (definition.critical && text === undefined) throw new Error("MISSING_CRITICAL_MESSAGE");
    if (text !== undefined && validateTemplate(definition, text).length) throw new Error("INVALID_BASE_MESSAGE");
  }
  if (Object.keys(pack.messages).some((key) => !Object.hasOwn(pack.definitions, key))) throw new Error("UNDECLARED_MESSAGE");
}

export function composeManifest(
  registry: LocaleRegistry,
  context: TenantLanguageContext,
  pack: LanguagePack,
  overlay: TenantOverlay | null,
): ResolvedManifest {
  if (pack.status !== "published") throw new Error("UNPUBLISHED_PACK");
  if (!context.enabledLocales.includes(pack.locale) || !["included", "granted"].includes(languageLicense(registry, context, pack.locale))) throw new Error("LOCALE_NOT_ENTITLED");
  assertPublishablePack(pack, registry);
  const messages = { ...pack.messages };
  if (overlay) {
    if (overlay.tenantId !== context.tenantId) throw new Error("TENANT_MISMATCH");
    if (overlay.locale !== pack.locale || overlay.baseVersion !== pack.version) throw new Error("OVERLAY_VERSION_MISMATCH");
    for (const [key, value] of Object.entries(overlay.values)) {
      const definition = Object.hasOwn(pack.definitions, key) ? pack.definitions[key] : undefined;
      if (!definition) throw new Error("UNKNOWN_OVERRIDE_KEY");
      if (value.baseTextAtEdit !== pack.messages[key]) throw new Error("STALE_OVERRIDE_SOURCE");
      assertEditableTemplate(definition, value.text);
      messages[key] = value.text;
    }
  }
  return { locale: pack.locale, direction: pack.direction, basePackageVersion: pack.version, tenantOverlayRevision: overlay?.revision ?? null, messages };
}
