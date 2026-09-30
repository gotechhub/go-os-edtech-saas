import Link from "next/link";
import { ArrowUpRight, BookOpen, ShieldCheck } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function StartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <main className="start-page">
    <header className="start-header"><Brand /><ThemeToggle /></header>
    <section className="start-hero">
      <span className="eyebrow">RESPONGO OS · ÜRETİM ÖNİZLEMESİ</span>
      <h1>Öğrenme operasyonu,<br /><em>tek ve güvenilir akışta.</em></h1>
      <p>V3 çekirdeği; içerik sürümü, program, atama, SCORM kanıtı ve raporu aynı tenant ve yetki zincirinde yönetir.</p>
    </section>
    <section className="entry-grid" aria-label="GOLMS çalışma alanları">
      <Link className="entry-card" href={`/${locale}/golms/admin/programlar`}>
        <span className="entry-icon"><ShieldCheck /></span><span className="eyebrow">AKADEMİ YÖNETİMİ</span>
        <h2>Eğitim programları</h2><p>Program portföyünü, sürümleri ve yayın durumunu yönetin.</p><span className="entry-link">Programlara git <ArrowUpRight /></span>
      </Link>
      <Link className="entry-card" href={`/${locale}/golms/ogrenen/atananlar`}>
        <span className="entry-icon"><BookOpen /></span><span className="eyebrow">ÖĞRENME ALANI</span>
        <h2>Atanan eğitimler</h2><p>Zorunlu ve isteğe bağlı programları, son tarihleri ve ilerlemeyi görün.</p><span className="entry-link">Eğitimlerime git <ArrowUpRight /></span>
      </Link>
    </section>
    <p className="preview-note">Bu kabuk gerçek V3 API sözleşmesine hazırlanmıştır. Hosted Supabase bağlanmadan müşteri veya eğitim verisi göstermez.</p>
  </main>;
}

function Brand() { return <Link className="brand" href="/tr" aria-label="Respongo OS ana sayfa"><span>R</span><strong>RESPONGO</strong><small>OS</small></Link>; }
