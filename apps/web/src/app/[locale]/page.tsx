import Link from "next/link";
import { Activity, ArrowUpRight, BookOpen, ShieldCheck } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function StartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <main className="start-page">
    <header className="start-header"><Brand /><ThemeToggle /></header>
    <section className="start-hero">
      <span className="eyebrow">RESPONGO OS · ÜRETİM ÖNİZLEMESİ</span>
      <h1>Ekosistemin tamamı,<br /><em>güvenli bir çekirdekten.</em></h1>
      <p>Uygulama sırası OS Core ile başlar; ardından Super Admin, müşteri Control Center ve ürün çalışma alanları aynı tenant ve yetki sözleşmesi üzerinde açılır.</p>
    </section>
    <section className="entry-grid" aria-label="Respongo OS çalışma alanları">
      <Link className="entry-card entry-card-core" href={`/${locale}/os-core`}>
        <span className="entry-icon"><Activity /></span><span className="eyebrow">1 · RESPONGO İÇ İŞLETİM</span>
        <h2>OS Core</h2><p>Sistem, güvenlik, sürüm, altyapı ve sağlayıcı operasyonlarının ayrıcalıklı komuta merkezi.</p><span className="entry-link">Core erişimini doğrula <ArrowUpRight /></span>
      </Link>
      <Link className="entry-card" href={`/${locale}/golms/admin/programlar`}>
        <span className="entry-icon"><ShieldCheck /></span><span className="eyebrow">4 · GOLMS TEKNİK DİLİMİ</span>
        <h2>Eğitim programları</h2><p>Program portföyünü, sürümleri ve yayın durumunu yönetin.</p><span className="entry-link">Programlara git <ArrowUpRight /></span>
      </Link>
      <Link className="entry-card" href={`/${locale}/golms/ogrenen/atananlar`}>
        <span className="entry-icon"><BookOpen /></span><span className="eyebrow">4 · ÖĞRENME ALANI</span>
        <h2>Atanan eğitimler</h2><p>Zorunlu ve isteğe bağlı programları, son tarihleri ve ilerlemeyi görün.</p><span className="entry-link">Eğitimlerime git <ArrowUpRight /></span>
      </Link>
    </section>
    <p className="preview-note">OS Core gerçek MFA ve iç rol doğrulaması olmadan teknik veri göstermez. Super Admin ve Control Center sonraki yönetim fazlarıdır.</p>
  </main>;
}

function Brand() { return <Link className="brand" href="/tr" aria-label="Respongo OS ana sayfa"><span>R</span><strong>RESPONGO</strong><small>OS</small></Link>; }
