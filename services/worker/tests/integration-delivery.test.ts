import { describe, expect, it, vi } from "vitest";
import { runNextIntegrationDelivery, type IntegrationDeliveryJob } from "../src/integration-delivery";

const job: IntegrationDeliveryJob = {
  id: "delivery-1",
  tenantId: "tenant-a",
  connectorId: "connector-a",
  providerKey: "msteams",
  capability: "webhook.delivery",
  endpointReference: "endpoint/tenant-a/teams",
  secretReference: "vault/tenant-a/teams",
  eventType: "golms.assignment.created",
  eventPayload: { assignmentId: "assignment-1" },
  eventIdempotencyKey: "event-key-0001",
  attemptNumber: 1,
};

function setup(status = 204, url = "https://hooks.example.test/tenant-a") {
  const repository = {
    claim: vi.fn().mockResolvedValue(job),
    succeed: vi.fn().mockResolvedValue(undefined),
    fail: vi.fn().mockResolvedValue(undefined),
  };
  const targets = { resolve: vi.fn().mockResolvedValue({ url, headers: { authorization: "Bearer secret" } }) };
  const http = { post: vi.fn().mockResolvedValue({ status }) };
  return { repository, targets, http };
}

describe("integration delivery worker", () => {
  it("delivers one HTTPS event with a stable event id and no redirects", async () => {
    const deps = setup();
    const result = await runNextIntegrationDelivery("worker-1", deps.repository, deps.targets, deps.http);
    expect(result).toEqual({ outcome: "succeeded", deliveryId: job.id, responseCode: 204 });
    expect(deps.http.post).toHaveBeenCalledWith(expect.objectContaining({
      followRedirects: false,
      timeoutMs: 10_000,
      headers: expect.objectContaining({ "x-respongo-event-id": job.eventIdempotencyKey }),
    }));
    expect(deps.repository.succeed).toHaveBeenCalledWith(job, 204);
  });

  it("rejects insecure or credential-bearing target URLs before sending", async () => {
    for (const url of ["http://hooks.example.test/a", "https://user:pass@hooks.example.test/a"]) {
      const deps = setup(204, url);
      const result = await runNextIntegrationDelivery("worker-1", deps.repository, deps.targets, deps.http);
      expect(result).toMatchObject({ outcome: "failed", errorCode: "CONNECTOR_TARGET_INVALID" });
      expect(deps.http.post).not.toHaveBeenCalled();
    }
  });

  it("classifies provider throttling without persisting response content", async () => {
    const deps = setup(429);
    const result = await runNextIntegrationDelivery("worker-1", deps.repository, deps.targets, deps.http);
    expect(result).toEqual({ outcome: "failed", deliveryId: job.id, errorCode: "CONNECTOR_RATE_LIMITED", responseCode: 429 });
    expect(deps.repository.fail).toHaveBeenCalledWith(job, "CONNECTOR_RATE_LIMITED", 429);
  });

  it("returns idle without resolving secrets when the queue is empty", async () => {
    const deps = setup();
    deps.repository.claim.mockResolvedValue(null);
    await expect(runNextIntegrationDelivery("worker-1", deps.repository, deps.targets, deps.http)).resolves.toEqual({ outcome: "idle" });
    expect(deps.targets.resolve).not.toHaveBeenCalled();
  });
});
