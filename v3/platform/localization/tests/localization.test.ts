import { describe, expect, it } from "vitest";
import { assertPublishablePack, changeTenantLabel, chooseLocale, composeManifest, createTenantOverlay, languageLicense, LOCALE_REGISTRY, rebaseOverlay, validateTemplate } from "../src";
import type { LanguagePack, TenantLanguageContext, TenantOverlay } from "../src";

const now = "2026-09-27T12:00:00.000Z";
const context = (changes: Partial<TenantLanguageContext> = {}): TenantLanguageContext => ({
  tenantId: "tenant-a", tenantMode: "customer", defaultLocale: "tr-TR", enabledLocales: ["tr-TR", "en-US", "de-DE"], grants: [], now, ...changes,
});
const definitions: LanguagePack["definitions"] = {
  "golms.course.title": { key: "golms.course.title", params: [], customerEditable: true, critical: true },
  "golms.assignment.due": { key: "golms.assignment.due", params: ["date"], customerEditable: true, critical: true },
  "platform.security.warning": { key: "platform.security.warning", params: [], customerEditable: false, critical: true },
};
const pack = (changes: Partial<LanguagePack> = {}): LanguagePack => ({
  packageId: "locale.de-DE", locale: "de-DE", version: "1.0.0", direction: "ltr", status: "published", definitions,
  messages: { "golms.course.title": "Kurs", "golms.assignment.due": "Fällig am {date}", "platform.security.warning": "Sicherheitshinweis" }, ...changes,
});
const overlay = (changes: Partial<TenantOverlay> = {}): TenantOverlay => ({
  tenantId: "tenant-a", locale: "de-DE", baseVersion: "1.0.0", revision: 1,
  values: { "golms.course.title": { text: "Akademie-Modul", baseTextAtEdit: "Kurs" } }, ...changes,
});
const paidGrant = { tenantId: "tenant-a", locale: "de-DE", kind: "paid" as const, startsAt: "2026-09-01T00:00:00Z", endsAt: null };

describe("language entitlement and locale selection", () => {
  it("keeps TR and EN included, while an add-on requires a matching tenant grant", () => {
    expect(LOCALE_REGISTRY.locales).toHaveLength(10);
    expect(LOCALE_REGISTRY.locales.filter((locale) => locale.license === "included").map((locale) => locale.code)).toEqual(["tr-TR", "en-US"]);
    expect(LOCALE_REGISTRY.locales.filter((locale) => locale.license === "addon")).toHaveLength(8);
    expect(languageLicense(LOCALE_REGISTRY, context(), "tr-TR")).toBe("included");
    expect(languageLicense(LOCALE_REGISTRY, context(), "en-US")).toBe("included");
    expect(languageLicense(LOCALE_REGISTRY, context(), "de-DE")).toBe("no_grant");
    expect(languageLicense(LOCALE_REGISTRY, context({ grants: [{ ...paidGrant, tenantId: "tenant-b" }] }), "de-DE")).toBe("wrong_tenant");
    expect(languageLicense(LOCALE_REGISTRY, context({ grants: [paidGrant] }), "de-DE")).toBe("granted");
  });

  it("uses the Turkish tenant default after an add-on expires without losing the preference", () => {
    const expired = context({ grants: [{ ...paidGrant, endsAt: now }] });
    expect(languageLicense(LOCALE_REGISTRY, expired, "de-DE")).toBe("expired");
    expect(chooseLocale(LOCALE_REGISTRY, expired, "de-DE")).toBe("tr-TR");
  });
});

