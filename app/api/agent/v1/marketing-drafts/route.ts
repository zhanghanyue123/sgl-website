import { NextRequest, NextResponse } from "next/server";
import { logAgentAction, requireAgent, type AgentContext } from "@/lib/agent/auth";
import { agentErrorResponse, AgentValidationError, handleAgentRead } from "@/lib/agent/http";
import { createContentDraft, listContentDrafts, readMarketingContext } from "@/lib/content-drafts/repository";
import { parseMarketingPlanPayload } from "@/lib/marketing/schema";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handleAgentRead(request, "marketing:read", "marketing_drafts.read", async () => ({ drafts: await listContentDrafts("marketing") }));
}
export async function POST(request: NextRequest) {
  let context: AgentContext | undefined;
  try {
    context = await requireAgent(request, "marketing:draft"); const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : ""; if (!title || title.length > 240) throw new AgentValidationError("title is invalid");
    const source = await readMarketingContext();
    const payload = parseMarketingPlanPayload(body.payload, new Set(source.products.map((item) => item.id)), new Set(source.facts.map((item) => item.id)));
    const draft = await createContentDraft({ module: "marketing", kind: "weekly_marketing_plan", title, payload: payload as unknown as Record<string, unknown>, sourceSnapshot: { dataWindow: source.dataWindow, facts: source.facts, productIds: source.products.map((item) => item.id) }, generationMetadata: { source: "agent_tool", schema: "weekly_marketing_plan.v1" } }, { type: "agent", clientId: context.clientId, tokenId: context.tokenId, requestId: request.headers.get("x-request-id") });
    await logAgentAction(request, context, "marketing_draft.create", "success", { type: "content_draft", id: draft.id }, { module: "marketing", status: "draft" });
    return NextResponse.json({ draft, publishing: "disabled", reviewRequired: true }, { status: 201 });
  } catch (error) {
    if (context) await logAgentAction(request, context, "marketing_draft.create", "failed", undefined, { error: error instanceof Error ? error.message.slice(0, 300) : "unknown" });
    return agentErrorResponse(error instanceof AgentValidationError ? error : error instanceof Error && /invalid|required|unknown/i.test(error.message) ? new AgentValidationError(error.message) : error);
  }
}
