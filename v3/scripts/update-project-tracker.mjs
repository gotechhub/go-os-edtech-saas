import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(root, "v3/project-tracker.json");
const tracker = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const localePlan = JSON.parse(fs.readFileSync(path.join(root, "v3/platform/locales.json"), "utf8"));
const check = process.argv.includes("--check");
const statuses = new Set(["planned", "active", "blocked", "verified"]);
const gateKeys = ["definition", "implementation", "acceptance"];
const fail = (message) => { throw new Error(message); };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clean = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const phaseIds = new Set(tracker.phases.map((phase) => phase.id));
const areaIds = new Set();
const moduleIds = new Set();
const tasks = [];
const outputFiles = new Map();

if (!/^\d{4}-\d{2}-\d{2}$/.test(tracker.updatedAt)) fail("updatedAt YYYY-MM-DD olmalı");
if (phaseIds.size !== tracker.phases.length) fail("Faz kimliği yineleniyor");

for (const area of tracker.areas) {
  if (areaIds.has(area.id)) fail(`Alan kimliği yineleniyor: ${area.id}`);
  areaIds.add(area.id);
  const areaPath = path.resolve(root, area.path);
  if (!areaPath.startsWith(path.join(root, "v3") + path.sep) || !fs.existsSync(areaPath)) fail(`Geçersiz alan yolu: ${area.path}`);
  if (!area.modules.length) fail(`Boş modül alanı: ${area.id}`);
  for (const module of area.modules) {
    if (moduleIds.has(module.id)) fail(`Modül kimliği yineleniyor: ${module.id}`);
    moduleIds.add(module.id);
    if (!phaseIds.has(module.phase)) fail(`Bilinmeyen faz: ${module.id}`);
    if (!module.title || !module.acceptance || !Array.isArray(module.features) || module.features.length < 2) fail(`Eksik modül tanımı: ${module.id}`);
    for (const gate of gateKeys) {
      const state = module.gates?.[gate] ?? { status: "planned" };
      if (!statuses.has(state.status)) fail(`Geçersiz görev durumu: ${module.id}/${gate}`);
      if (state.status === "verified" && (!state.evidence || !state.verifiedAt || !/^\d{4}-\d{2}-\d{2}$/.test(state.verifiedAt))) fail(`Doğrulanan adımda tarihli kanıt yok: ${module.id}/${gate}`);
      if (gate === "implementation" && state.status === "verified" && (module.gates?.definition?.status !== "verified")) fail(`Tanımsız uygulama kabulü: ${module.id}`);
      if (gate === "acceptance" && state.status === "verified" && (module.gates?.implementation?.status !== "verified")) fail(`Uygulamasız kabul: ${module.id}`);
      tasks.push({ area, module, gate, ...state });
    }
  }
}

const count = (items, status) => items.filter((item) => item.status === status).length;
const done = count(tasks, "verified");
const left = tasks.length - done;
const percent = Math.round((done / tasks.length) * 100);
const blockers = tasks.filter((item) => item.status === "blocked");
const phaseOrder = new Map(tracker.phases.map((phase, index) => [phase.id, index]));
const next = [...moduleIds].map((id) => tasks.find((task) => task.module.id === id && task.status !== "verified"))
  .filter(Boolean)
  .sort((a, b) => Number(b.status === "active") - Number(a.status === "active") || phaseOrder.get(a.module.phase) - phaseOrder.get(b.module.phase))
  .slice(0, 3);
const activePhase = tracker.phases.find((phase) => tasks.some((task) => task.module.phase === phase.id && task.status === "active"))
  ?? tracker.phases.find((phase) => tasks.some((task) => task.module.phase === phase.id && task.status !== "verified"));

const phaseRows = tracker.phases.map((phase) => {
  const modules = tracker.areas.flatMap((area) => area.modules).filter((module) => module.phase === phase.id);
  const phaseTasks = tasks.filter((task) => task.module.phase === phase.id);
  return { ...phase, modules: modules.length, done: count(phaseTasks, "verified"), total: phaseTasks.length };
});

