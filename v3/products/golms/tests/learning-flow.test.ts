import { describe, expect, it } from "vitest";
import { applyRuntimeEvent, assertImmutablePublishedProgram, assertImmutablePublishedVersion, assignProgram, createEnrollment, deriveEnrollmentProgress, launchAttempt, publishLearningObjectVersion, publishProgramVersion, resumeAttempt } from "../src/domain";
import type { Assignment, Attempt, CommandContext, Enrollment, LearningObjectVersion, ProgramVersion, RuntimeEventInput } from "../src/domain";

const HASH = "a".repeat(64);
const RAW_HASH = "b".repeat(64);
const NOW = "2026-09-27T12:00:00.000Z";
const context = (changes: Partial<CommandContext> = {}): CommandContext => ({ tenantId: "tenant-a", actorId: "admin-a", canWrite: true, now: NOW, ...changes });
const draftCourse = (changes: Partial<LearningObjectVersion> = {}): LearningObjectVersion => ({
  id: "course-version-a1", tenantId: "tenant-a", learningObjectId: "course-a", kind: "scorm", version: 1, title: "SCORM Güvenlik Eğitimi", locale: "tr-TR",
  status: "approved", contentHash: HASH, publishedAt: null, publishedBy: null,
  package: { assetVersionId: "asset-a1", packageHash: HASH, standard: "scorm_2004_4th", manifestIdentifier: "MANIFEST-A", launchPath: "index.html", scanStatus: "clean", validationStatus: "valid", validatedAt: NOW, validatorVersion: "validator-1", fileCount: 24, expandedBytes: 120000 },
  ...changes,
});
const draftProgram = (courseId = "course-version-a1", changes: Partial<ProgramVersion> = {}): ProgramVersion => ({
  id: "program-version-a1", tenantId: "tenant-a", programId: "program-a", version: 1, title: "Zorunlu Güvenlik Programı", locale: "tr-TR", status: "approved", sequential: true,
  steps: [{ id: "step-a1", tenantId: "tenant-a", position: 1, kind: "scorm", learningObjectVersionId: courseId, required: true, completionRule: "passed" }],
  publishedAt: null, publishedBy: null, ...changes,
});
const draftAssignment = (changes: Partial<Assignment> = {}): Assignment => ({
  id: "assignment-a1", tenantId: "tenant-a", programVersionId: "program-version-a1", targetKind: "user", targetId: "learner-a", status: "draft", required: true,
  availableAt: NOW, dueAt: "2026-10-15T12:00:00.000Z", assignedBy: "", assignedAt: "", ...changes,
});
const enrollment = (changes: Partial<Enrollment> = {}): Enrollment => ({
  id: "enrollment-a1", tenantId: "tenant-a", assignmentId: "assignment-a1", programVersionId: "program-version-a1", learnerId: "learner-a", status: "available", startedAt: null, completedAt: null, ...changes,
});
const attempt = (changes: Partial<Attempt> = {}): Attempt => ({
  id: "attempt-a1", tenantId: "tenant-a", enrollmentId: "enrollment-a1", programStepId: "step-a1", learningObjectVersionId: "course-version-a1", ordinal: 1,
  status: "created", completionStatus: "unknown", successStatus: "unknown", progress: null, scoreRaw: null, scoreScaled: null, totalDurationSeconds: 0,
  ruleVersion: "scorm-normalizer-1", lastSequence: 0, launchedAt: NOW, lastEventAt: NOW, completedAt: null, ...changes,
});
const event = (changes: Partial<RuntimeEventInput> = {}): RuntimeEventInput => ({
  id: "event-a1", tenantId: "tenant-a", attemptId: "attempt-a1", idempotencyKey: "idem-a1", sequence: 1, kind: "initialized", occurredAt: "2026-09-27T12:01:00.000Z", receivedAt: "2026-09-27T12:01:01.000Z", rawEvidenceHash: RAW_HASH, ...changes,
});

describe("GOLMS content and program publishing", () => {
  it("publishes only a clean and validated SCORM package", () => {
    const published = publishLearningObjectVersion(context(), draftCourse());
    expect(published).toMatchObject({ status: "published", publishedBy: "admin-a", publishedAt: NOW });
    expect(() => publishLearningObjectVersion(context(), draftCourse({ package: { ...draftCourse().package!, scanStatus: "pending" } }))).toThrow("PACKAGE_NOT_CLEAN");
    expect(() => publishLearningObjectVersion(context(), draftCourse({ package: { ...draftCourse().package!, launchPath: "../secret.html" } }))).toThrow("UNSAFE_LAUNCH_PATH");
  });

  it("publishes a gap-free program only with published content", () => {
    const course = publishLearningObjectVersion(context(), draftCourse());
    const program = publishProgramVersion(context(), draftProgram(), [course]);
    expect(program.status).toBe("published");
    expect(() => publishProgramVersion(context(), draftProgram("course-version-a1", { steps: [{ ...draftProgram().steps[0], position: 2 }] }), [course])).toThrow("STEP_POSITION_GAP");
    expect(() => publishProgramVersion(context(), draftProgram(), [draftCourse()])).toThrow("STEP_CONTENT_NOT_PUBLISHED");
  });

  it("never mutates an already published course or program version", () => {
    const course = publishLearningObjectVersion(context(), draftCourse());
    const program = publishProgramVersion(context(), draftProgram(), [course]);
    expect(() => assertImmutablePublishedVersion(course, { ...course, title: "Changed" })).toThrow("PUBLISHED_VERSION_IMMUTABLE");
    expect(() => assertImmutablePublishedProgram(program, { ...program, title: "Changed" })).toThrow("PUBLISHED_PROGRAM_IMMUTABLE");
  });
});

