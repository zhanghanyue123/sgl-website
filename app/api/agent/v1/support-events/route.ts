import { NextRequest, NextResponse } from "next/server";
import { logAgentAction, requireAgent, type AgentContext } from "@/lib/agent/auth";
import { agentErrorResponse, AgentValidationError } from "@/lib/agent/http";
import { decodeUtf8Body, readBoundedRequestBody, RequestBodyError } from "@/lib/http/read-bounded-body";
import {
  acknowledgeWebsiteSupportEvent,
  negativeAcknowledgeWebsiteSupportEvent,
  parseSupportEventAck,
  parseSupportEventNack,
  parseSupportEventPull,
  parseSupportEventReplay,
  pullWebsiteSupportEvents,
  replayDeadLetteredSupportEvent,
  SupportEventInputError
} from "@/lib/integrations/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function routeError(error: unknown) {
  if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  const response = agentErrorResponse(error instanceof SupportEventInputError ? new AgentValidationError(error.message) : error);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function noStoreJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: { "Cache-Control": "no-store" } });
}

async function readBody(request: Request) {
  const text = decodeUtf8Body(await readBoundedRequestBody(request, 4_096));
  if (!text) throw new RequestBodyError(400, "Acknowledgement body is required");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestBodyError(400, "Acknowledgement body must be valid JSON");
  }
}

export async function GET(request: NextRequest) {
  let context: AgentContext | undefined;
  try {
    context = await requireAgent(request, "support-events:read");
    const options = parseSupportEventPull(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const events = await pullWebsiteSupportEvents(context.clientId, { organizationId: context.organizationId, storeId: context.storeId }, options);
    await logAgentAction(request, context, "support_events.pull", "success", undefined, { count: events.length });
    return noStoreJson({ events, source: "website", destination: "retail_agent" });
  } catch (error) {
    if (context) await logAgentAction(request, context, "support_events.pull", "failed", undefined, { error: error instanceof Error ? error.message.slice(0, 300) : "unknown" });
    return routeError(error);
  }
}

export async function POST(request: NextRequest) {
  let context: AgentContext | undefined;
  try {
    context = await requireAgent(request, "support-events:ack");
    const input = parseSupportEventAck(await readBody(request));
    const result = await acknowledgeWebsiteSupportEvent(context.clientId, { organizationId: context.organizationId, storeId: context.storeId }, input);
    if (result.status === "lease_not_found" || result.status === "idempotency_conflict") {
      await logAgentAction(request, context, "support_events.ack", "denied", { type: "integration_outbox", id: input.eventId }, { reason: result.status });
      return noStoreJson({ error: result.status === "idempotency_conflict" ? "Idempotency key was used for another event" : "The event lease is invalid or expired" }, { status: 409 });
    }
    await logAgentAction(request, context, "support_events.ack", "success", { type: "integration_outbox", id: result.id }, { status: result.status });
    return noStoreJson(result);
  } catch (error) {
    if (context) await logAgentAction(request, context, "support_events.ack", "failed", undefined, { error: error instanceof Error ? error.message.slice(0, 300) : "unknown" });
    return routeError(error);
  }
}

export async function PATCH(request: NextRequest) {
  let context: AgentContext | undefined;
  try {
    context=await requireAgent(request,"support-events:nack");
    const input=parseSupportEventNack(await readBody(request));
    const result=await negativeAcknowledgeWebsiteSupportEvent(context.clientId,{organizationId:context.organizationId,storeId:context.storeId},input);
    await logAgentAction(request,context,"support_events.nack",result.status==="lease_not_found"?"denied":"success",{type:"integration_outbox",id:input.eventId},{status:result.status,errorCode:input.errorCode});
    return result.status==="lease_not_found"?noStoreJson({error:"The event lease is invalid or expired"},{status:409}):noStoreJson(result);
  } catch(error) {
    if(context)await logAgentAction(request,context,"support_events.nack","failed",undefined,{error:error instanceof Error?error.message.slice(0,300):"unknown"});
    return routeError(error);
  }
}

export async function PUT(request: NextRequest) {
  let context: AgentContext | undefined;
  try {
    context=await requireAgent(request,"support-events:replay");
    const input=parseSupportEventReplay(await readBody(request));
    const result=await replayDeadLetteredSupportEvent(context.clientId,{organizationId:context.organizationId,storeId:context.storeId},input.eventId);
    if(!result)return noStoreJson({error:"Dead-lettered event was not found in this tenant scope"},{status:404});
    await logAgentAction(request,context,"support_events.replay","success",{type:"integration_outbox",id:input.eventId});
    return noStoreJson(result);
  } catch(error) {
    if(context)await logAgentAction(request,context,"support_events.replay","failed",undefined,{error:error instanceof Error?error.message.slice(0,300):"unknown"});
    return routeError(error);
  }
}
