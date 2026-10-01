import type { Metadata } from "next";
import { DataState } from "@/components/data-state";
import { InternalShell } from "@/components/internal-shell";
import { loadOsCoreAccess } from "@/lib/internal-access";
import { collectSystemHealth } from "@/lib/system-health";
import { loadPortalInventory } from "@/lib/portal-inventory";
import { loadReleaseOverview } from "@/lib/release-overview";
import { loadJobOperations } from "@/lib/job-operations";

export const metadata: Metadata = { title: "Respongo OS Core" };

const stateCopy = {
  unconfigured: ["Platform bağlantısı bekleniyor", "Supabase ortamı yapılandırılmadan OS Core yetkileri doğrulanamaz."],
  unauthenticated: ["Ayrıcalıklı giriş gerekli", "Respongo teknik operatör hesabınızla güvenli giriş yapın."],
  mfa_required: ["Çok faktörlü doğrulama gerekli", "OS Core erişimi için oturum güvence seviyesini MFA ile yükseltin."],
  forbidden: ["OS Core yetkiniz yok", "Müşteri, ürün veya Super Admin rolü bu teknik alana erişim sağlamaz."],
  migration_required: ["OS Core şeması henüz yayımlanmadı", "İç kontrol düzlemleri migration'ı hosted Supabase ortamında doğrulanmalıdır."],
  error: ["Yetki durumu alınamadı", "Kimlik veya platform servisi geçici olarak yanıt vermiyor."],
} as const;

const modules = [
  ["Sistem komuta merkezi", "Servis sağlığı, SLO, kritik olaylar ve sıradaki operasyon işi", "core.system.manage"],
  ["Güvenlik ve audit", "Olay müdahalesi, oturum iptali ve değişmez işlem izi", "core.security.manage"],
  ["Sürüm ve migration", "Yayın matrisi, pilot rollout, geri alma ve özellik bayrakları", "core.release.manage"],
  ["Altyapı ve depolama", "Vercel, Supabase, S3, CloudFront, kapasite ve bölge görünümü", "core.infrastructure.manage"],
  ["İş ve entegrasyon kuyruğu", "Worker, dead-letter, webhook ve güvenli yeniden oynatma", "core.jobs.manage"],
  ["Veri yönetişimi", "Saklama, silme, yedek, geri yükleme ve taşınabilirlik", "core.data.manage"],
] as const;

