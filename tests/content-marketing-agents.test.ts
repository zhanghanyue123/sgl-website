import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configuredLlmProvider, LlmUnavailableError } from "../lib/ai/provider";
import { hasPermission } from "../lib/admin/permissions";
import { assertDraftTransition, publishingEnabled } from "../lib/content-drafts/workflow";
import { parseMarketingPlanPayload } from "../lib/marketing/schema";
import { marketingAgentTools } from "../lib/marketing/tools";
import { parseProductContentPayload } from "../lib/product-content/schema";
import { productContentAgentTools } from "../lib/product-content/tools";

const productId = "11111111-1111-4111-8111-111111111111";
const evidenceId = `product.${productId}.available`;
const productPayload = {
  descriptions: { en: "TEST ONLY English description", zhCN: "仅用于测试的中文描述" },
  seo: { en: { title: "TEST product title", metaDescription: "TEST meta description" }, zhCN: { title: "测试商品标题", metaDescription: "测试元描述" } },
  xiaohongshu: { title: "测试标题", body: "测试正文", hashtags: ["测试"] },
  instagram: { caption: "TEST caption", hashtags: ["test"] },
  campaignConcept: { name: "TEST concept", summary: "TEST summary", keyMessages: ["TEST message"], assetIdeas: ["TEST asset"] }
};
const marketingPayload = {
  weekStart: "2026-11-09", objective: "TEST ONLY weekly objective",
  recommendations: [{ productId, rationale: "TEST rationale", evidenceIds: [evidenceId] }],
  calendar: [{ date: "2026-11-09", channel: "instagram", productIds: [productId], contentBrief: "TEST content brief", evidenceIds: [evidenceId] }],
  channelContent: [{ channel: "instagram", productIds: [productId], headline: "TEST headline", body: "TEST channel copy", hashtags: ["test"], evidenceIds: [evidenceId] }],
  launchPlan: null,
  weeklyReport: { summary: "TEST summary", observations: [{ statement: "TEST observation", evidenceIds: [evidenceId] }], risks: ["TEST risk"], nextActions: ["TEST action"] }
};

test("product content schema validates bilingual, SEO, social and campaign drafts", () => {
  assert.deepEqual(parseProductContentPayload(productPayload), productPayload);
  assert.throws(() => parseProductContentPayload({ ...productPayload, seo: { ...productPayload.seo, en: { title: "x".repeat(71), metaDescription: "ok" } } }));
  assert.throws(() => parseProductContentPayload({ ...productPayload, instagram: { caption: "", hashtags: [] } }));
});

test("marketing schema accepts only known products and evidence-backed observations", () => {
  assert.deepEqual(parseMarketingPlanPayload(marketingPayload, new Set([productId]), new Set([evidenceId])), marketingPayload);
  assert.throws(() => parseMarketingPlanPayload(marketingPayload, new Set(), new Set([evidenceId])));
  assert.throws(() => parseMarketingPlanPayload(marketingPayload, new Set([productId]), new Set()));
  assert.throws(() => parseMarketingPlanPayload({ ...marketingPayload, calendar: [{ ...marketingPayload.calendar[0], channel: "unknown" }] }));
});

test("draft workflow requires review and approval and keeps publishing disabled", () => {
  assert.doesNotThrow(() => assertDraftTransition({ from: "draft", to: "review", canApprove: false }));
  assert.doesNotThrow(() => assertDraftTransition({ from: "review", to: "approved", canApprove: true }));
  assert.throws(() => assertDraftTransition({ from: "draft", to: "approved", canApprove: true }));
  assert.throws(() => assertDraftTransition({ from: "review", to: "approved", canApprove: false }));
  assert.throws(() => assertDraftTransition({ from: "approved", to: "published", canApprove: true, externalPublishingEnabled: false }));
  assert.equal(publishingEnabled({}), false);
});

test("content and marketing permissions separate reading, writing and approval", () => {
  assert.equal(hasPermission("viewer", "content:read"), true);
  assert.equal(hasPermission("viewer", "content:write"), false);
  assert.equal(hasPermission("editor", "content:approve"), true);
  assert.equal(hasPermission("editor", "marketing:write"), true);
  assert.equal(hasPermission("inventory", "marketing:read"), false);
});

test("provider remains disabled unless a complete provider-independent configuration exists", async () => {
  const provider = configuredLlmProvider({ NODE_ENV: "development" });
  assert.equal(provider.providerName, "disabled");
  await assert.rejects(() => provider.generateObject({ name: "test", system: "test", prompt: "test", schema: {} }), LlmUnavailableError);
});

test("agent tools create drafts only and require dedicated scopes", () => {
  assert.equal(productContentAgentTools[0].requiredScope, "content:draft");
  assert.equal(marketingAgentTools[0].requiredScope, "marketing:draft");
  for (const tool of [productContentAgentTools[0], marketingAgentTools[0]]) {
    assert.doesNotMatch(`${tool.name} ${tool.method} ${tool.path}`, /publish|send|schedule/);
  }
});

test("PostgreSQL persistence reuses product and agent identities and records draft audit events", async () => {
  const migration = await readFile(new URL("../db/migrations/0009_content_marketing_agents.sql", import.meta.url), "utf8");
  const repository = await readFile(new URL("../lib/content-drafts/repository.ts", import.meta.url), "utf8");
  assert.match(migration, /product_id uuid REFERENCES products\(id\)/);
  assert.match(migration, /created_by_agent_client_id uuid REFERENCES agent_clients\(id\)/);
  assert.match(migration, /status IN \('draft','review','approved','published'\)/);
  assert.match(migration, /CREATE TABLE content_draft_events/);
  assert.match(repository, /INSERT INTO content_drafts/);
  assert.match(repository, /INSERT INTO content_draft_events/);
  assert.match(repository, /version=version\+1/);
  assert.doesNotMatch(migration, /CREATE TABLE (products|orders|order_items|product_variants)/);
});
