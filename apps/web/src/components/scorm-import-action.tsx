"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScormImportAction({ versionId, assetId, status }: { versionId: string; assetId: string | null; status: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!assetId || status === "published") return null;
  async function advance() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/v1/platform/assets/${assetId}/status`, { cache: "no-store" });
      const body = await response.json() as { data?: { assetVersionId: string | null; scanStatus: string | null; validationStatus: string | null; ingestionStatus: string | null; scormPublicationStatus: string | null }; error?: { code?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.code ?? "STATUS_FAILED");
      if (body.data.scanStatus !== "clean" || body.data.validationStatus !== "valid" || !body.data.assetVersionId) { setMessage(body.data.ingestionStatus === "failed" ? "Doğrulama hatası oluştu." : "Tarama veya doğrulama henüz tamamlanmadı."); return; }
      if (!body.data.scormPublicationStatus) {
        const bind = await fetch(`/api/v1/golms/scorm/courses/${versionId}/bind`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assetVersionId: body.data.assetVersionId }) });
        if (!bind.ok) throw new Error("BIND_FAILED");
        setMessage("Güvenli yayın kuyruğuna alındı.");
      } else if (body.data.scormPublicationStatus === "ready") {
        const publish = await fetch(`/api/v1/golms/scorm/courses/${versionId}/publish`, { method: "POST" });
        if (!publish.ok) throw new Error("PUBLISH_FAILED");
        setMessage("İçerik yayımlandı.");
      } else setMessage("Güvenli yayın işlemi arka planda sürüyor.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  }
  return <div className="table-action"><button className="table-link button-link" type="button" disabled={busy} onClick={advance}>{busy ? "Kontrol ediliyor…" : "Süreci sürdür"}</button>{message && <small>{message}</small>}</div>;
}
