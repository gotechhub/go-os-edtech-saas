import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { loadOsCoreAccess } from "@/lib/internal-access";
import { loadPortalInventory } from "@/lib/portal-inventory";

export async function GET(request:Request){
  const requestId=request.headers.get("x-request-id")??randomUUID();
  const access=await loadOsCoreAccess();
  if(access.state!=="ready"||!access.permissions.includes("core.read"))return NextResponse.json({schemaVersion:"2026-10-01",requestId,error:{code:access.state==="ready"?"FORBIDDEN":access.state.toUpperCase()}},{status:access.state==="unauthenticated"?401:403});
  const inventory=await loadPortalInventory();
  if(inventory.state!=="ready")return NextResponse.json({schemaVersion:"2026-10-01",requestId,error:{code:inventory.state.toUpperCase()}},{status:inventory.state==="error"?500:503});
  return NextResponse.json({schemaVersion:"2026-10-01",requestId,data:{observedAt:new Date().toISOString(),items:inventory.items}});
}
