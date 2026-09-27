import { requireInstant, requireTenant, requireWrite } from "./guards";
import type { Assignment, CommandContext, Enrollment, ProgramVersion } from "./types";

export function assignProgram(context: CommandContext, assignment: Assignment, program: ProgramVersion): Assignment {
  requireWrite(context);
  requireTenant(context.tenantId, assignment.tenantId);
  requireTenant(context.tenantId, program.tenantId);
  if (assignment.programVersionId !== program.id || program.status !== "published") throw new Error("PUBLISHED_PROGRAM_REQUIRED");
  if (assignment.targetKind !== "user" || !assignment.targetId) throw new Error("ASSIGNMENT_TARGET_REQUIRED");
  if (assignment.status !== "draft") throw new Error("ASSIGNMENT_NOT_DRAFT");
  const available = requireInstant(assignment.availableAt);
  if (assignment.dueAt !== null && requireInstant(assignment.dueAt) <= available) throw new Error("INVALID_ASSIGNMENT_DUE_AT");
  return { ...assignment, status: "assigned", assignedBy: context.actorId, assignedAt: new Date(requireInstant(context.now)).toISOString() };
}

export function createEnrollment(context: CommandContext, enrollment: Enrollment, assignment: Assignment): Enrollment {
  requireWrite(context);
  requireTenant(context.tenantId, enrollment.tenantId);
  requireTenant(context.tenantId, assignment.tenantId);
  if (assignment.status !== "assigned" || enrollment.assignmentId !== assignment.id) throw new Error("ACTIVE_ASSIGNMENT_REQUIRED");
  if (enrollment.programVersionId !== assignment.programVersionId || enrollment.learnerId !== assignment.targetId) throw new Error("ENROLLMENT_ASSIGNMENT_MISMATCH");
  if (enrollment.status !== "available" || enrollment.startedAt || enrollment.completedAt) throw new Error("INVALID_ENROLLMENT_INITIAL_STATE");
  return enrollment;
}
