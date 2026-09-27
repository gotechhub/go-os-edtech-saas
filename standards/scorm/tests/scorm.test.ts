import { Buffer } from "node:buffer";
import yazl from "yazl";
import { describe, expect, it } from "vitest";
import { analyzeScormPackage, ScormValidationError } from "../src";

const MANIFEST_2004 = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course-001" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata><schema>ADL SCORM</schema><schemaversion>2004 4th Edition</schemaversion></metadata>
  <organizations default="org-1"><organization identifier="org-1"><title>Güvenli SCORM</title></organization></organizations>
  <resources><resource identifier="sco-1" adlcp:scormType="sco" href="content/index.html"><file href="content/index.html"/></resource></resources>
</manifest>`;

const MANIFEST_12 = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course-12" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="org-12"><organization identifier="org-12"><title>SCORM 1.2</title></organization></organizations>
  <resources><resource identifier="sco-12" adlcp:scormtype="sco" href="start.htm" /></resources>
</manifest>`;

describe("SCORM package analysis", () => {
  it("reads a valid SCORM 2004 package without extracting it", async () => {
    const result = await analyzeScormPackage(await createZip([
      ["imsmanifest.xml", MANIFEST_2004],
      ["content/index.html", "<!doctype html><title>Course</title>"],
    ]));

    expect(result.manifest).toMatchObject({ identifier: "course-001", version: "2004", launchPath: "content/index.html", scoCount: 1 });
    expect(result.entries.map((entry) => entry.path)).toContain("content/index.html");
  });

  it("recognizes a SCORM 1.2 package and its launch target", async () => {
    const result = await analyzeScormPackage(await createZip([
      ["imsmanifest.xml", MANIFEST_12],
      ["start.htm", "<!doctype html><title>SCORM 1.2</title>"],
    ]));
    expect(result.manifest).toMatchObject({ identifier: "course-12", version: "1.2", launchPath: "start.htm" });
  });

  it("rejects traversal paths before content publication", async () => {
    const archive = await createZip([
      ["imsmanifest.xml", MANIFEST_2004],
      ["ok/outside.html", "unsafe"],
      ["content/index.html", "ok"],
    ]);
    await expect(analyzeScormPackage(replaceArchiveEntryName(archive, "ok/outside.html", "../outside.html")))
      .rejects.toMatchObject({ code: "SCORM_UNSAFE_PATH" });
  });

  it("rejects a manifest whose launch file is absent", async () => {
    await expect(analyzeScormPackage(await createZip([["imsmanifest.xml", MANIFEST_2004]])))
      .rejects.toMatchObject({ code: "SCORM_LAUNCH_FILE_MISSING" });
  });

  it("rejects XML entity and DTD declarations", async () => {
    const malicious = MANIFEST_2004.replace("<manifest", '<!DOCTYPE manifest [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><manifest');
    await expect(analyzeScormPackage(await createZip([
      ["imsmanifest.xml", malicious],
      ["content/index.html", "ok"],
    ]))).rejects.toBeInstanceOf(ScormValidationError);
  });

  it("rejects expansion ratios above the configured limit", async () => {
    await expect(analyzeScormPackage(await createZip([
      ["imsmanifest.xml", MANIFEST_2004],
      ["content/index.html", "A".repeat(200_000)],
    ]), { maxEntries: 20, maxEntryBytes: 500_000, maxExpandedBytes: 600_000, maxCompressionRatio: 5, maxManifestBytes: 50_000 }))
      .rejects.toMatchObject({ code: "SCORM_COMPRESSION_RATIO_EXCEEDED" });
  });
});

function createZip(files: Array<[string, string]>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = new yazl.ZipFile();
    const chunks: Buffer[] = [];
    archive.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.outputStream.on("error", reject);
    archive.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    for (const [name, content] of files) archive.addBuffer(Buffer.from(content), name);
    archive.end();
  });
}

function replaceArchiveEntryName(archive: Buffer, from: string, to: string): Buffer {
  if (Buffer.byteLength(from) !== Buffer.byteLength(to)) throw new Error("ZIP test paths must have equal byte length");
  const copy = Buffer.from(archive);
  const source = Buffer.from(from);
  const target = Buffer.from(to);
  let offset = 0;
  let replacements = 0;
  while ((offset = copy.indexOf(source, offset)) >= 0) {
    target.copy(copy, offset);
    offset += target.length;
    replacements += 1;
  }
  if (replacements < 2) throw new Error("ZIP entry name was not found in local and central headers");
  return copy;
}
