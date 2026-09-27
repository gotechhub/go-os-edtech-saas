import { localeDefinition } from "./registry";
import type { LocaleRegistry, TenantLanguageContext, TenantLanguageGrant } from "./types";

export type LicenseDecision = "included" | "granted" | "unknown_locale" | "no_grant" | "expired" | "wrong_tenant";

function instant(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("INVALID_INSTANT");
  return parsed;
}

export function languageLicense(registry: LocaleRegistry, context: TenantLanguageContext, locale: string): LicenseDecision {
  const definition = localeDefinition(registry, locale);
  if (!definition) return "unknown_locale";
  if (definition.license === "included") return "included";
  const matches = context.grants.filter((grant) => grant.locale === locale);
  const ownGrants = matches.filter((grant) => grant.tenantId === context.tenantId);
  if (!ownGrants.length) return matches.length ? "wrong_tenant" : "no_grant";
  const now = instant(context.now);
  const applicable = ownGrants.filter((grant) => grant.kind !== "internal" || context.tenantMode === "internal_demo");
  if (!applicable.length) return "no_grant";
  return applicable.some((grant) => now >= instant(grant.startsAt) && (!grant.endsAt || now < instant(grant.endsAt))) ? "granted" : "expired";
}

export function chooseLocale(registry: LocaleRegistry, context: TenantLanguageContext, requested: string | null): string {
  const candidates = [requested, context.defaultLocale, registry.defaultLocale].filter((code): code is string => Boolean(code));
  for (const code of candidates) {
    if (context.enabledLocales.includes(code) && ["included", "granted"].includes(languageLicense(registry, context, code))) return code;
  }
  // The platform's included Turkish rescue locale is always available for readable errors.
  return registry.defaultLocale;
}

export function grantBelongsToTenant(grant: TenantLanguageGrant, tenantId: string): boolean {
  return grant.tenantId === tenantId;
}
