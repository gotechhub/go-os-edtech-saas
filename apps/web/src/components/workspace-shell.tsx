import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, Clipboard, Layers } from "./icons";
import { ThemeToggle } from "./theme-toggle";

type Area = "programs" | "content" | "assignments";

export function WorkspaceShell({ children, locale, active, role }: { children: ReactNode; locale: string; active: Area; role: "admin" | "learner" }) {
  const admin = role === "admin";
  return <div className="workspace">
    <aside className="sidebar">
      <Link className="brand brand-sidebar" href={`/${locale}`}><span>R</span><strong>RESPONGO</strong><small>OS</small></Link>
      <div className="sidebar-product"><span>LEARN</span><b>GOLMS</b></div>
      <nav aria-label={admin ? "Akademi yönetimi" : "Öğrenme alanı"}>
        <p>{admin ? "AKADEMİ YÖNETİMİ" : "ÖĞRENME ALANI"}</p>
        {admin ? <>
          <Link aria-current={active === "programs" ? "page" : undefined} className={active === "programs" ? "active" : ""} href={`/${locale}/golms/admin/programlar`}><Layers /> Programlar</Link>
          <Link aria-current={active === "content" ? "page" : undefined} className={active === "content" ? "active" : ""} href={`/${locale}/golms/admin/icerikler`}><BookOpen /> İçerik kütüphanesi</Link>
          <span className="nav-disabled"><Clipboard /> Atama merkezi <small>Planlandı</small></span>
        </> : <>
          <Link aria-current={active === "assignments" ? "page" : undefined} className={active === "assignments" ? "active" : ""} href={`/${locale}/golms/ogrenen/atananlar`}><Clipboard /> Atanan eğitimler</Link>
          <span className="nav-disabled"><BookOpen /> Eğitimleri keşfet <small>Planlandı</small></span>
        </>}
      </nav>
      <div className="sidebar-foot"><span>V3 üretim</span><small>Yerel geliştirme</small></div>
    </aside>
    <section className="workspace-main">
      <header className="topbar"><div><span className="environment-dot" /> Güvenli çalışma alanı</div><div className="topbar-actions"><ThemeToggle /><span className="avatar" aria-label="Oturum kullanıcısı">R</span></div></header>
      {children}
    </section>
  </div>;
}
