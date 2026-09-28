import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import yauzl, { type Entry, type ZipFile } from "yauzl";
import { inspectScormArchiveFile } from "./archive";
import { parseScormManifest } from "./manifest";
import { normalizePackagePath } from "./path-policy";
import { ScormValidationError, type ScormArchiveLimits, type ScormPackageAnalysis } from "./types";

export interface ExtractedScormPackage {
  analysis: ScormPackageAnalysis;
  files: string[];
}

export async function extractScormPackageFile(
  archivePath: string,
  outputDirectory: string,
  limits?: ScormArchiveLimits,
): Promise<ExtractedScormPackage> {
  const archive = await inspectScormArchiveFile(archivePath, limits);
  const analysis: ScormPackageAnalysis = {
    manifest: parseScormManifest(archive.manifestXml, archive.entries),
    entries: archive.entries,
    totalCompressedBytes: archive.totalCompressedBytes,
    totalExpandedBytes: archive.totalExpandedBytes,
  };
  const outputRoot = path.resolve(outputDirectory);
  await mkdir(outputRoot, { recursive: true });
  const zipFile = await openArchive(archivePath);
  try {
    const files = await extractOpenArchive(zipFile, outputRoot);
    const expected = analysis.entries.filter((entry) => !entry.directory).map((entry) => entry.path).sort();
    if (files.length !== expected.length || files.some((file, index) => file !== expected[index])) {
      throw new ScormValidationError("SCORM_ARCHIVE_CHANGED_DURING_EXTRACTION");
    }
    return { analysis, files };
  } finally {
    zipFile.close();
  }
}

function openArchive(filePath: string): Promise<ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true, autoClose: false, decodeStrings: true, validateEntrySizes: true }, (error, zipFile) => {
      if (error || !zipFile) reject(new ScormValidationError("SCORM_INVALID_ZIP", error instanceof Error ? error.message : undefined));
      else resolve(zipFile);
    });
  });
}

function extractOpenArchive(zipFile: ZipFile, outputRoot: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const files: string[] = [];
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof ScormValidationError ? error : new ScormValidationError("SCORM_EXTRACTION_FAILED", error instanceof Error ? error.message : undefined));
    };
    zipFile.on("error", fail);
    zipFile.on("entry", (entry: Entry) => {
      void extractEntry(zipFile, entry, outputRoot).then((file) => {
        if (file) files.push(file);
        zipFile.readEntry();
      }, fail);
    });
    zipFile.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(files.sort());
    });
    zipFile.readEntry();
  });
}

async function extractEntry(zipFile: ZipFile, entry: Entry, outputRoot: string): Promise<string | null> {
  const directory = entry.fileName.endsWith("/");
  const rawPath = directory ? entry.fileName.slice(0, -1) : entry.fileName;
  const relativePath = normalizePackagePath(rawPath);
  const destination = path.resolve(outputRoot, ...relativePath.split("/"));
  if (destination !== outputRoot && !destination.startsWith(`${outputRoot}${path.sep}`)) {
    throw new ScormValidationError("SCORM_UNSAFE_PATH");
  }
  if (directory) {
    await mkdir(destination, { recursive: true });
    return null;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  const stream = await openEntryStream(zipFile, entry);
  await pipeline(stream, createWriteStream(destination, { flags: "wx", mode: 0o600 }));
  return relativePath;
}

function openEntryStream(zipFile: ZipFile, entry: Entry): Promise<Readable> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) reject(new ScormValidationError("SCORM_ENTRY_READ_FAILED", error instanceof Error ? error.message : undefined));
      else resolve(stream);
    });
  });
}