export default async function OsCorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const access = await loadOsCoreAccess();
  const health = access.state === "ready" && access.permissions.includes("core.read") ? await collectSystemHealth() : null;
  const inventory = access.state === "ready" && access.permissions.includes("core.read") ? await loadPortalInventory() : null;
  const releaseOverview = access.state === "ready" && access.permissions.includes("core.read") ? await loadReleaseOverview() : null;
  const jobOperations = access.state === "ready" && access.permissions.includes("core.read") ? await loadJobOperations() : null;
  return <InternalShell locale={locale}><main className="content-page">
    <div className="page-heading"><div><span className="eyebrow">RESPONGO İÇ TEKNİK İŞLETİM</span><h1>Sistem komuta merkezi</h1><p>Platform sağlığı, güvenlik, sürüm, altyapı ve sağlayıcı operasyonları için ayrıcalıklı çalışma alanı.</p></div></div>
    {access.state !== "ready" ? <DataState title={stateCopy[access.state][0]} message={stateCopy[access.state][1]} /> : <>
      <section className="metric-strip core-metrics" aria-label="OS Core erişim özeti">
        <article><span>Etkin Core rolü</span><strong>{access.roles.length}</strong></article>
        <article><span>İzin kapsamı</span><strong>{access.permissions.length}</strong></article>
        <article><span>Güvence seviyesi</span><strong>AAL2</strong></article>
      </section>
      <div className="inline-alert core-security-note" role="status"><strong>Gerçek yetki doğrulandı</strong><span>Bu görünüm tenant veya Super Admin rolünden üretilemez. Her ayrıcalıklı komut ayrıca gerekçe ve audit gerektirir.</span></div>
      {health ? <section className="data-panel health-panel" aria-labelledby="health-title"><div className="panel-heading"><div><h2 id="health-title">Platform sağlık görünümü</h2><p>Canlı olmayan veya doğrulanamayan kaynaklar açıkça işaretlenir.</p></div><span>Son gözlem: {new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(health.observedAt))}</span></div><div className="health-grid">{health.services.map((service) => <article key={service.id}><div><span className={`health-dot health-${service.status}`} /><strong>{service.label}</strong></div><b>{service.status === "healthy" ? "Sağlıklı" : service.status === "degraded" ? "Dikkat" : service.status === "outage" ? "Kesinti" : "Doğrulanamadı"}</b><p>{service.detail}</p><small>{service.freshness === "live" ? "Canlı gözlem" : service.freshness === "stale" ? "Eski veri" : "Tazelik bilinmiyor"}</small></article>)}</div></section> : null}
      {inventory?.state === "ready" ? <section className="data-panel inventory-panel" aria-labelledby="inventory-title"><div className="panel-heading"><div><h2 id="inventory-title">Tenant ve portal teknik envanteri</h2><p>Müşteri içeriği ve kullanıcı kayıtları bu projeksiyona alınmaz.</p></div><span>{inventory.items.length} portal</span></div><div className="responsive-table"><table><thead><tr><th>Tenant / portal</th><th>Tür</th><th>Durum</th><th>Bölge</th><th>Teknik kapsam</th></tr></thead><tbody>{inventory.items.map(item=><tr key={item.portal_id}><td><strong>{item.tenant_name}</strong><small>{item.tenant_id} · {item.portal_slug}</small></td><td>{item.tenant_mode==="internal_demo"?"İç demo":"Müşteri"}</td><td><span className={`status ${item.portal_status==="active"?"status-published":"status-draft"}`}>{item.portal_status}</span></td><td>{item.region??"Atanmadı"}</td><td><strong>{item.entitlement_count} ürün hakkı</strong><small>{item.industry_key} · {item.default_locale}</small></td></tr>)}</tbody></table></div></section> : inventory ? <div className="inline-alert" role="status"><strong>Teknik envanter hazır değil</strong><span>{inventory.state==="migration_required"?"Inventory migration hosted ortamda uygulanmalıdır.":"Teknik envanter şu anda alınamıyor."}</span></div> : null}
      {releaseOverview?.state==="ready"?<section className="data-panel release-panel" aria-labelledby="release-title"><div className="panel-heading"><div><h2 id="release-title">Sürüm ve rollout matrisi</h2><p>Pilot, global yayın, rollback ve özellik bayrağı kayıtları.</p></div><span>{releaseOverview.releases.length} sürüm · {releaseOverview.flags.length} bayrak</span></div>{releaseOverview.releases.length?<div className="responsive-table"><table><thead><tr><th>Bileşen</th><th>Sürüm</th><th>Release</th><th>Rollout</th><th>Kapsam</th></tr></thead><tbody>{releaseOverview.releases.map((row,index)=><tr key={`${row.release_id}-${row.rollout_id??index}`}><td><strong>{row.component}</strong><small>{row.git_sha}</small></td><td>{row.version}</td><td>{row.release_status}</td><td>{row.rollout_status??"Başlatılmadı"}</td><td>{row.rollout_scope??"—"}{row.tenant_id?<small>{row.tenant_id}</small>:null}</td></tr>)}</tbody></table></div>:<div className="compact-empty"><strong>Henüz kayıtlı release yok</strong><span>İmzalı artifact kaydı ve iki kişili onaydan sonra pilot rollout burada görünür.</span></div>}</section>:releaseOverview?<div className="inline-alert" role="status"><strong>Sürüm matrisi hazır değil</strong><span>{releaseOverview.state==="migration_required"?"Release migration hosted ortamda uygulanmalıdır.":"Sürüm bilgisi şu anda alınamıyor."}</span></div>:null}
      {jobOperations?.state === "ready" ? <section className="data-panel jobs-panel" aria-labelledby="jobs-title"><div className="panel-heading"><div><h2 id="jobs-title">İş kuyruğu operasyon görünümü</h2><p>İçerik payload'ı ve dosya yolu olmadan worker, lease ve hata durumu.</p></div><span>{jobOperations.jobs.length} iş · {jobOperations.jobs.filter((job) => job.job_status === "failed" || job.lease_state === "expired").length} müdahale bekliyor</span></div>{jobOperations.jobs.length ? <div className="responsive-table"><table><thead><tr><th>İş</th><th>Tenant</th><th>Durum</th><th>Deneme</th><th>Lease / hata</th></tr></thead><tbody>{jobOperations.jobs.map((job) => <tr key={job.job_id}><td><strong>{job.job_type === "scorm_ingestion" ? "SCORM doğrulama" : job.job_type === "scorm_publication" ? "SCORM yayın" : job.job_type}</strong><small>{job.job_id}</small></td><td>{job.tenant_id}</td><td><span className={`status ${job.job_status === "succeeded" ? "status-published" : job.job_status === "failed" || job.lease_state === "expired" ? "status-draft" : ""}`}>{job.job_status}</span></td><td>{job.attempt_count}</td><td>{job.lease_state === "expired" ? "Lease süresi doldu" : job.lease_state === "active" ? "Worker çalışıyor" : "Lease yok"}<small>{job.error_code ?? "Hata kodu yok"}</small></td></tr>)}</tbody></table></div> : <div className="compact-empty"><strong>Kuyruk boş</strong><span>Bekleyen, çalışan veya hatalı arka plan işi bulunmuyor.</span></div>}</section> : jobOperations ? <div className="inline-alert" role="status"><strong>İş kuyruğu görünümü hazır değil</strong><span>{jobOperations.state === "migration_required" ? "Job operations migration hosted ortamda uygulanmalıdır." : "İş kuyruğu bilgisi şu anda alınamıyor."}</span></div> : null}
      <section className="core-module-grid" aria-label="OS Core modülleri">{modules.map(([title, description, permission]) => {
        const enabled = access.permissions.includes(permission);
        return <article key={permission} className="core-module-card"><div><span className={`status ${enabled ? "status-published" : "status-draft"}`}>{enabled ? "Yetki hazır" : "Rol kapsamı dışında"}</span><h2>{title}</h2><p>{description}</p></div><small>{permission}</small></article>;
      })}</section>
    </>}
  </main></InternalShell>;
}