describe("GOLMS assignment, runtime and report", () => {
  const setup = () => {
    const course = publishLearningObjectVersion(context(), draftCourse());
    const program = publishProgramVersion(context(), draftProgram(), [course]);
    const assignment = assignProgram(context(), draftAssignment(), program);
    const learnerEnrollment = createEnrollment(context(), enrollment(), assignment);
    const launched = launchAttempt(context({ actorId: "learner-a" }), attempt(), learnerEnrollment, program.steps[0], course);
    return { course, program, assignment, learnerEnrollment, launched };
  };

  it("assigns only a published immutable program to the matching learner", () => {
    const course = publishLearningObjectVersion(context(), draftCourse());
    const program = publishProgramVersion(context(), draftProgram(), [course]);
    const assigned = assignProgram(context(), draftAssignment(), program);
    expect(assigned).toMatchObject({ status: "assigned", assignedBy: "admin-a" });
    expect(createEnrollment(context(), enrollment(), assigned).learnerId).toBe("learner-a");
    expect(() => createEnrollment(context(), enrollment({ learnerId: "learner-b" }), assigned)).toThrow("ENROLLMENT_ASSIGNMENT_MISMATCH");
  });

  it("keeps completion, success, score, progress and duration as separate facts", () => {
    const { launched } = setup();
    const initialized = applyRuntimeEvent(context({ actorId: "learner-a", now: "2026-09-27T12:01:01.000Z" }), launched, event(), new Set());
    const completed = applyRuntimeEvent(context({ actorId: "learner-a", now: "2026-09-27T12:10:01.000Z" }), initialized.attempt, event({ id: "event-a2", idempotencyKey: "idem-a2", sequence: 2, kind: "terminated", occurredAt: "2026-09-27T12:10:00.000Z", receivedAt: "2026-09-27T12:10:01.000Z", completionStatus: "complete", successStatus: "passed", progress: 1, scoreRaw: 82, scoreScaled: 0.82, sessionDurationSeconds: 540 }), new Set(["idem-a1"]));
    expect(completed.attempt).toMatchObject({ status: "completed", completionStatus: "complete", successStatus: "passed", progress: 1, scoreRaw: 82, scoreScaled: 0.82, totalDurationSeconds: 540 });
  });

  it("treats a retry as idempotent and rejects a new out-of-order event", () => {
    const { launched } = setup();
    const first = applyRuntimeEvent(context({ actorId: "learner-a" }), launched, event(), new Set());
    expect(applyRuntimeEvent(context({ actorId: "learner-a" }), first.attempt, event(), new Set(["idem-a1"]))).toEqual({ attempt: first.attempt, event: null, duplicate: true });
    expect(() => applyRuntimeEvent(context({ actorId: "learner-a" }), first.attempt, event({ id: "event-x", idempotencyKey: "idem-x", sequence: 3 }), new Set(["idem-a1"]))).toThrow("RUNTIME_EVENT_OUT_OF_ORDER");
  });

  it("resumes the same suspended attempt instead of creating a hidden replacement", () => {
    const { launched } = setup();
    const suspended = applyRuntimeEvent(context({ actorId: "learner-a" }), launched, event({ kind: "suspended", completionStatus: "incomplete", progress: 0.4 }), new Set());
    expect(suspended.attempt.status).toBe("suspended");
    expect(resumeAttempt(context({ actorId: "learner-a", now: "2026-09-27T12:05:00.000Z" }), suspended.attempt)).toMatchObject({ id: launched.id, ordinal: 1, status: "active" });
  });

  it("completes an enrollment only when every required step meets its own rule", () => {
    const { program, learnerEnrollment, launched } = setup();
    const failed = applyRuntimeEvent(context({ actorId: "learner-a" }), launched, event({ kind: "terminated", completionStatus: "complete", successStatus: "failed", progress: 1 }), new Set()).attempt;
    expect(deriveEnrollmentProgress(learnerEnrollment, program, [failed], NOW)).toMatchObject({ status: "in_progress", progressPercent: 0 });
    const passed = { ...failed, id: "attempt-a2", ordinal: 2, successStatus: "passed" as const };
    expect(deriveEnrollmentProgress(learnerEnrollment, program, [failed, passed], "2026-09-27T13:00:00.000Z")).toMatchObject({ status: "completed", progressPercent: 100, completedRequiredSteps: 1 });
  });

  it("blocks writes after trial expiry and all cross-tenant references", () => {
    const course = publishLearningObjectVersion(context(), draftCourse());
    expect(() => publishProgramVersion(context({ canWrite: false }), draftProgram(), [course])).toThrow("GOLMS_WRITE_FORBIDDEN");
    expect(() => publishProgramVersion(context(), draftProgram(), [{ ...course, tenantId: "tenant-b" }])).toThrow("TENANT_MISMATCH");
  });
});
