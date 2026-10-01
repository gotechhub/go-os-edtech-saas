export interface SecurityRevocationJob {
  id: string;
  tenantId: string | null;
  incidentId: string;
  targetType: "user_session" | "api_key" | "provider_secret_version";
  targetReference: string;
}

export interface SecurityRevocationRepository {
  claim(workerId: string): Promise<SecurityRevocationJob | null>;
  succeed(job: SecurityRevocationJob): Promise<void>;
  fail(job: SecurityRevocationJob, errorCode: string): Promise<void>;
}

export interface SecurityRevocationExecutor {
  revoke(job: SecurityRevocationJob): Promise<void>;
}

export type SecurityRevocationResult =
  | { outcome: "idle" }
  | { outcome: "succeeded"; revocationId: string }
  | { outcome: "failed"; revocationId: string; errorCode: string };

export async function runNextSecurityRevocation(
  workerId: string,
  repository: SecurityRevocationRepository,
  executor: SecurityRevocationExecutor,
): Promise<SecurityRevocationResult> {
  const job = await repository.claim(workerId);
  if (!job) return { outcome: "idle" };
  try {
    await executor.revoke(job);
    await repository.succeed(job);
    return { outcome: "succeeded", revocationId: job.id };
  } catch (error) {
    const errorCode = error instanceof Error && error.name === "AbortError"
      ? "REVOCATION_PROVIDER_TIMEOUT"
      : "REVOCATION_PROVIDER_FAILED";
    await repository.fail(job, errorCode);
    return { outcome: "failed", revocationId: job.id, errorCode };
  }
}
