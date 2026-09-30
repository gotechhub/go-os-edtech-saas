import { hostname } from "node:os";
import { createWorkerDependencies } from "./adapters";
import { runNextScormIngestion, type ScormWorkerResult } from "./scorm-ingestion";
import { runNextScormPublication, type ScormPublicationResult } from "./scorm-publication";

export interface ScormWorkerCycleResult {
  ingestion: ScormWorkerResult;
  publication: ScormPublicationResult;
}

export async function runScormWorkerCycle(workerId = `${hostname()}-${process.pid}`, environment: NodeJS.ProcessEnv = process.env): Promise<ScormWorkerCycleResult> {
  if (!/^[a-zA-Z0-9._-]{3,120}$/.test(workerId)) throw new Error("SCORM_WORKER_ID_INVALID");
  const dependencies = createWorkerDependencies(environment);
  const ingestion = await runNextScormIngestion(workerId, dependencies.ingestionJobs, dependencies.objects);
  const publication = await runNextScormPublication(workerId, dependencies.publicationJobs, dependencies.objects, dependencies.publisher);
  return { ingestion, publication };
}
