import type { StructuredLlmProvider } from "@/lib/ai/provider";
import { configuredLlmProvider } from "@/lib/ai/provider";
import { createContentDraft, readMarketingContext } from "@/lib/content-drafts/repository";
import type { ContentDraftActor } from "@/lib/content-drafts/types";
import { marketingPlanJsonSchema, parseMarketingPlanPayload } from "./schema";

export async function generateMarketingDraft(input: { weekStart: string }, actor: Extract<ContentDraftActor, { type: "admin" }>, provider: StructuredLlmProvider = configuredLlmProvider()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.weekStart)) throw new Error("weekStart must use YYYY-MM-DD");
  const context = await readMarketingContext();
  const raw = await provider.generateObject({
    name: "sgl_weekly_marketing_plan",
    system: "You are the Marketing Agent for The Seagull Labs. Use only the supplied products and evidence facts. Never invent sales, revenue, inventory, launch dates, performance, prices, discounts, or published activity. Every factual observation and recommendation must cite supplied evidence IDs. Return JSON matching the schema. This is a draft for human approval; never publish, send, or schedule externally.",
    prompt: `Prepare the weekly marketing calendar, promotion recommendations, optional launch plan, channel briefs, and weekly report for week ${input.weekStart}. Context:\n${JSON.stringify(context)}`,
    schema: marketingPlanJsonSchema as unknown as Record<string, unknown>
  });
  const payload = parseMarketingPlanPayload(raw, new Set(context.products.map((item) => item.id)), new Set(context.facts.map((item) => item.id)));
  return createContentDraft({
    module: "marketing", kind: "weekly_marketing_plan", title: `Marketing week of ${input.weekStart}`, payload,
    sourceSnapshot: { dataWindow: context.dataWindow, facts: context.facts, productIds: context.products.map((item) => item.id) },
    generationMetadata: { provider: provider.providerName, model: provider.modelName, schema: "weekly_marketing_plan.v1" }
  }, actor);
}
