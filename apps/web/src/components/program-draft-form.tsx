"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SubmitState = "idle" | "submitting" | "error";

const errorCopy: Record<string, string> = {
  UNAUTHENTICATED: "Program oluşturmak için kurum hesabınızla giriş yapın.",
  TENANT_CONTEXT_REQUIRED: "Devam etmek için çalışacağınız kurumu seçin.",
  FORBIDDEN: "Bu işlem için öğrenme yöneticisi veya kurum yöneticisi yetkisi gerekir.",
  VALIDATION_FAILED: "Program bilgilerini kontrol edip yeniden deneyin.",
  DEPENDENCY_UNAVAILABLE: "Veri servisine şu anda ulaşılamıyor. Biraz sonra yeniden deneyin.",
  INTERNAL_ERROR: "Program kaydedilemedi. İşlem kimliğiyle destek ekibine başvurabilirsiniz."
};

export function ProgramDraftForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/v1/golms/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: String(form.get("title") ?? ""), locale: String(form.get("locale") ?? "tr-TR"), sequential: form.get("sequential") === "on" })
      });
      const body = await response.json() as { requestId?: string; error?: { code?: string } };
      if (!response.ok) {
        const code = body.error?.code ?? "INTERNAL_ERROR";
        const requestNote = body.requestId ? ` İşlem kimliği: ${body.requestId}` : "";
        throw new Error(`${errorCopy[code] ?? errorCopy.INTERNAL_ERROR}${requestNote}`);
      }
      router.push(`/${locale}/golms/admin/programlar?created=1`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : errorCopy.INTERNAL_ERROR);
    }
  }

  return <form className="program-form" onSubmit={submit}>
    <section className="form-panel" aria-labelledby="program-identity-title">
      <div className="form-panel-heading"><div><span>1 · PROGRAM KİMLİĞİ</span><h2 id="program-identity-title">Temel bilgiler</h2><p>Program önce taslak oluşturulur; içerik adımları daha sonra sürüme eklenir.</p></div><span className="status status-draft">Taslak</span></div>
      <div className="field-grid">
        <label className="field field-wide"><span>Program adı</span><input name="title" type="text" required minLength={3} maxLength={180} autoComplete="off" placeholder="Örn. Bilgi Güvenliği ve KVKK Programı" /></label>
        <label className="field"><span>Varsayılan dil</span><select name="locale" defaultValue={locale === "en" ? "en-US" : "tr-TR"}><option value="tr-TR">Türkçe (TR)</option><option value="en-US">English (EN)</option></select><small>Ek diller sürüm ve lisans yönetimiyle açılır.</small></label>
        <label className="choice-card"><input name="sequential" type="checkbox" defaultChecked /><span><b>Sıralı ilerleme</b><small>Öğrenen bir adımı tamamlamadan sonraki adıma geçemez.</small></span></label>
      </div>
    </section>
    <section className="builder-preview" aria-labelledby="next-stage-title"><span>2 · SONRAKİ AŞAMA</span><h2 id="next-stage-title">İçerik akışı</h2><p>Taslak kaydedildikten sonra SCORM, sınav, anket, görev ve kaynak ekleyip adımları sıralayabileceksiniz.</p><div className="content-type-row" aria-label="Desteklenen içerik türleri"><span>SCORM</span><span>Sınav</span><span>Anket</span><span>Görev</span><span>Kaynak</span></div></section>
    {state === "error" && <div className="inline-alert inline-alert-error" role="alert"><strong>Program oluşturulamadı</strong><span>{message}</span></div>}
    <div className="form-actions"><button className="primary-button" type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Taslak kaydediliyor…" : "Taslağı oluştur"}</button></div>
  </form>;
}
