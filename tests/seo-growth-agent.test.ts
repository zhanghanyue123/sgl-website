import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { crawlWebsite, isPublicSeoCrawlUrl, parseHtmlPage } from "../lib/seo-growth/crawler";
import { auditTechnicalSeo, duplicateMetadataIssues, validateCanonical, validateHreflang, validateRobotsDocument, validateSitemapDocument } from "../lib/seo-growth/technical-audit";
import { classifySearchIntent, DisabledKeywordProvider, detectKeywordCannibalization, KeywordProviderUnavailableError, mapKeywordToCatalog } from "../lib/seo-growth/keyword-research";
import { assertEvidenceReferences } from "../lib/seo-growth/evidence";
import { parseSeoOptimizationProposal } from "../lib/seo-growth/optimizer";
import { DisabledSearchPerformanceProvider, SearchPerformanceUnavailableError, analyzeSearchPerformance } from "../lib/seo-growth/search-performance";
import { assertSeoSchedulesInactive, seoScheduleTargets } from "../lib/seo-growth/scheduler";
import { assertAllowedSeoCrawlUrl } from "../lib/seo-growth/service";
import { seoGrowthAgentTools } from "../lib/seo-growth/tools";
import { assertDraftTransition } from "../lib/content-drafts/workflow";
import { hasPermission } from "../lib/admin/permissions";
import { baiduSearchResourceStatus } from "../lib/seo-growth/providers/baidu-search-resource";
import { configuredGoogleSearchConsole } from "../lib/seo-growth/providers/google-search-console";

const html = (options: { title?: string; canonical?: string; reciprocal?: string; links?: string; product?: boolean } = {}) => `<!doctype html><html lang="en"><head><title>${options.title || "SGL Page"}</title><meta name="description" content="A useful SGL page"><link rel="canonical" href="${options.canonical || "https://www.theseagulllabs.com/"}">${options.reciprocal || ""}<script type="application/ld+json">{"@type":"${options.product ? "Product" : "WebPage"}"}</script></head><body><h1>Title</h1><h2>Section</h2><a href="${options.links || "/shop"}">Shop</a><img src="/image.jpg" alt="Product"></body></html>`;

test("crawler stays on the approved origin and records redirects and page structure", async () => {
  const responses = new Map<string, Response>([
    ["https://www.theseagulllabs.com/", new Response(html({ links: "/shop" }), { status: 200, headers: { "content-type": "text/html" } })],
    ["https://www.theseagulllabs.com/shop", new Response(html({ canonical: "https://www.theseagulllabs.com/shop", links: "https://external.example/x" }), { status: 200, headers: { "content-type": "text/html" } })]
  ]);
  const result = await crawlWebsite({ baseUrl: "https://www.theseagulllabs.com", maxPages: 5, fetcher: async (url) => responses.get(url) || new Response("missing", { status: 404 }) });
  assert.equal(result.pages.length, 2); assert.deepEqual(result.pages[0].headings.h1, ["Title"]); assert.equal(result.pages[1].internalLinks.length, 0);
  assert.throws(() => assertAllowedSeoCrawlUrl("http://127.0.0.1:8080/admin", {}), /not approved/);
});

test("crawler refuses private routes, sensitive localized routes, and oversized pages", async () => {
  const origin = "https://www.theseagulllabs.com";
  for (const path of ["/admin", "/api/orders", "/account", "/en/account/orders", "/checkout", "/payment/status", "/login"]) {
    assert.equal(isPublicSeoCrawlUrl(origin + path, origin), false, path);
  }
  assert.equal(isPublicSeoCrawlUrl(origin + "/en/shop", origin), true);
  const linkedPage = '<!doctype html><html lang="en"><head><title>SGL</title><meta name="description" content="SGL"><link rel="canonical" href="https://www.theseagulllabs.com/"></head><body><h1>SGL</h1><h2>Shop</h2><a href="/shop">Shop</a><a href="/admin">Admin</a><a href="/en/account">Account</a><a href="/api/orders">API</a></body></html>';
  const result = await crawlWebsite({ baseUrl: origin, maxPages: 10, fetcher: async (url) => {
    if (url === origin + "/") return new Response(linkedPage, { status: 200, headers: { "content-type": "text/html" } });
    return new Response(html({ canonical: String(url), links: "https://external.example" }), { status: 200, headers: { "content-type": "text/html" } });
  } });
  assert.deepEqual(result.pages.map((page) => page.normalizedUrl), [origin + "/", origin + "/shop"]);
  await assert.rejects(() => crawlWebsite({ baseUrl: origin, maxPages: 1, fetcher: async () => new Response("x", { headers: { "content-type": "text/html", "content-length": String(2 * 1024 * 1024 + 1) } }) }), /size limit/);
});

