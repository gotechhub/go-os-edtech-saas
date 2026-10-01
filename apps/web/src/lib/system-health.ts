export type ServiceHealthStatus = "healthy" | "degraded" | "outage" | "unknown";
export type ServiceFreshness = "live" | "stale" | "unknown";

export interface ServiceHealth {
  id: "web" | "supabase-auth" | "storage";
  label: string;
  status: ServiceHealthStatus;
  freshness: ServiceFreshness;
  observedAt: string | null;
  source: "runtime" | "http_probe" | "configuration";
  detail: string;
}

export interface SystemHealthSummary {
  status: ServiceHealthStatus;
  freshness: ServiceFreshness;
  observedAt: string;
  services: ServiceHealth[];
  healthy: number;
  attention: number;
}

const statusRank: Record<ServiceHealthStatus, number> = { healthy: 0, unknown: 1, degraded: 2, outage: 3 };

export function summarizeSystemHealth(services: ServiceHealth[], now = new Date()): SystemHealthSummary {
  const status = services.reduce<ServiceHealthStatus>((worst, item) => statusRank[item.status] > statusRank[worst] ? item.status : worst, "healthy");
  const freshness: ServiceFreshness = services.some((item) => item.freshness === "stale") ? "stale" : services.some((item) => item.freshness === "unknown") ? "unknown" : "live";
  return {
    status,
    freshness,
    observedAt: now.toISOString(),
    services,
    healthy: services.filter((item) => item.status === "healthy").length,
    attention: services.filter((item) => item.status !== "healthy").length,
  };
}

type ProbeFetch = (input: string, init?: RequestInit) => Promise<{ ok: boolean; status: number }>;

export async function probeHttpService(input: {
  id: ServiceHealth["id"];
  label: string;
  url: string;
  headers?: Record<string, string>;
  fetcher?: ProbeFetch;
  now?: Date;
}): Promise<ServiceHealth> {
  const observedAt = (input.now ?? new Date()).toISOString();
  try {
    const response = await (input.fetcher ?? fetch)(input.url, { headers: input.headers, cache: "no-store", signal: AbortSignal.timeout(2500) });
    return {
      id: input.id,
      label: input.label,
      status: response.ok ? "healthy" : response.status >= 500 ? "outage" : "degraded",
      freshness: "live",
      observedAt,
      source: "http_probe",
      detail: response.ok ? "Canlı sağlık kontrolü başarılı." : `Sağlık kontrolü HTTP ${response.status} döndürdü.`,
    };
  } catch {
    return { id: input.id, label: input.label, status: "unknown", freshness: "unknown", observedAt, source: "http_probe", detail: "Sağlık kontrolü zaman aşımına uğradı veya ulaşılamadı." };
  }
}

export async function collectSystemHealth(
  env: NodeJS.ProcessEnv = process.env,
  fetcher?: ProbeFetch,
  now = new Date(),
): Promise<SystemHealthSummary> {
  const services: ServiceHealth[] = [{
    id: "web",
    label: "Respongo web çalışma zamanı",
    status: "healthy",
    freshness: "live",
    observedAt: now.toISOString(),
    source: "runtime",
    detail: "Bu isteği işleyen uygulama çalışma zamanı yanıt veriyor.",
  }];

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  services.push(supabaseUrl && supabaseKey
    ? await probeHttpService({ id: "supabase-auth", label: "Supabase Auth", url: `${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, headers: { apikey: supabaseKey }, fetcher, now })
    : { id: "supabase-auth", label: "Supabase Auth", status: "unknown", freshness: "unknown", observedAt: null, source: "configuration", detail: "Supabase bağlantı yapılandırması eksik." });

  const storageConfigured = Boolean(env.AWS_ROLE_ARN && env.AWS_REGION && env.S3_SYSTEM_BUCKET);
  services.push({
    id: "storage",
    label: "S3 ve medya dağıtımı",
    status: "unknown",
    freshness: "unknown",
    observedAt: null,
    source: "configuration",
    detail: storageConfigured ? "Yapılandırma mevcut; canlı S3/CloudFront probe'u henüz bağlı değil." : "OIDC/S3 yapılandırması eksik.",
  });
  return summarizeSystemHealth(services, now);
}