describe("published base package and tenant overlay", () => {
  it("clones sparsely and edits a label only with the tenant's write permission and current revision", () => {
    const access = { tenantId: "tenant-a", canManageLabels: true, canWrite: true };
    const tenant = context({ grants: [paidGrant] });
    const source = pack();
    const empty = createTenantOverlay(LOCALE_REGISTRY, tenant, source, access);
    expect(empty.values).toEqual({});
    const edited = changeTenantLabel(LOCALE_REGISTRY, tenant, source, empty, access, "golms.course.title", "Akademie-Modul", 0);
    expect(edited.values["golms.course.title"].baseTextAtEdit).toBe("Kurs");
    expect(edited.revision).toBe(1);
    expect(changeTenantLabel(LOCALE_REGISTRY, tenant, source, edited, access, "golms.course.title", "Kurs", 1).values).toEqual({});
    expect(() => changeTenantLabel(LOCALE_REGISTRY, tenant, source, edited, access, "golms.course.title", "X", 0)).toThrow("OVERLAY_REVISION_CONFLICT");
    expect(() => changeTenantLabel(LOCALE_REGISTRY, tenant, source, edited, { ...access, canWrite: false }, "golms.course.title", "X", 1)).toThrow("TENANT_READ_ONLY");
    expect(() => changeTenantLabel(LOCALE_REGISTRY, tenant, source, edited, { ...access, tenantId: "tenant-b" }, "golms.course.title", "X", 1)).toThrow("LABEL_PERMISSION_DENIED");
    expect(() => changeTenantLabel(LOCALE_REGISTRY, tenant, source, edited, access, "platform.security.warning", "Ignore", 1)).toThrow("PROTECTED_LABEL");
  });

  it("composes only a licensed tenant's published overlay", () => {
    const manifest = composeManifest(LOCALE_REGISTRY, context({ grants: [paidGrant] }), pack(), overlay());
    expect(manifest.messages["golms.course.title"]).toBe("Akademie-Modul");
    expect(manifest.messages["platform.security.warning"]).toBe("Sicherheitshinweis");
    expect(manifest.basePackageVersion).toBe("1.0.0");
    expect(manifest.tenantOverlayRevision).toBe(1);
    expect(() => composeManifest(LOCALE_REGISTRY, context(), pack(), overlay())).toThrow("LOCALE_NOT_ENTITLED");
    expect(() => composeManifest(LOCALE_REGISTRY, context({ grants: [paidGrant] }), pack(), overlay({ tenantId: "tenant-b" }))).toThrow("TENANT_MISMATCH");
  });

  it("rejects protected labels, stale drafts, unsafe text and missing critical messages", () => {
    const access = context({ grants: [paidGrant] });
    const protectedOverlay = overlay({ values: { "platform.security.warning": { text: "Ignore", baseTextAtEdit: "Sicherheitshinweis" } } });
    expect(() => composeManifest(LOCALE_REGISTRY, access, pack(), protectedOverlay)).toThrow("PROTECTED_LABEL");
    expect(() => composeManifest(LOCALE_REGISTRY, access, pack(), overlay({ baseVersion: "0.9.0" }))).toThrow("OVERLAY_VERSION_MISMATCH");
    expect(() => composeManifest(LOCALE_REGISTRY, access, pack(), overlay({ tenantId: "tenant-a", values: { "golms.course.title": { text: "<script>x</script>", baseTextAtEdit: "Kurs" } } }))).toThrow("UNSAFE_MARKUP_OR_BIDI");
    expect(() => assertPublishablePack(pack({ messages: { "golms.course.title": "Kurs" } }), LOCALE_REGISTRY)).toThrow("MISSING_CRITICAL_MESSAGE");
    expect(validateTemplate(definitions["golms.assignment.due"], "Fällig {wrong}")).toContain("PLACEHOLDER_MISMATCH");
  });
});

