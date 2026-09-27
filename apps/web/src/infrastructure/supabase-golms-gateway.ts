import { ApplicationError, type AddProgramStepCommand, type AssignProgramCommand, type CreateProgramDraftCommand, type CreateScormDraftCommand, type EnrollmentSummary, type GolmsGateway, type GolmsRecord, type ProgramSummary, type RequestContext } from "@respongo-os/golms/application";
import type { SupabaseClient } from "@supabase/supabase-js";

type RpcRow = Record<string, unknown>;

const one = (data: unknown): RpcRow => {
  const value = Array.isArray(data) ? data[0] : data;
  if (!value || typeof value !== "object") throw new ApplicationError("INTERNAL_ERROR", "İşlem sonucu alınamadı.", 500);
  return value as RpcRow;
};

const fail = (error: { message?: string; code?: string } | null) => {
  if (!error) return;
  const source = `${error.code ?? ""} ${error.message ?? ""}`;
  if (/42501|FORBIDDEN|REQUIRED/.test(source)) throw new ApplicationError("FORBIDDEN", "Bu işlem için yetkiniz veya aktif ürün hakkınız yok.", 403);
  if (/23505|CONFLICT|IMMUTABLE|OUT_OF_ORDER/.test(source)) throw new ApplicationError("CONFLICT", "Kayıt güncellendi veya işlem daha önce tamamlandı.", 409);
  throw new ApplicationError("DEPENDENCY_UNAVAILABLE", "Öğrenme servisine şu anda ulaşılamıyor.", 503);
};

const record = (row: RpcRow): GolmsRecord => ({ id: String(row.id), tenantId: String(row.tenant_id), status: String(row.status) });

export class SupabaseGolmsGateway implements GolmsGateway {
  constructor(private readonly client: SupabaseClient) {}

  async createScormDraft(context: RequestContext, command: CreateScormDraftCommand) {
    const { data, error } = await this.client.rpc("v3_golms_create_scorm_draft", { target_tenant: context.tenantId, course_title: command.title, course_locale: command.locale, course_hash: command.contentHash }); fail(error); return record(one(data));
  }
  async publishLearningObject(_context: RequestContext, versionId: string) {
    const { data, error } = await this.client.rpc("v3_golms_publish_learning_object", { version_id: versionId }); fail(error); return record(one(data));
  }
  async createProgramDraft(context: RequestContext, command: CreateProgramDraftCommand) {
    const { data, error } = await this.client.rpc("v3_golms_create_program_draft", { target_tenant: context.tenantId, program_title: command.title, program_locale: command.locale, is_sequential: command.sequential }); fail(error); return record(one(data));
  }
  async addProgramStep(_context: RequestContext, command: AddProgramStepCommand) {
    const { data, error } = await this.client.rpc("v3_golms_add_program_step", { version_id: command.programVersionId, object_version_id: command.learningObjectVersionId, step_position: command.position, is_required: command.required, step_rule: command.completionRule }); fail(error); return record(one(data));
  }
  async publishProgram(_context: RequestContext, versionId: string) {
    const { data, error } = await this.client.rpc("v3_golms_publish_program", { version_id: versionId }); fail(error); return record(one(data));
  }
  async assignProgram(_context: RequestContext, command: AssignProgramCommand) {
    const { data, error } = await this.client.rpc("v3_golms_assign_program", { version_id: command.programVersionId, learner_id: command.learnerId, is_required: command.required, available_at: command.availableAt, due_at: command.dueAt }); fail(error); return record(one(data));
  }
  async listPrograms(context: RequestContext): Promise<readonly ProgramSummary[]> {
    const { data, error } = await this.client.rpc("v3_golms_list_programs", { target_tenant: context.tenantId }); fail(error);
    return (data ?? []).map((item: RpcRow) => ({ id: String(item.id), title: String(item.title), status: String(item.status), version: Number(item.version), locale: String(item.locale), stepCount: Number(item.step_count), publishedAt: item.published_at ? String(item.published_at) : null }));
  }
  async listMyEnrollments(context: RequestContext): Promise<readonly EnrollmentSummary[]> {
    const { data, error } = await this.client.rpc("v3_golms_my_enrollments", { target_tenant: context.tenantId }); fail(error);
    return (data ?? []).map((item: RpcRow) => ({ id: String(item.id), programVersionId: String(item.program_version_id), programTitle: String(item.program_title), status: String(item.status), required: Boolean(item.required), availableAt: String(item.available_at), dueAt: item.due_at ? String(item.due_at) : null, progressPercent: Number(item.progress_percent) }));
  }
}
