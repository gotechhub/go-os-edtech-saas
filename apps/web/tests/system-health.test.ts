import { describe, expect, it } from "vitest";
import { collectSystemHealth, probeHttpService, summarizeSystemHealth } from "../src/lib/system-health";

const NOW = new Date("2026-10-01T08:00:00.000Z");

describe("OS Core system health projection", () => {
  it("never represents missing provider evidence as healthy", async () => {
    const summary = await collectSystemHealth({}, undefined, NOW);
    expect(summary.services.find((item) => item.id === "supabase-auth")).toMatchObject({ status: "unknown", freshness: "unknown", observedAt: null });
    expect(summary.services.find((item) => item.id === "storage")).toMatchObject({ status: "unknown", freshness: "unknown", observedAt: null });
    expect(summary).toMatchObject({ status: "unknown", freshness: "unknown", healthy: 1, attention: 2 });
  });

  it("maps live HTTP results without hiding provider failures", async () => {
    const healthy = await probeHttpService({ id: "supabase-auth", label: "Supabase", url: "https://example.test/health", now: NOW, fetcher: async () => ({ ok: true, status: 200 }) });
    const outage = await probeHttpService({ id: "supabase-auth", label: "Supabase", url: "https://example.test/health", now: NOW, fetcher: async () => ({ ok: false, status: 503 }) });
    expect(healthy).toMatchObject({ status: "healthy", freshness: "live", source: "http_probe" });
    expect(outage).toMatchObject({ status: "outage", freshness: "live", source: "http_probe" });
  });

  it("makes stale or unknown evidence visible in the aggregate", () => {
    const summary = summarizeSystemHealth([
      { id: "web", label: "Web", status: "healthy", freshness: "live", observedAt: NOW.toISOString(), source: "runtime", detail: "ok" },
      { id: "storage", label: "Storage", status: "degraded", freshness: "stale", observedAt: NOW.toISOString(), source: "configuration", detail: "late" },
    ], NOW);
    expect(summary).toMatchObject({ status: "degraded", freshness: "stale", healthy: 1, attention: 1 });
  });
});
