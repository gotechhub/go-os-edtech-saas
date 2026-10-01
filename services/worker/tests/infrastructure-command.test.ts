import { describe, expect, it, vi } from "vitest";
import { runNextInfrastructureCommand, type InfrastructureCommandJob } from "../src/infrastructure-command";

const job: InfrastructureCommandJob = { id:"command-1",tenantId:null,provider:"aws",resourceType:"cdn_distribution",resourceReference:"distribution-main",commandType:"cdn_invalidation" };

describe("infrastructure command worker",()=>{
  it("executes one leased provider command",async()=>{const repository={claim:vi.fn().mockResolvedValue(job),succeed:vi.fn(),fail:vi.fn()};const providers={execute:vi.fn().mockResolvedValue(undefined)};await expect(runNextInfrastructureCommand("worker-1",repository,providers)).resolves.toEqual({outcome:"succeeded",commandId:job.id});expect(repository.succeed).toHaveBeenCalledWith(job);});
  it("persists only a stable provider error class",async()=>{const repository={claim:vi.fn().mockResolvedValue(job),succeed:vi.fn(),fail:vi.fn()};const providers={execute:vi.fn().mockRejectedValue(new Error("credential detail"))};const result=await runNextInfrastructureCommand("worker-1",repository,providers);expect(result).toEqual({outcome:"failed",commandId:job.id,errorCode:"INFRASTRUCTURE_PROVIDER_FAILED"});expect(JSON.stringify(result)).not.toContain("credential detail");});
  it("stays idle without calling a provider",async()=>{const repository={claim:vi.fn().mockResolvedValue(null),succeed:vi.fn(),fail:vi.fn()};const providers={execute:vi.fn()};await expect(runNextInfrastructureCommand("worker-1",repository,providers)).resolves.toEqual({outcome:"idle"});expect(providers.execute).not.toHaveBeenCalled();});
});