test("crawler follows directory-slash redirects without normalizing them into a loop", async () => {
  const origin = "https://cn.theseagulllabs.com";
  const requests: string[] = [];
  const result = await crawlWebsite({ baseUrl: origin + "/shop", maxPages: 1, fetcher: async (url) => {
    requests.push(String(url));
    if (url === origin + "/shop") return new Response(null, { status: 301, headers: { location: "/shop/" } });
    return new Response(html({ canonical: origin + "/shop/", links: "https://external.example" }), { status: 200, headers: { "content-type": "text/html" } });
  } });
  assert.deepEqual(requests, [origin + "/shop", origin + "/shop/"]);
  assert.equal(result.pages[0]?.statusCode, 200);
});

test("canonical and technical validation report evidence-linked findings", () => {
  assert.equal(validateSitemapDocument('<?xml version="1.0"?><urlset></urlset>'), true); assert.equal(validateSitemapDocument("<html></html>"), false);
  assert.equal(validateRobotsDocument("User-agent: *\nDisallow: /admin"), true); assert.equal(validateRobotsDocument("<html>error</html>"), false);
  const page = parseHtmlPage({ html: html({ canonical: "https://www.theseagulllabs.com/other" }), url: "https://www.theseagulllabs.com/page", statusCode: 200 });
  const canonical = validateCanonical(page); assert.equal(canonical[0]?.type, "canonical_mismatch"); assert.ok(canonical[0]?.evidence[0].sourceUrl);
  const issues = auditTechnicalSeo({ pages: [{ ...page, images: [{ src: "/x", alt: null }], schemaTypes: [] }], sitemapPresent: false, robotsPresent: true });
  assert.ok(issues.some((item) => item.type === "sitemap_unavailable")); assert.ok(issues.some((item) => item.type === "image_alt_missing"));
});

test("hreflang validation requires crawled reciprocal targets", () => {
  const en = parseHtmlPage({ html: html({ canonical: "https://www.theseagulllabs.com/", reciprocal: '<link rel="alternate" hreflang="it-IT" href="https://www.theseagulllabs.com/it">' }), url: "https://www.theseagulllabs.com/", statusCode: 200 });
  const it = parseHtmlPage({ html: html({ canonical: "https://www.theseagulllabs.com/it" }), url: "https://www.theseagulllabs.com/it", statusCode: 200 });
  assert.equal(validateHreflang([en, it])[0]?.type, "hreflang_not_reciprocal");
  it.hreflang.en = en.normalizedUrl; assert.equal(validateHreflang([en, it]).length, 0);
});

test("duplicate title and meta descriptions are detected", () => {
  const first = parseHtmlPage({ html: html({ canonical: "https://www.theseagulllabs.com/a" }), url: "https://www.theseagulllabs.com/a", statusCode: 200 });
  const second = parseHtmlPage({ html: html({ canonical: "https://www.theseagulllabs.com/b" }), url: "https://www.theseagulllabs.com/b", statusCode: 200 });
  const issues = duplicateMetadataIssues([first, second]); assert.equal(issues.filter((item) => item.type === "duplicate_title").length, 2); assert.equal(issues.filter((item) => item.type === "duplicate_meta_description").length, 2);
});

test("keyword intent and product mapping use catalog text without invented metrics", () => {
  assert.equal(classifySearchIntent("buy cycling handlebar bag"), "transactional");
  const mappings = mapKeywordToCatalog("cycling handlebar bag", [{ id: "p1", title: "Handlebar Bag", categoryId: "c1", category: "Cycling Bags" }, { id: "p2", title: "Cap", categoryId: "c2", category: "Wear" }]);
  assert.equal(mappings[0]?.id, "p1"); assert.ok(mappings[0].relevance > 0); assert.ok(!("searchVolume" in mappings[0]));
});

test("all factual insights and cannibalization findings require known evidence", () => {
  const evidence = [{ id: "gsc:q1", type: "search_performance" as const, label: "Verified GSC query row", observedAt: new Date().toISOString() }];
  assert.deepEqual(assertEvidenceReferences(["gsc:q1"], evidence), ["gsc:q1"]); assert.throws(() => assertEvidenceReferences(["made-up"], evidence), /unknown evidence/);
  const findings = detectKeywordCannibalization([{ keyword: "cycling bag", pageUrl: "/a", evidenceIds: ["gsc:q1"] }, { keyword: "cycling bag", pageUrl: "/b", evidenceIds: ["gsc:q1"] }], evidence);
  assert.deepEqual(findings[0]?.pages, ["/a", "/b"]);
});