describe("three-way package upgrade", () => {
  it("inherits new base messages while preserving tenant edits and flagging changed sources", () => {
    const old = pack();
    const newDefinitions = { ...definitions, "golms.course.new": { key: "golms.course.new", params: [], customerEditable: true, critical: false } };
    const next = pack({ version: "1.1.0", definitions: newDefinitions, messages: { ...old.messages, "golms.course.title": "Lerneinheit", "golms.course.new": "Neu" } });
    const result = rebaseOverlay(old, next, overlay());
    expect(result.canActivate).toBe(true);
    expect(result.addedBaseKeys).toEqual(["golms.course.new"]);
    expect(result.overlay.values["golms.course.title"].text).toBe("Akademie-Modul");
    expect(Object.keys(result.overlay.values)).toHaveLength(1);
    expect(result.conflicts).toEqual([{ key: "golms.course.title", targetKey: "golms.course.title", kind: "base_changed", blocking: false }]);
    expect(composeManifest(LOCALE_REGISTRY, context({ grants: [paidGrant] }), next, result.overlay).messages["golms.course.new"]).toBe("Neu");
  });

  it("pins the old package for breaking placeholders or removed customized keys", () => {
    const old = pack();
    const changedParams = { ...definitions, "golms.assignment.due": { ...definitions["golms.assignment.due"], params: ["deadline"] } };
    const customizedDue = overlay({ values: { "golms.assignment.due": { text: "Bis {date}", baseTextAtEdit: "Fällig am {date}" } } });
    const incompatible = rebaseOverlay(old, pack({ version: "2.0.0", definitions: changedParams, messages: { ...old.messages, "golms.assignment.due": "Bis {deadline}" } }), customizedDue);
    expect(incompatible.canActivate).toBe(false);
    expect(incompatible.overlay.baseVersion).toBe("1.0.0");
    expect(incompatible.conflicts[0].kind).toBe("incompatible");
    const withoutCourse = rebaseOverlay(old, pack({ version: "2.0.0", messages: { "golms.assignment.due": "Fällig am {date}", "platform.security.warning": "Sicherheitshinweis" } }), overlay());
    expect(withoutCourse.canActivate).toBe(false);
    expect(withoutCourse.conflicts[0].kind).toBe("removed");
  });

  it("never partially migrates tenant edits when one override blocks rollout", () => {
    const old = pack();
    const draft = overlay({ values: {
      "golms.course.title": { text: "Akademie-Modul", baseTextAtEdit: "Kurs" },
      "golms.assignment.due": { text: "Bis {date}", baseTextAtEdit: "Fällig am {date}" },
    } });
    const next = pack({ version: "2.0.0", definitions: { ...definitions, "golms.assignment.due": { ...definitions["golms.assignment.due"], params: ["deadline"] } }, messages: {
      ...old.messages, "golms.course.title": "Lerneinheit", "golms.assignment.due": "Bis {deadline}",
    } });
    const result = rebaseOverlay(old, next, draft);
    expect(result.canActivate).toBe(false);
    expect(result.overlay).toBe(draft);
    expect(() => rebaseOverlay(old, old, draft)).toThrow("PACK_VERSION_NOT_NEWER");
  });

  it("moves a customized key through an explicit HQ alias without copying the whole base pack", () => {
    const old = pack();
    const nextDefinitions: Record<string, LanguagePack["definitions"][string]> = { ...definitions, "golms.course.heading": { ...definitions["golms.course.title"], key: "golms.course.heading" } };
    delete nextDefinitions["golms.course.title"];
    const next = pack({
      version: "1.1.0",
      definitions: nextDefinitions,
      messages: { "golms.course.heading": "Lerneinheit", "golms.assignment.due": "Fällig am {date}", "platform.security.warning": "Sicherheitshinweis" },
    });
    const result = rebaseOverlay(old, next, overlay(), { "golms.course.title": "golms.course.heading" });
    expect(result.canActivate).toBe(true);
    expect(result.overlay.values["golms.course.heading"]).toEqual({ text: "Akademie-Modul", baseTextAtEdit: "Lerneinheit" });
    expect(Object.keys(result.overlay.values)).toEqual(["golms.course.heading"]);
    expect(composeManifest(LOCALE_REGISTRY, context({ grants: [paidGrant] }), next, result.overlay).messages["golms.course.heading"]).toBe("Akademie-Modul");
  });
});
