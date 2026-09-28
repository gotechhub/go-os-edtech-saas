import { inspectScormArchive, inspectScormArchiveFile } from "./archive";
import { parseScormManifest } from "./manifest";
import type { ScormArchiveLimits, ScormPackageAnalysis } from "./types";

export async function analyzeScormPackage(buffer: Buffer, limits?: ScormArchiveLimits): Promise<ScormPackageAnalysis> {
  const archive = await inspectScormArchive(buffer, limits);
  return {
    manifest: parseScormManifest(archive.manifestXml, archive.entries),
    entries: archive.entries,
    totalCompressedBytes: archive.totalCompressedBytes,
    totalExpandedBytes: archive.totalExpandedBytes,
  };
}

export async function analyzeScormPackageFile(filePath: string, limits?: ScormArchiveLimits): Promise<ScormPackageAnalysis> {
  const archive = await inspectScormArchiveFile(filePath, limits);
  return {
    manifest: parseScormManifest(archive.manifestXml, archive.entries),
    entries: archive.entries,
    totalCompressedBytes: archive.totalCompressedBytes,
    totalExpandedBytes: archive.totalExpandedBytes,
  };
}

export * from "./archive";
export * from "./manifest";
export * from "./path-policy";
export * from "./types";
