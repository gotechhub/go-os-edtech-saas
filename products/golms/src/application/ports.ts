import type { AddProgramStepCommand, AssignProgramCommand, BindScormAssetCommand, CreateProgramDraftCommand, CreateScormDraftCommand, EnrollmentSummary, GolmsRecord, IssueScormLaunchCommand, ProgramReportRow, ProgramSummary, RegisterScormImportCommand, RequestContext, ScormBinding, ScormContentSummary, ScormLaunchTicket } from "./types";

export interface GolmsGateway {
  createScormDraft(context: RequestContext, command: CreateScormDraftCommand): Promise<GolmsRecord>;
  registerScormImport(context: RequestContext, command: RegisterScormImportCommand): Promise<void>;
  bindScormAsset(context: RequestContext, command: BindScormAssetCommand): Promise<ScormBinding>;
  publishLearningObject(context: RequestContext, versionId: string): Promise<GolmsRecord>;
  listScormContent(context: RequestContext): Promise<readonly ScormContentSummary[]>;
  createProgramDraft(context: RequestContext, command: CreateProgramDraftCommand): Promise<GolmsRecord>;
  addProgramStep(context: RequestContext, command: AddProgramStepCommand): Promise<GolmsRecord>;
  publishProgram(context: RequestContext, versionId: string): Promise<GolmsRecord>;
  assignProgram(context: RequestContext, command: AssignProgramCommand): Promise<GolmsRecord>;
  listPrograms(context: RequestContext): Promise<readonly ProgramSummary[]>;
  listMyEnrollments(context: RequestContext): Promise<readonly EnrollmentSummary[]>;
  issueScormLaunch(context: RequestContext, command: IssueScormLaunchCommand): Promise<ScormLaunchTicket>;
  getProgramReport(context: RequestContext, programVersionId: string): Promise<readonly ProgramReportRow[]>;
}
