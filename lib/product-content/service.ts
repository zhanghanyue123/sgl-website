import type { StructuredLlmProvider } from "@/lib/ai/provider";
import { configuredLlmProvider } from "@/lib/ai/provider";
import { createContentDraft, readProductContentContext } from "@/lib/content-drafts/repository";
import type { ContentDraftActor } from "@/lib/content-drafts/types";
import { parseProductContentPayload, productContentJsonSchema } from "./schema";

export async function generateProductContentDraft(input: { productId: string }, actor: Extract<ContentDraftActor, { type: "admin" }>, provider: StructuredLlmProvider = configuredLlmProvider()) {
  const context = await readProductContentContext(input.productId);
  if (!context) throw new Error("Product not found");
  const raw = await provider.generateObject({
    name: "sgl_product_content_bundle",
    system: "You are the Product Content Agent for The Seagull Labs. Use only supplied catalogue facts. Do not invent materials, specifications, certifications, prices, availability, sales claims, or product history. Return JSON matching the schema. All text remains an editable draft for human review; never publish or send it.",
    prompt: `Create bilingual product, SEO, Xiaohongshu, Instagram, and campaign draft content from this catalogue record:\n${JSON.stringify(context)}`,
    schema: productContentJsonSchema as unknown as Record<string, unknown>
  });
  const payload = parseProductContentPayload(raw);
  const localizations = Array.isArray(context.localizations) ? context.localizations as { locale?: string; title?: string }[] : [];
  const title = localizations.find((item) => item.locale === "en")?.title || context.slug;
  return createContentDraft({
    module: "product_content", kind: "product_content_bundle", productId: context.id,
    title: `${title} content bundle`, payload,
    sourceSnapshot: { productId: context.id, productSlug: context.slug },
    generationMetadata: { provider: provider.providerName, model: provider.modelName, schema: "product_content_bundle.v1" }
  }, actor);
}
