import { NextRequest, NextResponse } from "next/server";
import { requireAgent, logAgentAction } from "@/lib/agent/auth";
import { agentErrorResponse, AgentValidationError } from "@/lib/agent/http";
import { decodeUtf8Body, readBoundedRequestBody, RequestBodyError } from "@/lib/http/read-bounded-body";
import { acknowledgeStationCommand, pullStationCommands, StationAdminInputError } from "@/lib/integrations/station-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown) {
  if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
  return agentErrorResponse(error instanceof StationAdminInputError ? new AgentValidationError(error.message) : error);
}
export async function GET(request: NextRequest) {
  let context;
  try {
    context = await requireAgent(request, "station-commands:read");
    if (!context.storeId) return NextResponse.json({ error: "Station client must be scoped to a store" }, { status: 403 });
    const limit = Number(request.nextUrl.searchParams.get("limit") || 25);
    const commands = await pullStationCommands(context.clientId, { organizationId: context.organizationId, storeId: context.storeId }, limit);
    await logAgentAction(request, context, "station.commands.pull", "success", undefined, { count: commands.length });
    return NextResponse.json({ commands }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
export async function POST(request: NextRequest) {
  let context;
  try {
    context = await requireAgent(request, "station-commands:ack");
    if (!context.storeId) return NextResponse.json({ error: "Station client must be scoped to a store" }, { status: 403 });
    const body = JSON.parse(decodeUtf8Body(await readBoundedRequestBody(request, 4_096)) || "null") as unknown;
    const result = await acknowledgeStationCommand(context.clientId, { organizationId: context.organizationId, storeId: context.storeId }, body);
    if (!result) return NextResponse.json({ error: "Command lease is invalid or expired" }, { status: 409 });
    await logAgentAction(request, context, "station.commands.ack", "success", undefined, { status: result.status });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
