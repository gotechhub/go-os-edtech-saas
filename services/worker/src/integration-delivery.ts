export interface IntegrationDeliveryJob {
  id: string;
  tenantId: string;
  connectorId: string;
  providerKey: string;
  capability: string;
  endpointReference: string;
  secretReference: string;
  eventType: string;
  eventPayload: unknown;
  eventIdempotencyKey: string;
  attemptNumber: number;
}

export interface IntegrationDeliveryRepository {
  claim(workerId: string): Promise<IntegrationDeliveryJob | null>;
  succeed(job: IntegrationDeliveryJob, responseCode: number): Promise<void>;
  fail(job: IntegrationDeliveryJob, errorCode: string, responseCode?: number): Promise<void>;
}

export interface ResolvedConnectorTarget {
  url: string;
  headers: Readonly<Record<string, string>>;
}

export interface ConnectorTargetResolver {
  resolve(job: Pick<IntegrationDeliveryJob, "tenantId" | "connectorId" | "endpointReference" | "secretReference">): Promise<ResolvedConnectorTarget>;
}

export interface ConnectorHttpClient {
  post(input: {
    url: string;
    headers: Readonly<Record<string, string>>;
    body: string;
    timeoutMs: number;
    followRedirects: false;
  }): Promise<{ status: number }>;
}

export type IntegrationDeliveryResult =
  | { outcome: "idle" }
  | { outcome: "succeeded"; deliveryId: string; responseCode: number }
  | { outcome: "failed"; deliveryId: string; errorCode: string; responseCode?: number };

export async function runNextIntegrationDelivery(
  workerId: string,
  repository: IntegrationDeliveryRepository,
  targets: ConnectorTargetResolver,
  http: ConnectorHttpClient,
): Promise<IntegrationDeliveryResult> {
  const job = await repository.claim(workerId);
  if (!job) return { outcome: "idle" };

  try {
    const target = await targets.resolve(job);
    const url = new URL(target.url);
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new ConnectorDeliveryError("CONNECTOR_TARGET_INVALID");
    }
    const body = JSON.stringify({
      id: job.eventIdempotencyKey,
      type: job.eventType,
      tenantId: job.tenantId,
      data: job.eventPayload,
    });
    const response = await http.post({
      url: url.toString(),
      headers: {
        "content-type": "application/json",
        "x-respongo-event-id": job.eventIdempotencyKey,
        ...target.headers,
      },
      body,
      timeoutMs: 10_000,
      followRedirects: false,
    });
    if (response.status < 200 || response.status >= 300) {
      const code = response.status === 429 ? "CONNECTOR_RATE_LIMITED" : response.status >= 500 ? "CONNECTOR_REMOTE_UNAVAILABLE" : "CONNECTOR_REMOTE_REJECTED";
      await repository.fail(job, code, response.status);
      return { outcome: "failed", deliveryId: job.id, errorCode: code, responseCode: response.status };
    }
    await repository.succeed(job, response.status);
    return { outcome: "succeeded", deliveryId: job.id, responseCode: response.status };
  } catch (error) {
    const errorCode = error instanceof ConnectorDeliveryError
      ? error.code
      : error instanceof Error && error.name === "AbortError"
        ? "CONNECTOR_TIMEOUT"
        : "CONNECTOR_DELIVERY_FAILED";
    await repository.fail(job, errorCode);
    return { outcome: "failed", deliveryId: job.id, errorCode };
  }
}

class ConnectorDeliveryError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ConnectorDeliveryError";
  }
}