test("optimization proposals enforce evidence and explicit approval for sensitive changes", () => {
  const evidence = [{ id: "crawl:page:title", type: "crawl" as const, label: "Observed title", observedAt: new Date().toISOString(), sourceUrl: "https://www.theseagulllabs.com/shop/bag" }];
  const proposal = parseSeoOptimizationProposal({ pageUrl: "https://www.theseagulllabs.com/shop/bag", targetLocale: "en", summary: "Improve the observed title.", changes: [{ type: "canonical", currentValue: null, recommendedValue: "https://www.theseagulllabs.com/shop/bag", rationale: "Use the crawled preferred URL.", evidenceIds: ["crawl:page:title"], requiresExplicitApproval: true }], productContentCoordination: { productId: "00000000-0000-0000-0000-000000000001", requestedFields: ["seo title"] } }, evidence, new Set(["00000000-0000-0000-0000-000000000001"]));
  assert.equal(proposal.changes[0].requiresExplicitApproval, true);
  assert.throws(() => parseSeoOptimizationProposal({ ...proposal, changes: [{ ...proposal.changes[0], requiresExplicitApproval: false }] }, evidence), /approval classification/);
});

test("SEO approval reuses the draft workflow and publishing stays disabled", () => {
  assert.equal(hasPermission("viewer", "seo:read"), true); assert.equal(hasPermission("viewer", "seo:write"), false); assert.equal(hasPermission("editor", "seo:approve"), true);
  assert.doesNotThrow(() => assertDraftTransition({ from: "review", to: "approved", canApprove: true }));
  assert.throws(() => assertDraftTransition({ from: "approved", to: "published", canApprove: true, externalPublishingEnabled: false }), /disabled/);
});

test("unconfigured external providers fail explicitly and analytics are never fabricated", async () => {
  await assert.rejects(() => new DisabledKeywordProvider().discover({ seed: "bag", locale: "en" }), KeywordProviderUnavailableError);
  await assert.rejects(() => new DisabledSearchPerformanceProvider().query({ startDate: "2026-01-01", endDate: "2026-01-31", dimensions: ["query"] }), SearchPerformanceUnavailableError);
  assert.deepEqual(analyzeSearchPerformance([]), { highImpressionLowCtr: [], rankingOpportunities: [], pages: [] });
  assert.deepEqual(baiduSearchResourceStatus({}), { configured: false, connected: false, site: null, reason: "Baidu Search Resource Platform site is not configured" });
  const baidu = baiduSearchResourceStatus({ BAIDU_SEARCH_RESOURCE_SITE: "https://cn.theseagulllabs.com" });
  assert.equal(baidu.configured, true); assert.equal(baidu.connected, false); assert.match(baidu.reason, /not configured/);
});

test("Google Search Console maps only verified read-only evidence", async () => {
  const requests: string[] = [];
  const provider = configuredGoogleSearchConsole({
    GOOGLE_SEARCH_CONSOLE_CLIENT_ID: "client",
    GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET: "secret",
    GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN: "refresh",
    GOOGLE_SEARCH_CONSOLE_PROPERTY: "https://www.theseagulllabs.com/"
  }, async (input) => {
    const url = String(input); requests.push(url);
    if (url.includes("oauth2.googleapis.com")) return Response.json({ access_token: "temporary-token" });
    if (url.endsWith("/sites")) return Response.json({ siteEntry: [{ siteUrl: "https://www.theseagulllabs.com/", permissionLevel: "siteRestrictedUser" }] });
    return Response.json({ rows: [{ keys: ["cycling bag", "https://www.theseagulllabs.com/shop/bag"], clicks: 2, impressions: 40, ctr: 0.05, position: 8.5 }] });
  });
  const rows = await provider.query({ startDate: "2026-10-01", endDate: "2026-10-31", dimensions: ["query", "page"] });
  assert.equal(rows.length, 1); assert.equal(rows[0].impressions, 40); assert.equal(rows[0].averagePosition, 8.5);
  assert.equal(rows[0].evidence.type, "search_performance"); assert.equal(requests.length, 4);
  assert.throws(() => configuredGoogleSearchConsole({}), SearchPerformanceUnavailableError);
});

test("SEO scopes, tools, schedules and database audit contracts are explicit", async () => {
  assert.ok(seoGrowthAgentTools.every((tool) => tool.requiredScope.startsWith("seo:")));
  assert.ok(seoGrowthAgentTools.every((tool) => !/publish|delete/i.test(tool.name)));
  assert.equal(assertSeoSchedulesInactive(), true); assert.ok(seoScheduleTargets.every((item) => item.active === false));
  const migration = await readFile(new URL("../db/migrations/0010_seo_growth_agent.sql", import.meta.url), "utf8");
  for (const table of ["seo_crawl_runs", "seo_crawl_pages", "seo_issues", "seo_keywords", "seo_keyword_mappings", "seo_performance_snapshots", "seo_optimization_results"]) assert.match(migration, new RegExp(`CREATE TABLE ${table}`));
  assert.match(migration, /REFERENCES products\(id\)/); assert.match(migration, /REFERENCES content_drafts\(id\)/); assert.doesNotMatch(migration, /CREATE TABLE (products|product_categories|admin_users|agent_clients)/);
});
