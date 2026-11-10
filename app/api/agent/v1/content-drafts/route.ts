import { NextRequest, NextResponse } from "next/server";
import { logAgentAction, requireAgent, type AgentContext } from "@/lib/agent/auth";
import { agentErrorResponse, AgentValidationError, handleAgentRead } from "@/lib/agent/http";
import { createContentDraft, listContentDrafts, readProductContentContext } from "@/lib/content-drafts/repository";
import { parseProductContentPayload } from "@/lib/product-content/schema";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handleAgentRead(request, "content:read", "content_drafts.read", async () => ({ drafts: await listContentDrafts("product_content") }));
}
export async function POST(request: NextRequest) {
  let context: AgentContext | undefined;
  try {
    context = await requireAgent(request, "content:draft"); const body = await request.json();
    if (typeof body?.productId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.productId)) throw new AgentValidationError("A valid productId is required");
    const product = await readProductContentContext(body.productId); if (!product) throw new AgentValidationError("Product not found");
    const title = typeof body.title === "string" ? body.title.trim() : ""; if (!title || title.length > 240) throw new AgentValidationError("title is invalid");
    const payload = parseProductContentPayload(body.payload);
    const draft = await createContentDraft({ module: "product_content", kind: "product_content_bundle", productId: product.id, title, payload: payload as unknown as Record<string, unknown>, sourceSnapshot: { productId: product.id, productSlug: product.slug }, generationMetadata: { source: "agent_tool", schema: "product_content_bundle.v1" } }, { type: "agent", clientId: context.clientId, tokenId: context.tokenId, requestId: request.headers.get("x-request-id") });
    await logAgentAction(request, context, "content_draft.create", "success", { type: "content_draft", id: draft.id }, { module: "product_content", status: "draft" });
    return NextResponse.json({ draft, publishing: "disabled", reviewRequired: true }, { status: 201 });
  } catch (error) {
    if (context) await logAgentAction(request, context, "content_draft.create", "failed", undefined, { error: error instanceof Error ? error.message.slice(0, 300) : "unknown" });
    return agentErrorResponse(error instanceof AgentValidationError ? error : error instanceof Error && /invalid|required|not found/i.test(error.message) ? new AgentValidationError(error.message) : error);
  }
}
