import type { GolmsGateway } from "./ports";
import { ApplicationError, type AddProgramStepCommand, type ApiEnvelope, type AssignProgramCommand, type CreateProgramDraftCommand, type CreateScormDraftCommand, type EnrollmentSummary, type GolmsRecord, type IssueScormLaunchCommand, type ProgramReportRow, type ProgramSummary, type RequestContext, type ScormLaunchTicket } from "./types";
import { hash, instant, text, uuid } from "./validation";

export class GolmsApplicationService {
  constructor(private readonly gateway: GolmsGateway) {}

  private envelope<T>(context: RequestContext, data: T): ApiEnvelope<T> {
    return { schemaVersion: "2026-09-27", requestId: context.requestId, freshness: "live", data };
  }

  async createScormDraft(context: RequestContext, input: CreateScormDraftCommand): Promise<ApiEnvelope<GolmsRecord>> {
    const command = { title: text(input.title, "Eğitim adı"), locale: text(input.locale, "Dil", 35), contentHash: hash(input.contentHash) };
    return this.envelope(context, await this.gateway.createScormDraft(context, command));
  }

  async createProgramDraft(context: RequestContext, input: CreateProgramDraftCommand): Promise<ApiEnvelope<GolmsRecord>> {
    const command = { title: text(input.title, "Program adı"), locale: text(input.locale, "Dil", 35), sequential: Boolean(input.sequential) };
    return this.envelope(context, await this.gateway.createProgramDraft(context, command));
  }

  async addProgramStep(context: RequestContext, input: AddProgramStepCommand): Promise<ApiEnvelope<GolmsRecord>> {
    if (!Number.isInteger(input.position) || input.position < 1) throw new Error("INVALID_STEP_POSITION");
    const command = { ...input, programVersionId: uuid(input.programVersionId, "Program"), learningObjectVersionId: uuid(input.learningObjectVersionId, "İçerik") };
    return this.envelope(context, await this.gateway.addProgramStep(context, command));
  }

  async publishProgram(context: RequestContext, versionId: string): Promise<ApiEnvelope<GolmsRecord>> {
    return this.envelope(context, await this.gateway.publishProgram(context, uuid(versionId, "Program")));
  }

  async assignProgram(context: RequestContext, input: AssignProgramCommand): Promise<ApiEnvelope<GolmsRecord>> {
    const availableAt = instant(input.availableAt, "Başlangıç zamanı");
    const dueAt = input.dueAt === null ? null : instant(input.dueAt, "Son tarih");
    if (dueAt && Date.parse(dueAt) <= Date.parse(availableAt)) throw new Error("INVALID_ASSIGNMENT_DUE_AT");
    const command = { ...input, programVersionId: uuid(input.programVersionId, "Program"), learnerId: uuid(input.learnerId, "Öğrenen"), availableAt, dueAt };
    return this.envelope(context, await this.gateway.assignProgram(context, command));
  }

  async listPrograms(context: RequestContext): Promise<ApiEnvelope<readonly ProgramSummary[]>> {
    return this.envelope(context, await this.gateway.listPrograms(context));
  }

  async listMyEnrollments(context: RequestContext): Promise<ApiEnvelope<readonly EnrollmentSummary[]>> {
    return this.envelope(context, await this.gateway.listMyEnrollments(context));
  }

  async issueScormLaunch(context: RequestContext, input: IssueScormLaunchCommand): Promise<ApiEnvelope<ScormLaunchTicket>> {
    if (!/^[0-9a-f]{64}$/.test(input.ticketHash)) throw new ApplicationError("VALIDATION_FAILED", "Başlatma bileti geçersiz.", 400);
    const command = { enrollmentId: uuid(input.enrollmentId, "Kayıt"), stepId: uuid(input.stepId, "Program adımı"), ticketHash: input.ticketHash };
    return this.envelope(context, await this.gateway.issueScormLaunch(context, command));
  }

  async getProgramReport(context: RequestContext, programVersionId: string): Promise<ApiEnvelope<readonly ProgramReportRow[]>> {
    return this.envelope(context, await this.gateway.getProgramReport(context, uuid(programVersionId, "Program")));
  }
}
