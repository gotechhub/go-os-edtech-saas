import { requireInstant, requireTenant } from "./guards";
import type { Attempt, Enrollment, EnrollmentProgress, ProgramVersion } from "./types";

export function deriveEnrollmentProgress(enrollment: Enrollment, program: ProgramVersion, attempts: readonly Attempt[], now: string): EnrollmentProgress {
  requireTenant(program.tenantId, enrollment.tenantId);
  requireInstant(now);
  for (const attempt of attempts) {
    requireTenant(enrollment.tenantId, attempt.tenantId);
    if (attempt.enrollmentId !== enrollment.id) throw new Error("REPORT_ATTEMPT_MISMATCH");
  }

  const required = program.steps.filter((step) => step.required);
  const completed = required.filter((step) => attempts.some((attempt) => {
    if (attempt.programStepId !== step.id || attempt.completionStatus !== "complete") return false;
    return step.completionRule === "complete" || attempt.successStatus === "passed";
  }));
  const progressPercent = required.length ? Math.round((completed.length / required.length) * 100) : 100;
  const isComplete = completed.length === required.length;
  const hasStarted = attempts.length > 0;
  return {
    enrollmentId: enrollment.id,
    status: isComplete ? "completed" : hasStarted ? "in_progress" : "available",
    requiredSteps: required.length,
    completedRequiredSteps: completed.length,
    progressPercent,
    completedAt: isComplete ? new Date(requireInstant(now)).toISOString() : null,
  };
}
