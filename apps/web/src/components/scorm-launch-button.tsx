"use client";

import { useState } from "react";

export function ScormLaunchButton({ enrollmentId, stepId, label }: { enrollmentId: string; stepId: string | null; label: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const disabled = !stepId || state === "loading";
  async function launch() {
    if (!stepId) return;
    setState("loading");
    try {
      const response = await fetch("/api/v1/golms/scorm/launch", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ enrollmentId, stepId }) });
      const payload = await response.json() as { data?: { sessionId?: string; exchangeUrl?: string; ticket?: string }; error?: { code?: string } };
      if (!response.ok || !payload.data?.sessionId || !payload.data.exchangeUrl || !payload.data.ticket) throw new Error(payload.error?.code ?? "LAUNCH_FAILED");
      const form = document.createElement("form");
      form.method = "POST"; form.action = payload.data.exchangeUrl; form.style.display = "none";
      for (const [name, value] of Object.entries({ sessionId: payload.data.sessionId, ticket: payload.data.ticket })) {
        const input = document.createElement("input"); input.type = "hidden"; input.name = name; input.value = value; form.appendChild(input);
      }
      document.body.appendChild(form); form.submit();
    } catch { setState("error"); }
  }
  return <div className="launch-action"><button className="primary-button" type="button" disabled={disabled} onClick={launch}>{state === "loading" ? "Hazırlanıyor…" : label}</button>{state === "error" && <span role="alert">Eğitim başlatılamadı. Lütfen yeniden deneyin.</span>}</div>;
}
