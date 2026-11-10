import type { StructuredLlmProvider } from "@/lib/ai/provider";
import { configuredLlmProvider } from "@/lib/ai/provider";
import { createContentDraft } from "@/lib/content-drafts/repository";
import type { ContentDraftActor } from "@/lib/content-drafts/types";
import { crawlWebsite, type SeoFetch } from "./crawler";
import { auditTechnicalSeo, validateRobotsDocument, validateSitemapDocument } from "./technical-audit";
import { classifySearchIntent, clusterKeywords, mapKeywordToCatalog } from "./keyword-research";
import { parseSeoOptimizationProposal, seoOptimizationJsonSchema } from "./optimizer";
import { latestSeoEvidence, readSeoCatalog, saveKeywordMapping, saveKeywordOpportunities, saveSeoAudit } from "./repository";
import type { KeywordOpportunity, SeoEvidence } from "./types";

export function assertAllowedSeoCrawlUrl(raw: string, environment: Readonly<Record<string, string | undefined>> = process.env) {
  const url = new URL(raw); const allowed = new Set((environment.SEO_CRAWL_ALLOWED_ORIGINS || "https://www.theseagulllabs.com").split(",").map((item) => item.trim()).filter(Boolean));
  if (environment.NODE_ENV === "development") allowed.add("http://127.0.0.1:3000");
  if (!allowed.has(url.origin)) throw new Error("SEO crawl origin is not approved");
  return url.toString();
}

async function resourceValid(url: string, fetcher: SeoFetch, validate: (value: string) => boolean) {
  try { const response = await fetcher(url, { redirect: "follow", signal: AbortSignal.timeout(10_000), headers: { "user-agent": "SGL-SEO-Growth-Agent/1.0" } }); return response.ok && validate(await response.text()); }
  catch { return false; }
}

export async function runSeoTechnicalAudit(input: { baseUrl: string; maxPages?: number; fetcher?: SeoFetch; triggerType?: "manual" | "scheduled"; scheduleScope?: "daily" | "weekly" | "monthly" | null }, actor: ContentDraftActor) {
  const approvedUrl = assertAllowedSeoCrawlUrl(input.baseUrl); const fetcher = input.fetcher || fetch; const origin = new URL(approvedUrl).origin;
  const [crawl, sitemapPresent, robotsPresent] = await Promise.all([
    crawlWebsite({ baseUrl: approvedUrl, maxPages: input.maxPages, fetcher }),
    resourceValid(`${origin}/sitemap.xml`, fetcher, validateSitemapDocument), resourceValid(`${origin}/robots.txt`, fetcher, validateRobotsDocument)
  ]);
  const issues = auditTechnicalSeo({ pages: crawl.pages, sitemapPresent, robotsPresent });
  const saved = await saveSeoAudit({ baseUrl: origin, triggerType: input.triggerType || "manual", scheduleScope: input.scheduleScope, pages: crawl.pages, issues }, actor);
  return { ...saved, discovered: crawl.discovered, sitemapPresent, robotsPresent };
}

export async function discoverCatalogKeywordOpportunities(locale = "en") {
  const catalog = await readSeoCatalog(); const now = new Date().toISOString();
  const raw = [...new Set(catalog.flatMap((item) => [item.title, `${item.category} ${item.title}`]))];
  const clusters = clusterKeywords(raw); const clusterByKeyword = new Map([...clusters].flatMap(([cluster, keywords]) => keywords.map((keyword) => [keyword, cluster])));
  const evidence: SeoEvidence[] = catalog.map((item) => ({ id: `catalog:product:${item.id}`, type: "catalog", label: `Existing catalogue title and category for ${item.slug}`, observedAt: now, recordId: item.id, value: `${item.title} | ${item.category}` }));
  const opportunities: KeywordOpportunity[] = raw.map((keyword) => {
    const matches = mapKeywordToCatalog(keyword, catalog.map((item) => ({ id: item.id, title: item.title, categoryId: item.category_id, category: item.category })));
    return { keyword, locale, intent: classifySearchIntent(keyword), cluster: clusterByKeyword.get(keyword) || keyword.toLowerCase(), sourceType: "catalog", sourceReference: "existing_product_catalog", metrics: {}, evidenceIds: matches.slice(0, 5).map((item) => `catalog:product:${item.id}`) };
  });
  const ids = await saveKeywordOpportunities(opportunities);
  for (const opportunity of opportunities) {
    const keywordId = ids.get(`${opportunity.keyword}\0${opportunity.locale}\0${opportunity.sourceReference}`); if (!keywordId) continue;
    for (const match of mapKeywordToCatalog(opportunity.keyword, catalog.map((item) => ({ id: item.id, title: item.title, categoryId: item.category_id, category: item.category }))).slice(0, 5)) {
      await saveKeywordMapping({ keywordId, productId: match.id, relevance: match.relevance, evidence: { evidenceIds: [`catalog:product:${match.id}`] } });
    }
    const categoryMatches = new Map(mapKeywordToCatalog(opportunity.keyword, catalog.map((item) => ({ id: item.id, title: item.title, categoryId: item.category_id, category: item.category }))).map((match) => [match.categoryId, match]));
    for (const match of [...categoryMatches.values()].slice(0, 5)) {
      await saveKeywordMapping({ keywordId, categoryId: match.categoryId, relevance: match.relevance, evidence: { evidenceIds: [`catalog:product:${match.id}`] } });
    }
  }
  return { opportunities, evidence };
}

export async function generateSeoOptimizationDraft(input: { pageUrl: string; productId?: string | null }, actor: Extract<ContentDraftActor, { type: "admin" }>, provider: StructuredLlmProvider = configuredLlmProvider()) {
  const evidence = await latestSeoEvidence(input.pageUrl);
  if (evidence.length === 0) throw new Error("No crawl evidence is available for this page");
  const catalog = await readSeoCatalog(); const allowedProducts = new Set(catalog.map((item) => item.id));
  if (input.productId && !allowedProducts.has(input.productId)) throw new Error("Product not found");
  const raw = await provider.generateObject({
    name: "sgl_seo_optimization_proposal",
    system: "You are the SEO Growth Agent for The Seagull Labs. Use only supplied evidence and catalogue identities. Never invent rankings, traffic, search volume, competitors, product facts, prices, or analytics. Every proposed change must cite evidence IDs. Canonical, redirect, robots and noindex changes must set requiresExplicitApproval=true; every other change must set it false. Avoid keyword stuffing. This is an editable proposal only and must never publish or change a URL.",
    prompt: `Create an on-page SEO optimization proposal for ${input.pageUrl}. Product ID if applicable: ${input.productId || "none"}. Evidence:\n${JSON.stringify(evidence)}`,
    schema: seoOptimizationJsonSchema as unknown as Record<string, unknown>
  });
  const proposal = parseSeoOptimizationProposal(raw, evidence, allowedProducts);
  if (proposal.pageUrl !== input.pageUrl) throw new Error("SEO proposal page URL differs from the requested page");
  const coordinatedProductId = proposal.productContentCoordination?.productId || input.productId || null;
  return createContentDraft({
    module: "seo_growth", kind: "seo_optimization_proposal", productId: coordinatedProductId,
    title: `SEO proposal: ${new URL(input.pageUrl).pathname || "/"}`, payload: proposal as unknown as Record<string, unknown>,
    sourceSnapshot: { pageUrl: input.pageUrl, evidence },
    generationMetadata: { provider: provider.providerName, model: provider.modelName, schema: "seo_optimization_proposal.v1", externalPublishing: "disabled" }
  }, actor);
}
