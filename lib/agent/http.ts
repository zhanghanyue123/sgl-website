import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AgentAuthError, type AgentContext, logAgentAction, requireAgent } from "./auth";
import type { AgentScope } from "./policy";

export function agentErrorResponse(error: unknown) {
  if (error instanceof AgentAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof AgentValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof Error && /unique|duplicate/i.test(error.message)) return NextResponse.json({ error: "Idempotency key already used" }, { status: 409 });
  console.error("[agent]", error);
  return NextResponse.json({ error: "Agent API operation failed" }, { status: 500 });
}

export class AgentValidationError extends Error {}

export async function handleAgentRead(request: NextRequest, scope: AgentScope, action: string, handler: (context: AgentContext) => Promise<unknown>) {
  let context: AgentContext | undefined;
  try {
    context = await requireAgent(request, scope);
    const result = await handler(context);
    await logAgentAction(request, context, action, "success");
    return NextResponse.json(result);
  } catch (error) {
    if (context) await logAgentAction(request, context, action, "failed", undefined, { error: error instanceof Error ? error.message.slice(0, 300) : "unknown" });
    return agentErrorResponse(error);
  }
}