const md = [
  "# Respongo OS V3 · proje yol haritası",
  "",
  `**Kaynak tarihi:** ${tracker.updatedAt} · **Durum:** V3 planlama · **Aktif faz:** ${activePhase?.id ?? "Tamamlandı"} ${activePhase?.name ?? ""}`,
  "",
  `**Doğrulanmış ilerleme:** %${percent} · **Görev:** ${done}/${tasks.length} tamamlandı, ${left} kaldı · **Modül:** ${moduleIds.size} · **Engel:** ${blockers.length}`,
  `**Dil hedefi:** ${localePlan.locales.length} dil; ${localePlan.locales.filter((item) => item.license === "included").length} temel (Türkçe varsayılan + İngilizce), ${localePlan.locales.filter((item) => item.license === "addon").length} ek lisans. Paketler [Respongo HQ](operations/respongo-hq/language-control.md) tarafından yönetilir.`,
  "",
  "> Bu oran yalnızca tarihli kabul kanıtı bulunan görevlerden hesaplanır. V1/V2 oranları ve taslak dosyalar V3 tamamlanması sayılmaz.",
  "",
  "## Sıradaki üç görev",
  "",
  ...next.map((task, index) => `${index + 1}. **${task.module.id}** ${task.module.title} — ${tracker.gateNames[task.gate]} (${task.module.phase}).`),
  "",
  "## Fazlar",
  "",
  "| Faz | Hedef | Modül | Doğrulanan/görev |",
  "|---|---|---:|---:|",
  ...phaseRows.map((row) => `| ${row.id} · ${clean(row.name)} | ${clean(row.objective)} | ${row.modules} | ${row.done}/${row.total} |`),
  "",
  "## Ürün ve alanlar",
  "",
  "| Alan | Modül | Doğrulanan/görev | Döküm |",
  "|---|---:|---:|---|",
  ...tracker.areas.map((area) => {
    const areaTasks = tasks.filter((task) => task.area.id === area.id);
    const doc = ["FOUNDATION", "RELEASE"].includes(area.id) ? `docs/architecture/${area.id.toLowerCase()}-modules.md` : `${area.path.slice(3)}/modules.md`;
    return `| ${clean(area.name)} | ${area.modules.length} | ${count(areaTasks, "verified")}/${areaTasks.length} | [Modüller](${doc}) |`;
  }),
  "",
  "## Engeller",
  "",
  ...(blockers.length ? blockers.map((task) => `- ${task.module.id}/${task.gate}: ${task.blocker ?? "Açıklama bekleniyor"}`) : ["- Kayıtlı engel yok."]),
  "",
  "## Güncelleme kuralı",
  "",
  "`v3/project-tracker.json` tek durum kaynağıdır. Her modülün tanım, uygulama ve kabul görevi vardır. `verified` için `verifiedAt` ve `evidence` zorunludur. `corepack pnpm v3:tracker:update` çıktıları üretir; `corepack pnpm v3:tracker:check` CI'da tutarlılığı denetler.",
  ""
].join("\n");
outputFiles.set("v3/proje-plani.md", md);

for (const area of tracker.areas) {
  const lines = [
    `# ${area.name} · modül dökümü`, "",
    `**Tek görev kaynağı:** [V3 takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.`,
    "", "| ID | Faz | Modül | Durum |", "|---|---|---|---|",
    ...area.modules.map((module) => {
      const moduleTasks = tasks.filter((task) => task.module.id === module.id);
      return `| ${module.id} | ${module.phase} | ${clean(module.title)} | ${count(moduleTasks, "verified")}/3 |`;
    }), ""
  ];
  for (const module of area.modules) lines.push(`## ${module.id} · ${module.title}`, "", `Faz: **${module.phase}**. Alt modüller: ${module.features.join("; ")}.`, "", `**Kabul senaryosu:** ${module.acceptance}`, "");
  const relative = ["FOUNDATION", "RELEASE"].includes(area.id) ? `${area.path}/${area.id.toLowerCase()}-modules.md` : `${area.path}/modules.md`;
  const depth = relative.split("/").length - 2;
  lines[2] = `**Tek görev kaynağı:** [V3 takip](${"../".repeat(depth)}project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.`;
  outputFiles.set(relative, lines.join("\n"));
}

