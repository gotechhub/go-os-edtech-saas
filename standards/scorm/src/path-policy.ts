import path from "node:path";
import { ScormValidationError } from "./types";

const URI_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function normalizePackagePath(value: string): string {
  const decoded = value.normalize("NFC");
  if (!decoded || decoded.includes("\0") || decoded.includes("\\") || decoded.startsWith("/") || URI_SCHEME.test(decoded)) {
    throw new ScormValidationError("SCORM_UNSAFE_PATH");
  }

  const segments = decoded.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new ScormValidationError("SCORM_UNSAFE_PATH");
  }

  const normalized = path.posix.normalize(decoded);
  if (normalized.startsWith("../") || normalized === "..") throw new ScormValidationError("SCORM_UNSAFE_PATH");
  return normalized;
}

export function resolveManifestPath(basePath: string | undefined, href: string): string {
  if (!href || href.startsWith("#") || URI_SCHEME.test(href)) throw new ScormValidationError("SCORM_INVALID_LAUNCH_PATH");
  const withoutQuery = href.split(/[?#]/, 1)[0] ?? "";
  const combined = basePath ? path.posix.join(basePath, withoutQuery) : withoutQuery;
  return normalizePackagePath(combined);
}
