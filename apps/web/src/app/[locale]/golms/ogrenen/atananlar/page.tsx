import type { Metadata } from "next";
import { DataState } from "@/components/data-state";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ScormLaunchButton } from "@/components/scorm-launch-button";
import { loadEnrollments } from "@/lib/golms-runtime";

export const metadata: Metadata = { title: "Atanan eğitimler" };

const stateCopy = {
  unconfigured: ["Öğrenme ortamı hazırlanıyor", "Yeni V3 veri ortamı bağlandığında gerçek atamalarınız burada görünecek."],
  unauthenticated: ["Eğitimlerinizi görmek için giriş yapın", "Kurum hesabınızla güvenli giriş yaptıktan sonra atamalarınız yüklenir."],
  tenant_required: ["Öğrenme alanınızı seçin", "Birden fazla kurum üyeliğiniz var. Devam etmek istediğiniz kurumu seçin."],
  forbidden: ["Öğrenme alanı açılamadı", "Aktif üyelik veya GOLMS ürün hakkınız bulunmuyor."],
  error: ["Atamalar alınamadı", "Veriniz korunuyor. Bağlantı düzeldiğinde bu sayfayı yeniden deneyin."],
} as const;

export default async function AssignmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await loadEnrollments(locale === "tr" ? "tr-TR" : "en-US");
  return <WorkspaceShell locale={locale} active="assignments" role="learner"><main className="content-page learner-page">
    <div className="page-heading"><div><span className="eyebrow">GOLMS · SENİN ÖĞRENME ALANIN</span><h1>Atanan eğitimler</h1><p>Öncelikli eğitimlerini, son tarihlerini ve kaldığın noktayı tek yerde takip et.</p></div></div>
    {result.state !== "ready" ? <DataState title={stateCopy[result.state][0]} message={stateCopy[result.state][1]} /> : result.data.length === 0 ? <DataState title="Şu anda atanmış eğitimin yok" message="Yeni bir program atandığında son tarihi ve ilerleme durumu burada görünecek." /> :
      <section className="learning-list">{result.data.map((item) => <article className="learning-card" key={item.id}><div><span className={item.required ? "required-chip" : "optional-chip"}>{item.required ? "Zorunlu" : "İsteğe bağlı"}</span><h2>{item.programTitle}</h2><p>{item.dueAt ? `Son tarih: ${new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(item.dueAt))}` : "Son tarih yok"}</p></div><div className="progress-block"><div><span>İlerleme</span><b>%{item.progressPercent}</b></div><progress max="100" value={item.progressPercent}>%{item.progressPercent}</progress>{item.nextStepKind === "scorm" ? <ScormLaunchButton enrollmentId={item.id} stepId={item.nextStepId} label={item.progressPercent > 0 ? "Devam et" : "Başla"} /> : <button className="primary-button" type="button" disabled>{item.progressPercent === 100 ? "Tamamlandı" : "Adım hazırlanıyor"}</button>}</div></article>)}</section>}
  </main></WorkspaceShell>;
}
