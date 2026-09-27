import { requireInstant, requireTenant, requireWrite } from "./guards";
import type { CommandContext, LearningObjectVersion, ProgramVersion } from "./types";

export function publishProgramVersion(context: CommandContext, program: ProgramVersion, objects: readonly LearningObjectVersion[]): ProgramVersion {
  requireWrite(context);
  requireTenant(context.tenantId, program.tenantId);
  if (!["draft", "in_review", "approved"].includes(program.status)) throw new Error("PROGRAM_NOT_PUBLISHABLE");
  if (!program.title.trim() || !program.locale.trim()) throw new Error("PROGRAM_METADATA_REQUIRED");
  if (!Number.isInteger(program.version) || program.version < 1 || !program.steps.length) throw new Error("PROGRAM_STEPS_REQUIRED");

  const objectById = new Map(objects.map((item) => [item.id, item]));
  const ids = new Set<string>();
  const positions = new Set<number>();
  for (const step of program.steps) {
    requireTenant(context.tenantId, step.tenantId);
    if (ids.has(step.id)) throw new Error("DUPLICATE_PROGRAM_STEP");
    if (!Number.isInteger(step.position) || step.position < 1 || positions.has(step.position)) throw new Error("INVALID_STEP_POSITION");
    ids.add(step.id);
    positions.add(step.position);
    const object = objectById.get(step.learningObjectVersionId);
    if (!object || object.status !== "published") throw new Error("STEP_CONTENT_NOT_PUBLISHED");
    requireTenant(context.tenantId, object.tenantId);
    if (object.kind !== step.kind) throw new Error("STEP_CONTENT_KIND_MISMATCH");
  }

  const expected = [...positions].sort((a, b) => a - b);
  if (expected.some((value, index) => value !== index + 1)) throw new Error("STEP_POSITION_GAP");
  return {
    ...program,
    steps: [...program.steps].sort((a, b) => a.position - b.position),
    status: "published",
    publishedAt: new Date(requireInstant(context.now)).toISOString(),
    publishedBy: context.actorId,
  };
}

export function assertImmutablePublishedProgram(before: ProgramVersion, after: ProgramVersion): void {
  if (before.status !== "published") return;
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("PUBLISHED_PROGRAM_IMMUTABLE");
}
