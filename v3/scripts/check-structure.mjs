import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const errors = [];
const graph = JSON.parse(fs.readFileSync(path.join(root, "v3/.ai_memory/graph_index.json"), "utf8"));
const localePlan = JSON.parse(fs.readFileSync(path.join(root, "v3/platform/locales.json"), "utf8"));
const localeCodes = new Set(localePlan.locales.map((item) => item.code));
if (localePlan.defaultLocale !== "tr-TR" || localePlan.locales.length !== 10 || localeCodes.size !== 10) errors.push("V3 dil hedefi 10 tekil dil ve Türkçe varsayılan olmalı");
if (localePlan.locales.filter((item) => item.license === "included").map((item) => item.code).sort().join(",") !== "en-US,tr-TR") errors.push("TR/EN temel dil hakkı bozuldu");
if (localePlan.locales.filter((item) => item.license === "addon").length !== 8) errors.push("Sekiz ek dil lisansı bekleniyor");
for (const item of localePlan.locales) {
  try { if (new Intl.Locale(item.code).toString() !== item.code) errors.push(`Kanonik olmayan locale: ${item.code}`); } catch { errors.push(`Geçersiz locale: ${item.code}`); }
  if (item.packageId !== `locale.${item.code}`) errors.push(`Dil paketi kimliği uyumsuz: ${item.code}`);
  if (item.direction !== (item.code === "ar" ? "rtl" : "ltr")) errors.push(`Dil yönü uyumsuz: ${item.code}`);
}
const ids = new Set(graph.nodes.map((node) => node.id));
if (ids.size !== graph.nodes.length) errors.push("Bellek düğüm kimlikleri yineleniyor");
for (const node of graph.nodes) if (!fs.existsSync(path.join(root, node.path))) errors.push(`Bellek yolu yok: ${node.path}`);
for (const edge of graph.edges) if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push(`Bellek bağı geçersiz: ${edge.from} → ${edge.to}`);

const markdown = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? markdown(full) : entry.name.endsWith(".md") ? [full] : [];
});
const documents = [path.join(root, "AGENTS.md"), path.join(root, "CLAUDE.md"), ...markdown(path.join(root, "v3")), ...markdown(path.join(root, ".claude/skills")), ...markdown(path.join(root, ".agents/skills"))];
let linkCount = 0;
for (const document of documents) {
  const source = fs.readFileSync(document, "utf8");
  for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0].split("?")[0];
    if (!target || /^(?:https?:|mailto:|codex:|data:)/i.test(target) || path.isAbsolute(target) || /^[A-Za-z]:[\\/]/.test(target)) continue;
    linkCount++;
    const resolved = path.resolve(path.dirname(document), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) errors.push(`${path.relative(root, document)} → ${target}`);
  }
}
const canonical = fs.readdirSync(path.join(root, ".claude/skills"), { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.startsWith("respongo-v3-"));
for (const entry of canonical) {
  const skill = path.join(root, ".claude/skills", entry.name, "SKILL.md");
  const bridge = path.join(root, ".agents/skills", entry.name, "SKILL.md");
  if (!fs.existsSync(skill) || !fs.existsSync(bridge)) errors.push(`Skill çift yönlendirmesi eksik: ${entry.name}`);
  else for (const file of [skill, bridge]) {
    const body = fs.readFileSync(file, "utf8");
    if (!/^---\r?\nname: [a-z0-9-]+\r?\ndescription: .+\r?\n---/.test(body)) errors.push(`Skill frontmatter geçersiz: ${path.relative(root, file)}`);
  }
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else console.log(`V3 yapı doğrulandı: ${graph.nodes.length} kritik yol, ${linkCount} yerel bağlantı, ${canonical.length} ortak skill.`);
