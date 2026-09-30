import type { Metadata } from "next";
import { DataState } from "@/components/data-state";
import { ScormImportAction } from "@/components/scorm-import-action";
import { ScormUploadForm } from "@/components/scorm-upload-form";
import { WorkspaceShell } from "@/components/workspace-shell";
import { loadScormContent } from "@/lib/golms-runtime";

export const metadata: Metadata = { title: "SCORM içerik kütüphanesi" };

const statusText = (status: string | null) => status === "published" ? "Yayında" : status === "ready" ? "Yayına hazır" : status === "processing" ? "Yayınlanıyor" : status === "queued" ? "Yayın kuyruğunda" : status === "failed" ? "İşlem hatası" : status === "draft" ? "Taslak" : status ?? "Yükleme bekleniyor";

export default async function ContentLibraryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await loadScormContent(locale === "tr" ? "tr-TR" : "en-US");
  return <WorkspaceShell locale={locale} active="content" role="admin"><main className="content-page">
    <div className="page-heading"><div><span className="eyebrow">GOLMS · İÇERİK YÖNETİMİ</span><h1>İçerik kütüphanesi</h1><p>SCORM paketlerini karantina, doğrulama, sürüm ve yayın kanıtıyla yönetin.</p></div></div>
    {result.state !== "ready" ? <DataState title="İçerik kütüphanesi açılamadı" message="Giriş, kurum yetkisi ve veri bağlantısını kontrol edin." /> : <>
      <ScormUploadForm locale={locale} />
      {result.data.length === 0 ? <DataState title="Henüz SCORM içeriği yok" message="İlk paketi yukarıdaki güvenli yükleme alanından ekleyin." /> :
        <section className="data-panel content-library"><div className="panel-heading"><div><h2>SCORM içerikleri</h2><p>Canlı sürüm ve işleme durumu</p></div><span>{result.data.length} kayıt</span></div><div className="responsive-table"><table><thead><tr><th>İçerik</th><th>Standart</th><th>Tarama</th><th>Doğrulama</th><th>Yayın</th><th>İşlem</th></tr></thead><tbody>{result.data.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>v{item.version} · {item.locale}</small></td><td>{item.standard?.replaceAll("_", " ").toUpperCase() ?? "—"}</td><td>{statusText(item.scanStatus)}</td><td>{statusText(item.validationStatus)}</td><td><span className={`status status-${item.status}`}>{statusText(item.status === "published" ? item.status : item.publicationStatus ?? item.status)}</span></td><td><ScormImportAction versionId={item.id} assetId={item.assetId} status={item.status} /></td></tr>)}</tbody></table></div></section>}
    </>}
  </main></WorkspaceShell>;
}
