export interface InfrastructureCommandJob {
  id: string;
  tenantId: string | null;
  provider: "vercel" | "supabase" | "aws";
  resourceType: string;
  resourceReference: string;
  commandType: "provision" | "policy_remediation" | "cdn_invalidation" | "capacity_expansion";
}

export interface InfrastructureCommandRepository {
  claim(workerId: string): Promise<InfrastructureCommandJob | null>;
  succeed(job: InfrastructureCommandJob): Promise<void>;
  fail(job: InfrastructureCommandJob, errorCode: string): Promise<void>;
}

export interface InfrastructureProviderExecutor {
  execute(job: InfrastructureCommandJob): Promise<void>;
}

export type InfrastructureCommandResult =
  | { outcome: "idle" }
  | { outcome: "succeeded"; commandId: string }
  | { outcome: "failed"; commandId: string; errorCode: string };

export async function runNextInfrastructureCommand(
  workerId: string,
  repository: InfrastructureCommandRepository,
  providers: InfrastructureProviderExecutor,
): Promise<InfrastructureCommandResult> {
  const job = await repository.claim(workerId);
  if (!job) return { outcome: "idle" };
  try {
    await providers.execute(job);
    await repository.succeed(job);
    return { outcome: "succeeded", commandId: job.id };
  } catch (error) {
    const errorCode = error instanceof Error && error.name === "AbortError" ? "INFRASTRUCTURE_PROVIDER_TIMEOUT" : "INFRASTRUCTURE_PROVIDER_FAILED";
    await repository.fail(job, errorCode);
    return { outcome: "failed", commandId: job.id, errorCode };
  }
}