const phaseHtml = phaseRows.map((phase) => `<div class="phase"><span class="phase-id">${escapeHtml(phase.id)}</span><strong>${escapeHtml(phase.name)}</strong><small>${phase.modules} modül · ${phase.done}/${phase.total} görev</small></div>`).join("");
const areaHtml = tracker.areas.map((area) => {
  const areaTasks = tasks.filter((task) => task.area.id === area.id);
  const rows = area.modules.map((module) => {
    const moduleTasks = tasks.filter((task) => task.module.id === module.id);
    const verified = count(moduleTasks, "verified");
    return `<tr><td><span class="id">${escapeHtml(module.id)}</span><br>${escapeHtml(module.title)}</td><td>${escapeHtml(module.phase)}</td><td>${verified}/3</td><td>${escapeHtml(module.acceptance)}</td></tr>`;
  }).join("");
  return `<details><summary><span>${escapeHtml(area.name)} <small>${area.modules.length} modül</small></span><b>${count(areaTasks, "verified")}/${areaTasks.length} görev</b></summary><div class="table-wrap"><table><thead><tr><th>Modül</th><th>Faz</th><th>Görev</th><th>Kabul senaryosu</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}).join("");
const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Respongo OS V3 · proje planı</title>
<style>:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light dark;--bg:#f5f7f8;--surface:#fff;--text:#14252c;--muted:#63747a;--line:#dbe3e4;--accent:#0f675e;--soft:#e4f2ee}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);line-height:1.5}main{max-width:1200px;margin:auto;padding:42px 24px 80px}h1{font-size:clamp(30px,4vw,52px);line-height:1.1;letter-spacing:-.045em;margin:8px 0 14px}h2{font-size:22px;letter-spacing:-.025em;margin:38px 0 14px}p{color:var(--muted)}.eyebrow{text-transform:uppercase;font-size:11px;font-weight:800;letter-spacing:.18em;color:var(--accent)}.lead{max-width:740px;font-size:17px}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:30px 0}.card,details,.phase,.note{background:var(--surface);border:1px solid var(--line);border-radius:16px}.card{padding:18px}.card small{display:block;color:var(--muted);font-size:12px}.card strong{font-size:31px;letter-spacing:-.04em}.bar{height:10px;border-radius:20px;background:var(--line);overflow:hidden}.bar span{display:block;height:100%;width:${percent}%;background:var(--accent)}.phase-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.phase{padding:14px;display:grid;gap:4px}.phase-id,.id{color:var(--accent);font-size:12px;font-weight:800}.phase small,summary small{color:var(--muted)}details{margin:8px 0;overflow:hidden}summary{padding:16px 18px;display:flex;justify-content:space-between;align-items:center;gap:12px;cursor:pointer;font-weight:650}summary small{font-weight:400;margin-left:10px}summary b{color:var(--accent);white-space:nowrap;font-size:13px}.table-wrap{overflow:auto;border-top:1px solid var(--line)}table{width:100%;border-collapse:collapse;min-width:650px}th,td{text-align:left;padding:10px 16px;border-bottom:1px solid var(--line);font-size:13px;vertical-align:top}th{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}td:last-child{color:var(--muted)}tr:last-child td{border:0}.note{padding:16px 18px}.note p{margin:0}ol{padding-left:22px}li{margin:8px 0}a{color:var(--accent)}footer{margin-top:40px;color:var(--muted);font-size:12px}@media(max-width:720px){main{padding:28px 16px 60px}.cards{grid-template-columns:repeat(2,1fr)}.card strong{font-size:25px}summary{align-items:start}summary span{max-width:70%}}@media(prefers-color-scheme:dark){:root{--bg:#0e171b;--surface:#162329;--text:#ecf4f2;--muted:#a9b9b9;--line:#314149;--accent:#76d5bc;--soft:#193c37}}</style></head><body><main><div class="eyebrow">Respongo OS · V3 planlama</div><h1>Proje yol haritası</h1><p class="lead">Ürünler, modüller ve kanıtlı ilerleme tek takip dosyasından üretilir. V1/V2 yüzdeleri bu plana aktarılmaz.</p><div class="cards"><div class="card"><small>Doğrulanmış ilerleme</small><strong>%${percent}</strong><div class="bar" role="progressbar" aria-label="Doğrulanmış ilerleme" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span></span></div></div><div class="card"><small>Görev</small><strong>${done}/${tasks.length}</strong><small>${left} görev kaldı</small></div><div class="card"><small>Modül</small><strong>${moduleIds.size}</strong><small>${tracker.areas.length} alan</small></div><div class="card"><small>Aktif faz</small><strong>${escapeHtml(activePhase?.id ?? "✓")}</strong><small>${escapeHtml(activePhase?.name ?? "Tamamlandı")}</small></div></div><div class="note"><p><strong>Durum:</strong> V3 planlama · <strong>Kaynak tarihi:</strong> ${escapeHtml(tracker.updatedAt)} · <strong>Engel:</strong> ${blockers.length}. Oran yalnızca tarihli kanıtla doğrulanmış adımlardan hesaplanır.</p></div><h2>Sıradaki üç iş</h2><ol>${next.map((task) => `<li><strong>${escapeHtml(task.module.id)} · ${escapeHtml(task.module.title)}</strong><br>${escapeHtml(tracker.gateNames[task.gate])} · ${escapeHtml(task.module.phase)}</li>`).join("")}</ol><h2>Fazlar</h2><div class="phase-grid">${phaseHtml}</div><h2>Ürünler ve modüller</h2><p>Bir alanı açarak modülleri, görev sayısını ve somut kabul senaryosunu görün.</p>${areaHtml}<footer>Tek kaynak: <a href="project-tracker.json">project-tracker.json</a> · Yenileme: <code>corepack pnpm v3:tracker:update</code> · Ürün kabulü için çalışan akış, test ve kanıt gerekir.</footer></main></body></html>\n`;
const languageSummary = `${localePlan.locales.length} dil hedefi · TR/EN temel · ${localePlan.locales.filter((item) => item.license === "addon").length} ek lisans. Temel paket ve filo dağıtımı Respongo HQ'da; müşteri değişiklikleri yükseltmede korunur.`;
outputFiles.set("v3/proje-plani.html", html.replace("<h2>Sıradaki üç iş</h2>", `<div class="note" style="margin-top:10px"><p><strong>Dil mimarisi:</strong> ${escapeHtml(languageSummary)} <a href="operations/respongo-hq/language-control.md">Paket akışı</a></p></div><h2>Sıradaki üç iş</h2>`));

let outOfDate = false;
for (const [relative, content] of outputFiles) {
  const destination = path.join(root, relative);
  if (check) {
    if (!fs.existsSync(destination) || fs.readFileSync(destination, "utf8") !== content) { console.error(`Güncel değil: ${relative}`); outOfDate = true; }
  } else {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
  }
}
if (outOfDate) process.exitCode = 1;
else console.log(`V3 takip ${check ? "doğrulandı" : "üretildi"}: ${moduleIds.size} modül, ${done}/${tasks.length} görev, %${percent}, ${outputFiles.size} çıktı.`);
