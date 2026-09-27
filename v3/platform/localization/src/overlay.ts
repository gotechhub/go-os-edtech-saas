import { assertEditableTemplate } from "./templates";
import type { LanguagePack, RebaseConflict, RebaseResult, TenantOverlay } from "./types";

function versionParts(version: string): number[] {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("INVALID_PACK_VERSION");
  return version.split(".").map(Number);
}

function isNewer(next: string, previous: string): boolean {
  const a = versionParts(next);
  const b = versionParts(previous);
  for (let index = 0; index < 3; index++) if (a[index] !== b[index]) return a[index] > b[index];
  return false;
}

export function rebaseOverlay(
  previous: LanguagePack,
  next: LanguagePack,
  overlay: TenantOverlay,
  aliases: Readonly<Record<string, string>> = {},
): RebaseResult {
  if (previous.packageId !== next.packageId || previous.locale !== next.locale || overlay.locale !== next.locale) throw new Error("PACKAGE_MISMATCH");
  if (overlay.baseVersion !== previous.version) throw new Error("STALE_OVERLAY_VERSION");
  if (next.status !== "published") throw new Error("UNPUBLISHED_PACK");
  if (!isNewer(next.version, previous.version)) throw new Error("PACK_VERSION_NOT_NEWER");
  const aliasTargets = new Set(Object.values(aliases));
  const addedBaseKeys = Object.keys(next.messages).filter((key) => !Object.hasOwn(previous.messages, key) && !aliasTargets.has(key));
  const conflicts: RebaseConflict[] = [];
  const values: Record<string, { text: string; baseTextAtEdit: string }> = {};

  for (const [key, custom] of Object.entries(overlay.values)) {
    const targetKey = Object.hasOwn(next.messages, key) ? key : Object.hasOwn(aliases, key) ? aliases[key] : null;
    if (!targetKey || !Object.hasOwn(next.messages, targetKey)) {
      conflicts.push({ key, targetKey: null, kind: "removed", blocking: true });
      values[key] = custom;
      continue;
    }
    const definition = Object.hasOwn(next.definitions, targetKey) ? next.definitions[targetKey] : undefined;
    if (!definition?.customerEditable) {
      conflicts.push({ key, targetKey, kind: "protected", blocking: true });
      values[key] = custom;
      continue;
    }
    try { assertEditableTemplate(definition, custom.text); }
    catch {
      conflicts.push({ key, targetKey, kind: "incompatible", blocking: true });
      values[key] = custom;
      continue;
    }
    const oldBase = Object.hasOwn(previous.messages, key) ? previous.messages[key] : undefined;
    if (oldBase !== custom.baseTextAtEdit) {
      conflicts.push({ key, targetKey, kind: "stale_source", blocking: true });
      values[key] = custom;
      continue;
    }
    const newBase = next.messages[targetKey];
    if (oldBase !== newBase) conflicts.push({ key, targetKey, kind: "base_changed", blocking: false });
    if (Object.hasOwn(values, targetKey)) {
      conflicts.push({ key, targetKey, kind: "alias_collision", blocking: true });
      continue;
    }
    values[targetKey] = { text: custom.text, baseTextAtEdit: newBase };
  }

  const canActivate = !conflicts.some((conflict) => conflict.blocking);
  return {
    overlay: canActivate ? { ...overlay, baseVersion: next.version, revision: overlay.revision + 1, values } : overlay,
    addedBaseKeys,
    conflicts,
    canActivate,
  };
}
