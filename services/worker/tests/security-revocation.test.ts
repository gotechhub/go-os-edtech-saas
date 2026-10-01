import { describe, expect, it, vi } from "vitest";
import { runNextSecurityRevocation, type SecurityRevocationJob } from "../src/security-revocation";

const job: SecurityRevocationJob = {
  id: "revocation-1",
  tenantId: "tenant-a",
  incidentId: "incident-1",
  targetType: "user_session",
  targetReference: "session-reference-1",
};

describe("security revocation worker", () => {
  it("executes and acknowledges one leased revocation", async () => {
    const repository = { claim: vi.fn().mockResolvedValue(job), succeed: vi.fn(), fail: vi.fn() };
    const executor = { revoke: vi.fn().mockResolvedValue(undefined) };
    await expect(runNextSecurityRevocation("worker-1", repository, executor)).resolves.toEqual({ outcome: "succeeded", revocationId: job.id });
    expect(executor.revoke).toHaveBeenCalledWith(job);
    expect(repository.succeed).toHaveBeenCalledWith(job);
  });

  it("records only a stable error class when a provider fails", async () => {
    const repository = { claim: vi.fn().mockResolvedValue(job), succeed: vi.fn(), fail: vi.fn() };
    const executor = { revoke: vi.fn().mockRejectedValue(new Error("provider returned secret details")) };
    const result = await runNextSecurityRevocation("worker-1", repository, executor);
    expect(result).toEqual({ outcome: "failed", revocationId: job.id, errorCode: "REVOCATION_PROVIDER_FAILED" });
    expect(repository.fail).toHaveBeenCalledWith(job, "REVOCATION_PROVIDER_FAILED");
    expect(JSON.stringify(result)).not.toContain("secret details");
  });

  it("does not call a provider when the queue is empty", async () => {
    const repository = { claim: vi.fn().mockResolvedValue(null), succeed: vi.fn(), fail: vi.fn() };
    const executor = { revoke: vi.fn() };
    await expect(runNextSecurityRevocation("worker-1", repository, executor)).resolves.toEqual({ outcome: "idle" });
    expect(executor.revoke).not.toHaveBeenCalled();
  });
});
