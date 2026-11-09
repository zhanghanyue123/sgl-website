import { NextRequest, NextResponse } from "next/server";
import { requireAgent, logAgentAction } from "@/lib/agent/auth";
import { agentErrorResponse, AgentValidationError } from "@/lib/agent/http";
import { decodeUtf8Body, readBoundedRequestBody, RequestBodyError } from "@/lib/http/read-bounded-body";
import { StationAdminInputError, storeStationSnapshot } from "@/lib/integrations/station-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let context;
  try {
    context = await requireAgent(request, "station-snapshot:write");
    if (!context.storeId) return NextResponse.json({ error: "Station client must be scoped to a store" }, { status: 403 });
    const body = JSON.parse(decodeUtf8Body(await readBoundedRequestBody(request, 524_288)) || "null") as unknown;
    const result = await storeStationSnapshot({ organizationId: context.organizationId, storeId: context.storeId }, body);
    await logAgentAction(request, context, "station.snapshot.store", "success", undefined, { version: result.version, accepted: result.accepted });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (context) await logAgentAction(request, context, "station.snapshot.store", "failed", undefined, { error: error instanceof Error ? error.message.slice(0, 200) : "unknown" });
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    return agentErrorResponse(error instanceof StationAdminInputError ? new AgentValidationError(error.message) : error);
  }
}
