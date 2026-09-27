import { XMLParser } from "fast-xml-parser";
import { resolveManifestPath } from "./path-policy";
import { ScormValidationError, type ScormArchiveEntry, type ScormManifestSummary, type ScormVersion } from "./types";

type XmlNode = Record<string, unknown>;

export function parseScormManifest(xml: string, entries: readonly ScormArchiveEntry[]): ScormManifestSummary {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new ScormValidationError("SCORM_XML_DTD_FORBIDDEN");

  let parsed: unknown;
  try {
    parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
      processEntities: false,
      allowBooleanAttributes: false,
    }).parse(xml);
  } catch (error) {
    throw new ScormValidationError("SCORM_MANIFEST_INVALID_XML", error instanceof Error ? error.message : undefined);
  }

  const manifest = findChild(asNode(parsed), "manifest");
  if (!manifest) throw new ScormValidationError("SCORM_MANIFEST_ROOT_MISSING");
  const version = detectVersion(manifest, xml);
  const identifier = attribute(manifest, "identifier");
  if (!identifier) throw new ScormValidationError("SCORM_MANIFEST_IDENTIFIER_MISSING");

  const organizations = findChild(manifest, "organizations");
  const organizationNodes = organizations ? children(organizations, "organization") : [];
  const resourcesNode = findChild(manifest, "resources");
  const resources = resourcesNode ? children(resourcesNode, "resource") : [];
  if (resources.length === 0) throw new ScormValidationError("SCORM_RESOURCE_MISSING");

  const scos = resources.filter((resource) => attributeByLocalName(resource, "scormType")?.toLowerCase() === "sco");
  if (scos.length === 0) throw new ScormValidationError("SCORM_SCO_MISSING");
  const launchResource = scos.find((resource) => Boolean(attribute(resource, "href"))) ?? scos[0];
  const href = attribute(launchResource, "href");
  if (!href) throw new ScormValidationError("SCORM_LAUNCH_MISSING");
  const launchPath = resolveManifestPath(attributeByLocalName(launchResource, "base"), href);
  const filePaths = new Set(entries.filter((entry) => !entry.directory).map((entry) => entry.path.toLocaleLowerCase("en-US")));
  if (!filePaths.has(launchPath.toLocaleLowerCase("en-US"))) throw new ScormValidationError("SCORM_LAUNCH_FILE_MISSING");

  const defaultOrganization = organizations ? attribute(organizations, "default") : undefined;
  const selectedOrganization = organizationNodes.find((node) => attribute(node, "identifier") === defaultOrganization) ?? organizationNodes[0];

  return {
    identifier,
    version,
    title: selectedOrganization ? textChild(selectedOrganization, "title") : null,
    launchPath,
    resourceCount: resources.length,
    scoCount: scos.length,
    organizationCount: organizationNodes.length,
  };
}

function detectVersion(manifest: XmlNode, xml: string): ScormVersion {
  const metadata = findChild(manifest, "metadata");
  const schemaVersion = metadata ? textChild(metadata, "schemaversion")?.toLowerCase() : undefined;
  const sample = `${schemaVersion ?? ""} ${xml.slice(0, 12_000)}`.toLowerCase();
  if (sample.includes("2004") || sample.includes("adlcp_v1p3") || sample.includes("imsss")) return "2004";
  if (sample.includes("1.2") || sample.includes("adlcp_rootv1p2")) return "1.2";
  throw new ScormValidationError("SCORM_VERSION_UNSUPPORTED");
}

function asNode(value: unknown): XmlNode {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as XmlNode : {};
}

function localName(value: string): string {
  return value.split(":").at(-1)?.toLowerCase() ?? value.toLowerCase();
}

function findChild(node: XmlNode, name: string): XmlNode | undefined {
  const key = Object.keys(node).find((candidate) => !candidate.startsWith("@_") && localName(candidate) === name.toLowerCase());
  if (!key) return undefined;
  const value = node[key];
  return Array.isArray(value) ? asNode(value[0]) : asNode(value);
}

function children(node: XmlNode, name: string): XmlNode[] {
  const key = Object.keys(node).find((candidate) => !candidate.startsWith("@_") && localName(candidate) === name.toLowerCase());
  if (!key) return [];
  const value = node[key];
  return (Array.isArray(value) ? value : [value]).map(asNode);
}

function attribute(node: XmlNode, name: string): string | undefined {
  const value = node[`@_${name}`];
  return typeof value === "string" ? value.trim() : undefined;
}

function attributeByLocalName(node: XmlNode, name: string): string | undefined {
  const key = Object.keys(node).find((candidate) => candidate.startsWith("@_") && localName(candidate.slice(2)) === name.toLowerCase());
  const value = key ? node[key] : undefined;
  return typeof value === "string" ? value.trim() : undefined;
}

function textChild(node: XmlNode, name: string): string | null {
  const key = Object.keys(node).find((candidate) => !candidate.startsWith("@_") && localName(candidate) === name.toLowerCase());
  const value = key ? node[key] : undefined;
  if (typeof value === "string") return value.trim() || null;
  const text = asNode(value)["#text"];
  return typeof text === "string" ? text.trim() || null : null;
}
