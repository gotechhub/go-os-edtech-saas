import localeData from "../../locales.json";
import type { LocaleRegistry } from "./types";

/** The planning registry is data, not evidence that translations are published. */
export const LOCALE_REGISTRY = localeData as LocaleRegistry;

export function localeDefinition(registry: LocaleRegistry, code: string) {
  return registry.locales.find((item) => item.code === code) ?? null;
}
