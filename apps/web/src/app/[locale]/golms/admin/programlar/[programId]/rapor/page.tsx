import type { Metadata } from "next";
import Link from "next/link";
import { DataState } from "@/components/data-state";
import { WorkspaceShell } from "@/components/workspace-shell";
import { loadProgramReport } from "@/lib/golms-runtime";

export const metadata: Metadata = { title: "Program raporu" };

export default async function ProgramReportPage({ params }: { params: Promise<{ locale: string; programId: string }> }) {
  const { locale, programId } = await params;
  const result = await loadProgramReport(locale === "tr" ? "tr-TR" : "en-US", programId);
  const completed = result.state === "ready" ? result.data.filter((row) => row.enrollmentStatus === "completed").length : 0;
  return <WorkspaceShell locale={locale} active="programs" role="admin"><main className="content-page">
    <div className="page-heading"><div><span className="eyebrow">GOLMS · PROGRAM KANITI</span><h1>Program raporu</h1><p>Atama, deneme, puan ve tamamlanma durumu aynı öğrenme kayıtlarından üretilir.</p></div><Link className="secondary-button" href={`/${locale}/golms/admin/programlar`}>Programlara dön</Link></div>
    <section className="metric-strip"><article><span>Atanan öğrenen</span><strong>{result.state === "ready" ? result.data.length : "—"}</strong></article><article><span>Tamamlayan</span><strong>{result.state === "ready" ? completed : "—"}</strong></article><article><span>Tamamlanma</span><strong>{result.state === "ready" && result.data.length ? `%${Math.round(completed * 100 / result.data.length)}` : "%0"}</strong></article></section>
    {result.state !== "ready" ? <DataState title="Rapor açılamadı" message="Yetkinizi ve veri bağlantısını kontrol ederek yeniden deneyin." /> : result.data.length === 0 ? <DataState title="Henüz atama yok" message="Program bir öğrenene atandığında sonuçlar burada görünecek." /> : <section className="data-panel"><div className="panel-heading"><div><h2>Öğrenen sonuçları</h2><p>Canlı GOLMS kanıt görünümü</p></div><span>{result.data.length} kayıt</span></div><div className="responsive-table"><table><thead><tr><th>Öğrenen kimliği</th><th>Durum</th><th>Deneme</th><th>En iyi puan</th><th>Tamamlanma</th></tr></thead><tbody>{result.data.map((row) => <tr key={row.learnerId}><td><strong>{row.learnerId}</strong></td><td>{statusLabel(row.enrollmentStatus)}</td><td>{row.attemptCount}</td><td>{row.bestScore ?? "—"}</td><td>{row.completedAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.completedAt)) : "—"}</td></tr>)}</tbody></table></div></section>}
  </main></WorkspaceShell>;
}

function statusLabel(value: string) { return value === "completed" ? "Tamamlandı" : value === "in_progress" ? "Devam ediyor" : value === "available" ? "Başlamadı" : value; }
