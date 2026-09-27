import { requireHash, requireInstant, requireTenant, requireWrite } from "./guards";
import type { CommandContext, LearningObjectVersion } from "./types";

const safeLaunchPath = (value: string) => {
  const normalized = value.replaceAll("\\", "/");
  return Boolean(normalized) && !normalized.startsWith("/") && !normalized.includes("../") && !/^[a-z]+:/i.test(normalized);
};

export function publishLearningObjectVersion(context: CommandContext, version: LearningObjectVersion): LearningObjectVersion {
  requireWrite(context);
  requireTenant(context.tenantId, version.tenantId);
  requireHash(version.contentHash, "INVALID_CONTENT_HASH");
  if (!version.title.trim() || !version.locale.trim()) throw new Error("CONTENT_METADATA_REQUIRED");
  if (!Number.isInteger(version.version) || version.version < 1) throw new Error("INVALID_CONTENT_VERSION");
  if (!["draft", "in_review", "approved"].includes(version.status)) throw new Error("CONTENT_NOT_PUBLISHABLE");

  if (version.kind === "scorm" && !version.package) throw new Error("SCORM_PACKAGE_REQUIRED");
  if (version.kind !== "scorm" && version.package) throw new Error("PACKAGE_KIND_MISMATCH");

  if (version.package) {
    requireHash(version.package.packageHash, "INVALID_PACKAGE_HASH");
    if (version.package.scanStatus !== "clean") throw new Error("PACKAGE_NOT_CLEAN");
    if (version.package.validationStatus !== "valid" || !version.package.validatedAt) throw new Error("PACKAGE_NOT_VALIDATED");
    if (!safeLaunchPath(version.package.launchPath)) throw new Error("UNSAFE_LAUNCH_PATH");
    if (!version.package.manifestIdentifier.trim() || !version.package.validatorVersion.trim()) throw new Error("PACKAGE_METADATA_REQUIRED");
    if (!Number.isInteger(version.package.fileCount) || version.package.fileCount < 1 || version.package.expandedBytes < 1) throw new Error("PACKAGE_SIZE_INVALID");
    requireInstant(version.package.validatedAt);
  }

  return { ...version, status: "published", publishedAt: new Date(requireInstant(context.now)).toISOString(), publishedBy: context.actorId };
}

export function assertImmutablePublishedVersion(before: LearningObjectVersion, after: LearningObjectVersion): void {
  if (before.status !== "published") return;
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("PUBLISHED_VERSION_IMMUTABLE");
}
