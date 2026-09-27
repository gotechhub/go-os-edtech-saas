import yauzl, { type Entry, type ZipFile } from "yauzl";
import { normalizePackagePath } from "./path-policy";
import { ScormValidationError, type ScormArchiveEntry, type ScormArchiveLimits } from "./types";

export const DEFAULT_SCORM_ARCHIVE_LIMITS: ScormArchiveLimits = {
  maxEntries: 10_000,
  maxEntryBytes: 512 * 1024 * 1024,
  maxExpandedBytes: 4 * 1024 * 1024 * 1024,
  maxCompressionRatio: 200,
  maxManifestBytes: 2 * 1024 * 1024,
};

export interface InspectedArchive {
  entries: ScormArchiveEntry[];
  manifestXml: string;
  totalCompressedBytes: number;
  totalExpandedBytes: number;
}

export function inspectScormArchive(buffer: Buffer, limits: ScormArchiveLimits = DEFAULT_SCORM_ARCHIVE_LIMITS): Promise<InspectedArchive> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, autoClose: false, decodeStrings: true, validateEntrySizes: true }, (openError, zipFile) => {
      if (openError || !zipFile) return reject(validationError(openError, "SCORM_INVALID_ZIP"));
      inspectOpenArchive(zipFile, limits).then(resolve, reject).finally(() => zipFile.close());
    });
  });
}

async function inspectOpenArchive(zipFile: ZipFile, limits: ScormArchiveLimits): Promise<InspectedArchive> {
  const entries: ScormArchiveEntry[] = [];
  const seen = new Set<string>();
  let totalCompressedBytes = 0;
  let totalExpandedBytes = 0;
  let manifestXml: string | undefined;

  return new Promise((resolve, reject) => {
    const fail = (error: unknown) => reject(validationError(error, "SCORM_INVALID_ZIP"));

    zipFile.on("error", fail);
    zipFile.on("entry", (entry: Entry) => {
      try {
        if (entries.length >= limits.maxEntries) throw new ScormValidationError("SCORM_TOO_MANY_FILES");
        if ((entry.generalPurposeBitFlag & 0x1) !== 0) throw new ScormValidationError("SCORM_ENCRYPTED_ENTRY");
        if (isSymbolicLink(entry)) throw new ScormValidationError("SCORM_SYMBOLIC_LINK");

        const directory = /\/$/.test(entry.fileName);
        const rawPath = directory ? entry.fileName.slice(0, -1) : entry.fileName;
        const entryPath = normalizePackagePath(rawPath);
        const identity = entryPath.toLocaleLowerCase("en-US");
        if (seen.has(identity)) throw new ScormValidationError("SCORM_DUPLICATE_PATH");
        seen.add(identity);

        if (entry.uncompressedSize > limits.maxEntryBytes) throw new ScormValidationError("SCORM_FILE_TOO_LARGE");
        totalCompressedBytes += entry.compressedSize;
        totalExpandedBytes += entry.uncompressedSize;
        if (totalExpandedBytes > limits.maxExpandedBytes) throw new ScormValidationError("SCORM_EXPANDED_SIZE_EXCEEDED");
        if (entry.uncompressedSize > 0 && entry.uncompressedSize / Math.max(entry.compressedSize, 1) > limits.maxCompressionRatio) {
          throw new ScormValidationError("SCORM_COMPRESSION_RATIO_EXCEEDED");
        }

        entries.push({ path: entryPath, compressedBytes: entry.compressedSize, uncompressedBytes: entry.uncompressedSize, directory });
        if (identity === "imsmanifest.xml") {
          if (directory || entry.uncompressedSize > limits.maxManifestBytes) throw new ScormValidationError("SCORM_MANIFEST_TOO_LARGE");
          readEntry(zipFile, entry, limits.maxManifestBytes)
            .then((content) => { manifestXml = content.toString("utf8"); zipFile.readEntry(); }, fail);
          return;
        }
        zipFile.readEntry();
      } catch (error) {
        fail(error);
      }
    });
    zipFile.on("end", () => {
      if (!manifestXml) return fail(new ScormValidationError("SCORM_MANIFEST_MISSING"));
      resolve({ entries, manifestXml, totalCompressedBytes, totalExpandedBytes });
    });
    zipFile.readEntry();
  });
}

function readEntry(zipFile: ZipFile, entry: Entry, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) return reject(validationError(error, "SCORM_MANIFEST_READ_FAILED"));
      const chunks: Buffer[] = [];
      let bytes = 0;
      stream.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > maxBytes) stream.destroy(new ScormValidationError("SCORM_MANIFEST_TOO_LARGE"));
        else chunks.push(chunk);
      });
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  });
}

function isSymbolicLink(entry: Entry): boolean {
  const unixMode = (entry.externalFileAttributes >>> 16) & 0xffff;
  return (unixMode & 0o170000) === 0o120000;
}

function validationError(error: unknown, fallback: string): ScormValidationError {
  if (error instanceof ScormValidationError) return error;
  const message = error instanceof Error ? error.message : fallback;
  if (/invalid relative path|absolute path/i.test(message)) return new ScormValidationError("SCORM_UNSAFE_PATH", message);
  return new ScormValidationError(fallback, message);
}
