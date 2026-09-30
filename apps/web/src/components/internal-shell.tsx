import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, Database, Lock, Server, Settings } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export function InternalShell({ children, locale }: { children: ReactNode; locale: string }) {
  return <div className="workspace internal-workspace">
    <aside className="sidebar internal-sidebar">
      <Link className="brand brand-sidebar" href={`/${locale}`}><span>R</span><strong>RESPONGO</strong><small>OS</small></Link>
      <div className="sidebar-product"><span>PLATFORM OPERATIONS</span><b>OS CORE</b></div>
      <nav aria-label="Respongo OS Core">
        <p>TEKNİK İŞLETİM</p>
        <Link aria-current="page" className="active" href={`/${locale}/os-core`}><Activity /> Komuta merkezi</Link>
        <span className="nav-disabled"><Server /> Altyapı ve servisler <small>F1</small></span>
        <span className="nav-disabled"><Lock /> Güvenlik ve audit <small>F1</small></span>
        <span className="nav-disabled"><Database /> Veri ve depolama <small>F1</small></span>
        <span className="nav-disabled"><Settings /> Sürüm ve sağlayıcılar <small>F1</small></span>
      </nav>
      <div className="sidebar-foot"><span>Ayrıcalıklı alan</span><small>MFA ve gerçek Core rolü zorunlu</small></div>
    </aside>
    <section className="workspace-main">
      <header className="topbar"><div><span className="environment-dot" /> Respongo iç sistem alanı</div><div className="topbar-actions"><span className="control-plane-chip">OS CORE</span><ThemeToggle /></div></header>
      {children}
    </section>
  </div>;
}
