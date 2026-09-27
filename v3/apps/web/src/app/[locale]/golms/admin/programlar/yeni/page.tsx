import type { Metadata } from "next";
import { ProgramDraftForm } from "@/components/program-draft-form";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Yeni eğitim programı" };

export default async function NewProgramPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <WorkspaceShell locale={locale} active="programs" role="admin"><main className="content-page"><div className="page-heading"><div><span className="eyebrow">PROGRAM OLUŞTURUCU</span><h1>Yeni eğitim programı</h1><p>Program kimliği, adımlar, kurallar ve atama birbirinden ayrı ve izlenebilir kaydedilir.</p></div></div><ProgramDraftForm locale={locale} /></main></WorkspaceShell>;
}
