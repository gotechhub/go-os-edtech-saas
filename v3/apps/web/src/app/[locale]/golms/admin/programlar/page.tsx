import type { Metadata } from "next";
import Link from "next/link";
import { DataState } from "@/components/data-state";
import { Plus } from "@/components/icons";
import { WorkspaceShell } from "@/components/workspace-shell";
import { loadPrograms } from "@/lib/golms-runtime";

export const metadata: Metadata = { title: "Eğitim programları" };

const stateCopy = {
  unconfigured: ["Veri bağlantısı bekleniyor", "Yeni V3 Supabase ortamı bağlandığında program portföyü burada görünecek."],
  unauthenticated: ["Güvenli giriş gerekli", "Program yönetimini açmak için kurum hesabınızla giriş yapın."],
  tenant_required: ["Kurum seçimi gerekli", "Birden fazla kurum üyeliğiniz var. Çalışma alanınızı seçerek devam edin."],
  forbidden: ["Bu alan için yetkiniz yok", "Öğrenme yöneticisi veya tenant yöneticisi rolü gerekir."],
  error: ["Programlar alınamadı", "Bağlantı veya servis geçici olarak yanıt vermiyor. Daha sonra yeniden deneyin."],
} as const;

export default async function ProgramsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await loadPrograms(locale === "tr" ? "tr-TR" : "en-US");
  return <WorkspaceShell locale={locale} active="programs" role="admin"><main className="content-page">
    <div className="page-heading"><div><span className="eyebrow">GOLMS · ÖĞRENME YÖNETİMİ</span><h1>Eğitim programları</h1><p>İçerik akışlarını sürümlü olarak hazırlayın, yayımlayın ve hedef kitleye atayın.</p></div><Link className="primary-button" href={`/${locale}/golms/admin/programlar/yeni`}><Plus /> Yeni program</Link></div>
    <section className="metric-strip" aria-label="Program özeti">
      <article><span>Toplam program</span><strong>{result.state === "ready" ? result.data.length : "—"}</strong></article>
      <article><span>Yayında</span><strong>{result.state === "ready" ? result.data.filter((item) => item.status === "published").length : "—"}</strong></article>
      <article><span>Taslak</span><strong>{result.state === "ready" ? result.data.filter((item) => item.status === "draft").length : "—"}</strong></article>
    </section>
    {result.state !== "ready" ? <DataState title={stateCopy[result.state][0]} message={stateCopy[result.state][1]} /> : result.data.length === 0 ?
      <DataState title="İlk programınızı oluşturun" message="SCORM, sınav, anket, görev ve kaynak adımlarını tek sürümlü programda birleştirebilirsiniz." action={<Link className="secondary-button" href={`/${locale}/golms/admin/programlar/yeni`}><Plus /> Program oluştur</Link>} /> :
      <section className="data-panel"><div className="panel-heading"><div><h2>Program portföyü</h2><p>En son sürüm ve yayın durumu</p></div><span>{result.data.length} kayıt</span></div><div className="responsive-table"><table><thead><tr><th>Program</th><th>Durum</th><th>Sürüm</th><th>Adım</th><th>Dil</th></tr></thead><tbody>{result.data.map((program) => <tr key={program.id}><td><strong>{program.title}</strong><small>{program.id}</small></td><td><Status value={program.status} /></td><td>v{program.version}</td><td>{program.stepCount}</td><td>{program.locale}</td></tr>)}</tbody></table></div></section>}
  </main></WorkspaceShell>;
}

function Status({ value }: { value: string }) { return <span className={`status status-${value}`}>{value === "published" ? "Yayında" : value === "draft" ? "Taslak" : value}</span>; }
