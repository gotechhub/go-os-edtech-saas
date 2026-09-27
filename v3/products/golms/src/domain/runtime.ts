import { requireHash, requireInstant, requireTenant, requireWrite } from "./guards";
import type { Attempt, CommandContext, Enrollment, LearningObjectVersion, ProgramStep, RuntimeEvent, RuntimeEventInput, RuntimeUpdate } from "./types";

const bounded = (value: number | undefined, min: number, max: number, error: string): number | null => {
  if (value === undefined) return null;
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(error);
  return value;
};

export function launchAttempt(
  context: CommandContext,
  attempt: Attempt,
  enrollment: Enrollment,
  step: ProgramStep,
  object: LearningObjectVersion,
  previousAttempts: readonly Attempt[] = [],
): Attempt {
  requireWrite(context);
  for (const item of [attempt, enrollment, step, object]) requireTenant(context.tenantId, item.tenantId);
  if (!["available", "in_progress", "failed"].includes(enrollment.status)) throw new Error("ENROLLMENT_NOT_LAUNCHABLE");
  if (step.kind !== "scorm" || object.kind !== "scorm" || object.status !== "published" || !object.package) throw new Error("PUBLISHED_SCORM_REQUIRED");
  if (step.learningObjectVersionId !== object.id || attempt.learningObjectVersionId !== object.id || attempt.programStepId !== step.id || attempt.enrollmentId !== enrollment.id) throw new Error("ATTEMPT_CONTEXT_MISMATCH");
  const maxOrdinal = previousAttempts.filter((item) => item.programStepId === step.id).reduce((max, item) => Math.max(max, item.ordinal), 0);
  if (attempt.ordinal !== maxOrdinal + 1 || attempt.status !== "created") throw new Error("INVALID_ATTEMPT_ORDINAL");
  const now = new Date(requireInstant(context.now)).toISOString();
  return { ...attempt, status: "active", launchedAt: now, lastEventAt: now };
}

export function applyRuntimeEvent(
  context: CommandContext,
  attempt: Attempt,
  input: RuntimeEventInput,
  seenIdempotencyKeys: ReadonlySet<string>,
): RuntimeUpdate {
  requireWrite(context);
  requireTenant(context.tenantId, attempt.tenantId);
  requireTenant(context.tenantId, input.tenantId);
  if (input.attemptId !== attempt.id) throw new Error("EVENT_ATTEMPT_MISMATCH");
  if (seenIdempotencyKeys.has(input.idempotencyKey)) return { attempt, event: null, duplicate: true };
  if (!Number.isInteger(input.sequence) || input.sequence !== attempt.lastSequence + 1) throw new Error("RUNTIME_EVENT_OUT_OF_ORDER");
  if (!["active", "suspended", "submitted"].includes(attempt.status)) throw new Error("ATTEMPT_NOT_ACTIVE");
  requireHash(input.rawEvidenceHash, "INVALID_RUNTIME_EVIDENCE_HASH");
  const occurred = requireInstant(input.occurredAt);
  requireInstant(input.receivedAt);
  if (occurred < requireInstant(attempt.lastEventAt)) throw new Error("RUNTIME_EVENT_TIME_REGRESSION");

  const progress = bounded(input.progress, 0, 1, "INVALID_PROGRESS") ?? attempt.progress;
  const scoreScaled = bounded(input.scoreScaled, -1, 1, "INVALID_SCALED_SCORE") ?? attempt.scoreScaled;
  const scoreRaw = input.scoreRaw === undefined ? attempt.scoreRaw : bounded(input.scoreRaw, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, "INVALID_RAW_SCORE");
  const duration = input.sessionDurationSeconds ?? 0;
  if (!Number.isFinite(duration) || duration < 0) throw new Error("INVALID_SESSION_DURATION");
  const completionStatus = input.completionStatus ?? attempt.completionStatus;
  const successStatus = input.successStatus ?? attempt.successStatus;
  const terminal = input.kind === "terminated";
  const status = terminal
    ? (successStatus === "failed" ? "failed" : "completed")
    : input.kind === "suspended" ? "suspended"
      : input.kind === "submitted" ? "submitted"
        : "active";
  const event: RuntimeEvent = {
    ...input,
    completionStatus,
    successStatus,
    progress,
    scoreRaw,
    scoreScaled,
    sessionDurationSeconds: duration,
  };
  const next: Attempt = {
    ...attempt,
    status,
    completionStatus,
    successStatus,
    progress,
    scoreRaw,
    scoreScaled,
    totalDurationSeconds: attempt.totalDurationSeconds + duration,
    lastSequence: input.sequence,
    lastEventAt: new Date(occurred).toISOString(),
    completedAt: terminal ? new Date(occurred).toISOString() : null,
  };
  return { attempt: next, event, duplicate: false };
}

export function resumeAttempt(context: CommandContext, attempt: Attempt): Attempt {
  requireWrite(context);
  requireTenant(context.tenantId, attempt.tenantId);
  if (attempt.status !== "suspended") throw new Error("SUSPENDED_ATTEMPT_REQUIRED");
  return { ...attempt, status: "active", lastEventAt: new Date(requireInstant(context.now)).toISOString() };
}
