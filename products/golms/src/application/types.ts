export type LocaleCode = "tr-TR" | "en-US" | string;

export interface RequestContext {
  requestId: string;
  tenantId: string;
  actorId: string;
  locale: LocaleCode;
  idempotencyKey: string;
}

export interface CreateScormDraftCommand {
  title: string;
  locale: LocaleCode;
  contentHash: string;
}

export interface CreateProgramDraftCommand {
  title: string;
  locale: LocaleCode;
  sequential: boolean;
}

export interface AddProgramStepCommand {
  programVersionId: string;
  learningObjectVersionId: string;
  position: number;
  required: boolean;
  completionRule: "complete" | "passed";
}

export interface AssignProgramCommand {
  programVersionId: string;
  learnerId: string;
  required: boolean;
  availableAt: string;
  dueAt: string | null;
}

export interface IssueScormLaunchCommand {
  enrollmentId: string;
  stepId: string;
  ticketHash: string;
}

export interface ScormLaunchTicket {
  sessionId: string;
  attemptId: string;
  standard: "scorm_1_2" | "scorm_2004_3rd" | "scorm_2004_4th";
  expiresAt: string;
}

export interface GolmsRecord {
  id: string;
  tenantId: string;
  status: string;
}

export interface ProgramSummary {
  id: string;
  title: string;
  status: string;
  version: number;
  locale: string;
  stepCount: number;
  publishedAt: string | null;
}

export interface EnrollmentSummary {
  id: string;
  programVersionId: string;
  programTitle: string;
  status: string;
  required: boolean;
  availableAt: string;
  dueAt: string | null;
  progressPercent: number;
  nextStepId: string | null;
  nextStepKind: string | null;
}

export interface ProgramReportRow {
  learnerId: string;
  enrollmentStatus: string;
  startedAt: string | null;
  completedAt: string | null;
  attemptCount: number;
  bestScore: number | null;
}

export interface ApiEnvelope<T> {
  schemaVersion: "2026-09-27";
  requestId: string;
  freshness: "live" | "cached" | "stale";
  data: T;
}

export type ApplicationErrorCode =
  | "UNAUTHENTICATED"
  | "TENANT_CONTEXT_REQUIRED"
  | "VALIDATION_FAILED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "DEPENDENCY_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class ApplicationError extends Error {
  constructor(public readonly code: ApplicationErrorCode, message: string, public readonly status: number) {
    super(message);
    this.name = "ApplicationError";
  }
}
