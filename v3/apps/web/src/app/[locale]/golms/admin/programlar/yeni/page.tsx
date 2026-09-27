import Link from "next/link";
import { DataState } from "@/components/data-state";
import { WorkspaceShell } from "@/components/workspace-shell";

export default async function NewProgramPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <WorkspaceShell locale={locale} active="programs" role="admin"><main className="content-page"><div className="page-heading"><div><span className="eyebrow">PROGRAM OLUŞTURUCU</span><h1>Yeni eğitim programı</h1><p>Program kimliği, adımlar, kurallar ve atama birbirinden ayrı kaydedilir.</p></div></div><DataState title="Program stüdyosu sıradaki üretim paketinde" message="BFF oluşturma komutu hazır. Form, adım düzenleyici, yayın ve atama ekranı yetki akışıyla birlikte eklenecek." action={<Link className="secondary-button" href={`/${locale}/golms/admin/programlar`}>Program listesine dön</Link>} /></main></WorkspaceShell>;
}
