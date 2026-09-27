export type ScormVersion = "1.2" | "2004";

export interface ScormArchiveLimits {
  maxEntries: number;
  maxEntryBytes: number;
  maxExpandedBytes: number;
  maxCompressionRatio: number;
  maxManifestBytes: number;
}

export interface ScormArchiveEntry {
  path: string;
  compressedBytes: number;
  uncompressedBytes: number;
  directory: boolean;
}

export interface ScormManifestSummary {
  identifier: string;
  version: ScormVersion;
  title: string | null;
  launchPath: string;
  resourceCount: number;
  scoCount: number;
  organizationCount: number;
}

export interface ScormPackageAnalysis {
  manifest: ScormManifestSummary;
  entries: ScormArchiveEntry[];
  totalCompressedBytes: number;
  totalExpandedBytes: number;
}

export class ScormValidationError extends Error {
  constructor(public readonly code: string, message = code) {
    super(message);
    this.name = "ScormValidationError";
  }
}
