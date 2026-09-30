import type { AddProgramStepCommand, AssignProgramCommand, CreateProgramDraftCommand, CreateScormDraftCommand, EnrollmentSummary, GolmsRecord, IssueScormLaunchCommand, ProgramReportRow, ProgramSummary, RequestContext, ScormLaunchTicket } from "./types";

export interface GolmsGateway {
  createScormDraft(context: RequestContext, command: CreateScormDraftCommand): Promise<GolmsRecord>;
  publishLearningObject(context: RequestContext, versionId: string): Promise<GolmsRecord>;
  createProgramDraft(context: RequestContext, command: CreateProgramDraftCommand): Promise<GolmsRecord>;
  addProgramStep(context: RequestContext, command: AddProgramStepCommand): Promise<GolmsRecord>;
  publishProgram(context: RequestContext, versionId: string): Promise<GolmsRecord>;
  assignProgram(context: RequestContext, command: AssignProgramCommand): Promise<GolmsRecord>;
  listPrograms(context: RequestContext): Promise<readonly ProgramSummary[]>;
  listMyEnrollments(context: RequestContext): Promise<readonly EnrollmentSummary[]>;
  issueScormLaunch(context: RequestContext, command: IssueScormLaunchCommand): Promise<ScormLaunchTicket>;
  getProgramReport(context: RequestContext, programVersionId: string): Promise<readonly ProgramReportRow[]>;
}
