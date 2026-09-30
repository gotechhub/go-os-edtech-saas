"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Phase = "idle" | "hashing" | "creating" | "uploading" | "scanning" | "publishing" | "ready" | "published" | "error";
type ProcessingStatus = { assetVersionId: string | null; scanStatus: string | null; validationStatus: string | null; ingestionStatus: string | null; ingestionErrorCode: string | null; scormPublicationStatus: string | null; standard: string | null };

const MAX_BROWSER_UPLOAD = 256 * 1024 * 1024;
const phaseText: Record<Phase, string> = {
  idle: "ZIP paketini seçin", hashing: "Dosya bütünlüğü hesaplanıyor…", creating: "İçerik kaydı hazırlanıyor…",
  uploading: "Özel depolama alanına yükleniyor…", scanning: "Güvenlik taraması ve SCORM doğrulaması bekleniyor…",
  publishing: "Paket değişmez yayın alanına hazırlanıyor…", ready: "Paket doğrulandı; yayın onayınızı bekliyor.",
  published: "İçerik yayımlandı ve programlara eklenebilir.", error: "İşlem tamamlanamadı.",
};

async function json<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as { error?: { code?: string } };
  if (!response.ok) throw new Error(body.error?.code ?? "REQUEST_FAILED");
  return body as T;
}

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function ScormUploadForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [detail, setDetail] = useState("SCORM 1.2 veya SCORM 2004 ZIP paketi yükleyebilirsiniz.");
  const [versionId, setVersionId] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [readyStandard, setReadyStandard] = useState<string | null>(null);
  const cancelled = useRef(false);
  useEffect(() => () => { cancelled.current = true; }, []);

  async function poll(asset: string, contentVersion: string) {
    for (let attempt = 0; attempt < 90 && !cancelled.current; attempt += 1) {
      const response = await fetch(`/api/v1/platform/assets/${asset}/status`, { cache: "no-store" });
      const result = await json<{ data: ProcessingStatus }>(response);
      const status = result.data;
      if (status.scanStatus === "infected" || status.validationStatus === "invalid" || status.ingestionStatus === "rejected") throw new Error(status.ingestionErrorCode ?? "PACKAGE_REJECTED");
      if (status.ingestionStatus === "failed") throw new Error(status.ingestionErrorCode ?? "INGESTION_FAILED");
      if (status.scanStatus === "clean" && status.validationStatus === "valid" && status.assetVersionId) {
        if (!status.scormPublicationStatus) {
          await json(await fetch(`/api/v1/golms/scorm/courses/${contentVersion}/bind`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assetVersionId: status.assetVersionId }) }));
          setPhase("publishing");
          setDetail("Doğrulanan dosyalar güvenli oynatıcı alanına aktarılıyor.");
        } else if (status.scormPublicationStatus === "ready") {
          setReadyStandard(status.standard);
          setPhase("ready");
          setDetail(`${status.standard ?? "SCORM"} paketi tarandı, doğrulandı ve yayın alanına alındı.`);
          router.refresh();
          return;
        } else if (status.scormPublicationStatus === "failed") throw new Error("PUBLICATION_FAILED");
      }
      await wait(4000);
    }
    if (!cancelled.current) {
      setPhase("scanning");
      setDetail("İşlem arka planda sürüyor. Bu sayfadan ayrılsanız da kayıt korunur; içerik kütüphanesinden yeniden kontrol edebilirsiniz.");
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cancelled.current = false;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const file = form.get("package");
    const rightsConfirmed = form.get("rights") === "on";
    if (!title || !(file instanceof File) || file.size === 0 || !rightsConfirmed) { setPhase("error"); setDetail("Eğitim adı, ZIP dosyası ve kullanım hakkı beyanı zorunludur."); return; }
    if (!file.name.toLowerCase().endsWith(".zip") || !["application/zip", "application/x-zip-compressed", ""].includes(file.type)) { setPhase("error"); setDetail("Yalnızca ZIP uzantılı SCORM paketi kabul edilir."); return; }
    if (file.size > MAX_BROWSER_UPLOAD) { setPhase("error"); setDetail("Web yüklemesi şu anda en fazla 256 MB destekliyor. Daha büyük paketler için çok parçalı yükleme akışı eklenecek."); return; }
    try {
      setPhase("hashing"); setDetail("Dosya sunucuya gitmeden önce SHA-256 özeti hazırlanıyor.");
      const contentHash = await sha256(file);
      setPhase("creating");
      const draft = await json<{ data: { id: string } }>(await fetch("/api/v1/golms/scorm/courses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, locale: locale === "tr" ? "tr-TR" : "en-US", contentHash }) }));
      setVersionId(draft.data.id);
      const intent = await json<{ data: { assetId: string; uploadUrl: string; requiredHeaders: Record<string, string> } }>(await fetch("/api/v1/platform/assets/upload-intents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename: file.name, mimeType: "application/zip", sizeBytes: file.size, sha256: contentHash, purpose: "golms-learning-content" }) }));
      setAssetId(intent.data.assetId);
      await json(await fetch(`/api/v1/golms/scorm/courses/${draft.data.id}/import`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assetId: intent.data.assetId }) }));
      setPhase("uploading"); setDetail(`${(file.size / 1024 / 1024).toFixed(1)} MB paket özel alana aktarılıyor.`);
      const upload = await fetch(intent.data.uploadUrl, { method: "PUT", headers: intent.data.requiredHeaders, body: file });
      if (!upload.ok) throw new Error("S3_UPLOAD_FAILED");
      await json(await fetch(`/api/v1/platform/assets/${intent.data.assetId}/complete`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rightsConfirmed: true }) }));
      setPhase("scanning"); setDetail("Yükleme tamamlandı. Paket güvenlik taraması ve manifest doğrulaması kuyruğunda.");
      router.refresh();
      await poll(intent.data.assetId, draft.data.id);
    } catch (error) {
      setPhase("error");
      setDetail(`İşlem durduruldu: ${error instanceof Error ? error.message : "UNKNOWN_ERROR"}. Oluşturulan kayıtlar denetim için korunur.`);
      router.refresh();
    }
  }

  async function publish() {
    if (!versionId) return;
    try {
      await json(await fetch(`/api/v1/golms/scorm/courses/${versionId}/publish`, { method: "POST" }));
      setPhase("published"); setDetail(`${readyStandard ?? "SCORM"} içeriği yayımlandı. Artık eğitim programına adım olarak eklenebilir.`); router.refresh();
    } catch (error) { setPhase("error"); setDetail(`Yayın tamamlanamadı: ${error instanceof Error ? error.message : "UNKNOWN_ERROR"}.`); }
  }

  const busy = !["idle", "ready", "published", "error"].includes(phase);
  return <section className="upload-panel" aria-labelledby="scorm-upload-title">
    <div className="form-panel-heading"><div><span>GÜVENLİ İÇE AKTARMA</span><h2 id="scorm-upload-title">SCORM ZIP yükle</h2><p>Dosya karantinaya alınır; zararlı yazılım ve manifest kontrolü geçmeden oynatıcıya veya programa açılamaz.</p></div><span className={`status upload-status upload-status-${phase}`}>{phaseText[phase]}</span></div>
    <form className="upload-form" onSubmit={submit}>
      <label className="field"><span>Eğitim adı</span><input name="title" maxLength={180} required placeholder="Örn. Bilgi Güvenliği Farkındalığı" disabled={busy} /></label>
      <label className="field"><span>SCORM ZIP paketi</span><input name="package" type="file" accept=".zip,application/zip" required disabled={busy} /><small>Web arayüzü limiti 256 MB. Dosya türü paketin içinden ayrıca doğrulanır.</small></label>
      <label className="choice-card field-wide"><input name="rights" type="checkbox" required disabled={busy} /><span><b>Bu içeriği yükleme ve kurum içinde kullanma hakkına sahibim.</b><small>Beyan, kullanıcı ve zaman bilgisiyle denetim kaydına yazılır.</small></span></label>
      <div className="upload-progress" aria-live="polite"><span className="upload-progress-dot" /><div><strong>{phaseText[phase]}</strong><p>{detail}</p>{assetId && <small>İşlem kimliği: {assetId}</small>}</div></div>
      <div className="form-actions">{phase === "ready" ? <button className="primary-button" type="button" onClick={publish}>İçeriği yayımla</button> : phase === "published" ? <button className="secondary-button" type="button" onClick={() => window.location.reload()}>Yeni içerik yükle</button> : <button className="primary-button" type="submit" disabled={busy}>{busy ? "İşlem sürüyor…" : "Güvenli yüklemeyi başlat"}</button>}</div>
    </form>
  </section>;
}
