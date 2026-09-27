export type LearningObjectKind = "scorm" | "video" | "pdf" | "link" | "resource";
export type PublicationStatus = "draft" | "in_review" | "approved" | "published" | "retired" | "archived";
export type ScormStandard = "scorm_1_2" | "scorm_2004_3rd" | "scorm_2004_4th";
export type ScanStatus = "pending" | "clean" | "infected" | "failed";
export type ValidationStatus = "pending" | "valid" | "invalid";
export type AssignmentStatus = "draft" | "assigned" | "cancelled";
export type EnrollmentStatus = "available" | "in_progress" | "completed" | "failed" | "expired" | "cancelled";
export type AttemptStatus = "created" | "active" | "suspended" | "submitted" | "completed" | "failed" | "invalidated";
export type CompletionStatus = "unknown" | "incomplete" | "complete";
export type SuccessStatus = "unknown" | "passed" | "failed";
export type RuntimeEventKind = "initialized" | "progressed" | "suspended" | "submitted" | "terminated";

export interface CommandContext {
  tenantId: string;
  actorId: string;
  canWrite: boolean;
  now: string;
}

export interface ScormPackageEvidence {
  assetVersionId: string;
  packageHash: string;
  standard: ScormStandard;
  manifestIdentifier: string;
  launchPath: string;
  scanStatus: ScanStatus;
  validationStatus: ValidationStatus;
  validatedAt: string | null;
  validatorVersion: string;
  fileCount: number;
  expandedBytes: number;
}

export interface LearningObject {
  id: string;
  tenantId: string;
  kind: LearningObjectKind;
  createdBy: string;
  createdAt: string;
}

export interface LearningObjectVersion {
  id: string;
  tenantId: string;
  learningObjectId: string;
  kind: LearningObjectKind;
  version: number;
  title: string;
  locale: string;
  status: PublicationStatus;
  package: ScormPackageEvidence | null;
  contentHash: string;
  publishedAt: string | null;
  publishedBy: string | null;
}

export interface ProgramStep {
  id: string;
  tenantId: string;
  position: number;
  kind: LearningObjectKind;
  learningObjectVersionId: string;
  required: boolean;
  completionRule: "complete" | "passed";
}

export interface ProgramVersion {
  id: string;
  tenantId: string;
  programId: string;
  version: number;
  title: string;
  locale: string;
  status: PublicationStatus;
  sequential: boolean;
  steps: readonly ProgramStep[];
  publishedAt: string | null;
  publishedBy: string | null;
}

export interface Assignment {
  id: string;
  tenantId: string;
  programVersionId: string;
  targetKind: "user";
  targetId: string;
  status: AssignmentStatus;
  required: boolean;
  availableAt: string;
  dueAt: string | null;
  assignedBy: string;
  assignedAt: string;
}

export interface Enrollment {
  id: string;
  tenantId: string;
  assignmentId: string;
  programVersionId: string;
  learnerId: string;
  status: EnrollmentStatus;
  startedAt: string | null;
  completedAt: string | null;
}

export interface Attempt {
  id: string;
  tenantId: string;
  enrollmentId: string;
  programStepId: string;
  learningObjectVersionId: string;
  ordinal: number;
  status: AttemptStatus;
  completionStatus: CompletionStatus;
  successStatus: SuccessStatus;
  progress: number | null;
  scoreRaw: number | null;
  scoreScaled: number | null;
  totalDurationSeconds: number;
  ruleVersion: string;
  lastSequence: number;
  launchedAt: string;
  lastEventAt: string;
  completedAt: string | null;
}

export interface RuntimeEventInput {
  id: string;
  tenantId: string;
  attemptId: string;
  idempotencyKey: string;
  sequence: number;
  kind: RuntimeEventKind;
  occurredAt: string;
  receivedAt: string;
  completionStatus?: CompletionStatus;
  successStatus?: SuccessStatus;
  progress?: number;
  scoreRaw?: number;
  scoreScaled?: number;
  sessionDurationSeconds?: number;
  rawEvidenceHash: string;
}

export interface RuntimeEvent extends Omit<RuntimeEventInput, "completionStatus" | "successStatus" | "progress" | "scoreRaw" | "scoreScaled" | "sessionDurationSeconds"> {
  completionStatus: CompletionStatus;
  successStatus: SuccessStatus;
  progress: number | null;
  scoreRaw: number | null;
  scoreScaled: number | null;
  sessionDurationSeconds: number;
}

export interface RuntimeUpdate {
  attempt: Attempt;
  event: RuntimeEvent | null;
  duplicate: boolean;
}

export interface EnrollmentProgress {
  enrollmentId: string;
  status: EnrollmentStatus;
  requiredSteps: number;
  completedRequiredSteps: number;
  progressPercent: number;
  completedAt: string | null;
}
