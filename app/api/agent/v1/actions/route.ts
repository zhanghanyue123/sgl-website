import { NextRequest, NextResponse } from "next/server";
import { logAgentAction, requireAgent, type AgentContext } from "@/lib/agent/auth";
import { agentErrorResponse, handleAgentRead } from "@/lib/agent/http";
import { agentActionPolicies } from "@/lib/agent/policy";
import { createAgentAction, listAgentActions, parseAgentAction } from "@/lib/agent/service";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleAgentRead(request, "actions:read", "actions.read", async (context) => ({ actions: await listAgentActions(context.clientId) }));
}
export async function POST(request: NextRequest) {
  let context: AgentContext | undefined;
  try {
    const input = parseAgentAction(await request.json());
    context = await requireAgent(request, agentActionPolicies[input.actionType].scope);
    const id = await createAgentAction(input, context);
    await logAgentAction(request, context, "proposal.create", "success", { type: input.targetType, id: input.targetId }, { actionId: id, actionType: input.actionType });
    return NextResponse.json({ id, status: "pending", execution: "manual_after_approval" }, { status: 201 });
  } catch (error) {
    if (context) await logAgentAction(request, context, "proposal.create", "failed", undefined, { error: error instanceof Error ? error.message.slice(0, 300) : "unknown" });
    return agentErrorResponse(error);
  }
}
