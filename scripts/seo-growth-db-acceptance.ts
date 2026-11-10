import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { closeDb, getDb } from "../lib/admin/db";
import { createContentDraft, updateContentDraft } from "../lib/content-drafts/repository";
import { saveSeoAudit } from "../lib/seo-growth/repository";
import { parseHtmlPage } from "../lib/seo-growth/crawler";
import { auditTechnicalSeo } from "../lib/seo-growth/technical-audit";
import { discoverCatalogKeywordOpportunities } from "../lib/seo-growth/service";
import { assertSafeMigrationTarget } from "./db-migrate";

async function main() {
  const target = assertSafeMigrationTarget(); if (target.mode !== "local-sandbox") throw new Error("SEO acceptance requires a local sandbox database");
  const db = getDb(); const adminId = randomUUID(); const categoryId = randomUUID(); const productId = randomUUID();
  await db`INSERT INTO admin_users(id,email,display_name,password_hash,password_salt,role) VALUES(${adminId},${`seo-test-${adminId}@example.invalid`},'TEST ONLY SEO Reviewer','hash','salt','owner')`;
  await db`INSERT INTO product_categories(id,slug,name) VALUES(${categoryId},${`seo-test-${categoryId}`},'TEST ONLY Cycling Bags')`;
  await db`INSERT INTO products(id,legacy_key,slug,original_handle,category_id,status,base_price_cents,currency) VALUES(${productId},${`seo-test-${productId}`},${`seo-test-${productId}`},${`seo-test-${productId}`},${categoryId},'unpublished',100,'USD')`;
  await db`INSERT INTO product_localizations(product_id,locale,title,description) VALUES(${productId},'en','TEST ONLY Handlebar Bag','TEST ONLY catalogue description')`;
  const page = parseHtmlPage({ html: '<html lang="en"><head><title>TEST ONLY</title></head><body><h1>TEST ONLY</h1><img src="/test.jpg"></body></html>', url: "https://www.theseagulllabs.com/test-only", statusCode: 200 });
  const issues = auditTechnicalSeo({ pages: [page], sitemapPresent: true, robotsPresent: true });
  const run = await saveSeoAudit({ baseUrl: "https://www.theseagulllabs.com", triggerType: "manual", pages: [page], issues }, { type: "admin", adminId, requestId: "test-seo-audit" });
  assert.equal(run.pages, 1); assert.ok(run.issues > 0);
  const evidence = issues[0]?.evidence || [];
  const draft = await createContentDraft({ module: "seo_growth", kind: "seo_optimization_proposal", title: "TEST ONLY SEO proposal", payload: { pageUrl: page.normalizedUrl, changes: [] }, sourceSnapshot: { pageUrl: page.normalizedUrl, evidence }, generationMetadata: { schema: "seo_optimization_proposal.v1", test: true } }, { type: "admin", adminId, requestId: "test-seo-draft" });
  const review = await updateContentDraft({ id: draft.id, expectedVersion: 1, nextStatus: "review", canApprove: false }, { type: "admin", adminId, requestId: "test-seo-review" });
  const approved = await updateContentDraft({ id: draft.id, expectedVersion: 2, nextStatus: "approved", canApprove: true }, { type: "admin", adminId, requestId: "test-seo-approve" });
  assert.equal(review?.status, "review"); assert.equal(approved?.status, "approved");
  const keywords = await discoverCatalogKeywordOpportunities("en"); assert.ok(keywords.opportunities.length > 0);
  const keywordRows = await db<{ keywords: number; mappings: number }[]>`SELECT (SELECT count(*)::int FROM seo_keywords) AS keywords,(SELECT count(*)::int FROM seo_keyword_mappings) AS mappings`;
  assert.ok((keywordRows[0]?.keywords || 0) > 0); assert.ok((keywordRows[0]?.mappings || 0) > 0);
  const audit = await db<{ count: number }[]>`SELECT count(*)::int AS count FROM audit_logs WHERE actor_user_id=${adminId} AND (action LIKE 'seo.%' OR action LIKE 'content_draft.%')`;
  assert.equal(audit[0]?.count, 4);
  console.log(JSON.stringify({ event: "seo_growth.db_acceptance.passed", database: target.database, pages: run.pages, issues: run.issues, keywords: keywordRows[0]?.keywords, mappings: keywordRows[0]?.mappings, draftStatus: approved?.status, auditEvents: audit[0]?.count }));
}
main().then(closeDb).catch(async (error) => { console.error(error instanceof Error ? error.message : "SEO DB acceptance failed"); await closeDb(); process.exitCode=1; });
