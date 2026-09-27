import { describe, expect, it, vi } from "vitest";
import { ApplicationError, GolmsApplicationService, type GolmsGateway, type RequestContext } from "../src/application";

const context: RequestContext = { requestId: "req-1", tenantId: "92000000-0000-4000-8000-000000000001", actorId: "91000000-0000-4000-8000-000000000001", locale: "tr-TR", idempotencyKey: "idem-1" };
const record = { id: "94000000-0000-4000-8000-000000000001", tenantId: context.tenantId, status: "draft" };
const gateway = (): GolmsGateway => ({
  createScormDraft: vi.fn(async () => record), publishLearningObject: vi.fn(async () => record), createProgramDraft: vi.fn(async () => record),
  addProgramStep: vi.fn(async () => record), publishProgram: vi.fn(async () => record), assignProgram: vi.fn(async () => record),
  listPrograms: vi.fn(async () => []), listMyEnrollments: vi.fn(async () => []),
});

describe("GOLMS application boundary", () => {
  it("normalizes input and returns a versioned response envelope", async () => {
    const port = gateway();
    const result = await new GolmsApplicationService(port).createProgramDraft(context, { title: "  Zorunlu Eğitim  ", locale: "tr-TR", sequential: true });
    expect(port.createProgramDraft).toHaveBeenCalledWith(context, { title: "Zorunlu Eğitim", locale: "tr-TR", sequential: true });
    expect(result).toMatchObject({ schemaVersion: "2026-09-27", requestId: "req-1", freshness: "live", data: record });
  });

  it("rejects malformed identifiers before the infrastructure call", async () => {
    const port = gateway();
    await expect(new GolmsApplicationService(port).publishProgram(context, "not-a-uuid")).rejects.toBeInstanceOf(ApplicationError);
    expect(port.publishProgram).not.toHaveBeenCalled();
  });

  it("rejects a due date that is not after availability", async () => {
    const service = new GolmsApplicationService(gateway());
    await expect(service.assignProgram(context, { programVersionId: record.id, learnerId: "91000000-0000-4000-8000-000000000002", required: true, availableAt: "2026-09-28T10:00:00Z", dueAt: "2026-09-28T09:00:00Z" })).rejects.toThrow("INVALID_ASSIGNMENT_DUE_AT");
  });
});
