import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanRoots = ["products", "services", "intelligence", "platform", "operations", "apps", "packages", "standards"];
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ignored = new Set(["node_modules", ".next", "dist", "coverage"]);
const violations = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return sourceExtensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

function owner(relativePath) {
  const parts = relativePath.replaceAll("\\", "/").split("/");
  if (parts[0] === "products" && parts[1]) return `product:${parts[1]}`;
  if (parts[0] === "services" && parts[1]) return `service:${parts[1]}`;
  if (parts[0] === "intelligence" && parts[1]) return `intelligence:${parts[1]}`;
  if (parts[0] === "operations" && parts[1]) return `operations:${parts[1]}`;
  if (parts[0] === "platform") return "platform";
  if (parts[0] === "standards") return "standards";
  if (parts[0] === "packages") return "package";
  if (parts[0] === "apps") return "app";
  return "other";
}

function importTarget(sourceFile, specifier) {
  if (specifier.startsWith(".")) {
    return path.relative(root, path.resolve(path.dirname(sourceFile), specifier));
  }
  const normalized = specifier.replace(/^@respongo-os\//, "");
  for (const prefix of ["products/", "services/", "intelligence/", "platform/", "operations/", "standards/"]) {
    if (normalized.startsWith(prefix)) return normalized;
  }
  return null;
}

function isForbidden(sourceOwner, targetOwner) {
  if (sourceOwner.startsWith("product:")) {
    return (targetOwner.startsWith("product:") && targetOwner !== sourceOwner)
      || targetOwner.startsWith("service:")
      || targetOwner.startsWith("operations:");
  }
  if (sourceOwner.startsWith("service:")) {
    return targetOwner.startsWith("product:") || (targetOwner.startsWith("service:") && targetOwner !== sourceOwner);
  }
  if (sourceOwner.startsWith("intelligence:")) {
    return targetOwner.startsWith("product:") || targetOwner.startsWith("service:") || targetOwner.startsWith("operations:");
  }
  if (sourceOwner === "platform") {
    return targetOwner.startsWith("product:") || targetOwner.startsWith("service:") || targetOwner.startsWith("intelligence:") || targetOwner.startsWith("operations:");
  }
  if (sourceOwner.startsWith("operations:")) {
    return targetOwner.startsWith("product:") || targetOwner.startsWith("service:") || (targetOwner.startsWith("operations:") && targetOwner !== sourceOwner);
  }
  return false;
}

const importPattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)["']\s*\)/g;
const files = scanRoots.flatMap((directory) => walk(path.join(root, directory)));

for (const file of files) {
  const relative = path.relative(root, file);
  const sourceOwner = owner(relative);
  const content = fs.readFileSync(file, "utf8");
  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2] ?? match[3];
    const target = importTarget(file, specifier);
    if (!target) continue;
    const targetOwner = owner(target);
    if (isForbidden(sourceOwner, targetOwner)) {
      violations.push(`${relative}: ${sourceOwner} doğrudan ${targetOwner} iç kodunu içe aktarıyor (${specifier})`);
    }
  }
}

if (violations.length) {
  console.error("Mimari sınır ihlalleri:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Respongo OS mimari sınırları doğrulandı: ${files.length} kaynak dosyası.`);
