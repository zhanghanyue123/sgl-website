import { crawlEvidence } from "./evidence";
import type { CrawledPage, SeoIssue } from "./types";

export function validateSitemapDocument(xml: string) {
  return /^\s*<\?xml[\s\S]*<(urlset|sitemapindex)\b/i.test(xml) || /^\s*<(urlset|sitemapindex)\b/i.test(xml);
}

export function validateRobotsDocument(value: string) {
  return /(^|\n)\s*user-agent\s*:/i.test(value) && !/^\s*<html/i.test(value);
}

const issue = (page: CrawledPage | null, type: string, severity: SeoIssue["severity"], summary: string, field: string, value: string | number | boolean | null): SeoIssue => ({
  type, severity, pageUrl: page?.normalizedUrl || null, summary,
  evidence: [page
    ? crawlEvidence(page.normalizedUrl, field, value, page.fetchedAt)
    : { id: `crawl:site:${field}`, type: "crawl", label: `${field} observed during website crawl`, observedAt: new Date().toISOString(), value }]
});

export function validateCanonical(page: CrawledPage): SeoIssue[] {
  if (!page.canonicalUrl) return [issue(page, "canonical_missing", "high", "Page has no canonical URL", "canonical", null)];
  if (page.canonicalUrl !== page.normalizedUrl) return [issue(page, "canonical_mismatch", "medium", "Canonical URL differs from the crawled URL", "canonical", page.canonicalUrl)];
  return [];
}

export function validateHreflang(pages: readonly CrawledPage[]): SeoIssue[] {
  const byUrl = new Map(pages.map((page) => [page.normalizedUrl, page])); const issues: SeoIssue[] = [];
  for (const page of pages) for (const [language, target] of Object.entries(page.hreflang)) {
    const targetPage = byUrl.get(target);
    if (!targetPage) issues.push(issue(page, "hreflang_target_missing", "high", `Hreflang ${language} target was not crawled`, `hreflang.${language}`, target));
    else if (!Object.values(targetPage.hreflang).includes(page.normalizedUrl)) issues.push(issue(page, "hreflang_not_reciprocal", "high", `Hreflang ${language} has no reciprocal return link`, `hreflang.${language}`, target));
  }
  return issues;
}

export function duplicateMetadataIssues(pages: readonly CrawledPage[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  for (const [field, type] of [["title", "duplicate_title"], ["metaDescription", "duplicate_meta_description"]] as const) {
    const groups = new Map<string, CrawledPage[]>();
    for (const page of pages) { const value = page[field]?.trim().toLowerCase(); if (value) groups.set(value, [...(groups.get(value) || []), page]); }
    for (const matches of groups.values()) if (matches.length > 1) for (const page of matches) issues.push(issue(page, type, "medium", `${field} is duplicated across ${matches.length} pages`, field, page[field]));
  }
  return issues;
}

export function auditTechnicalSeo(input: { pages: readonly CrawledPage[]; sitemapPresent?: boolean; robotsPresent?: boolean }): SeoIssue[] {
  const issues: SeoIssue[] = [];
  if (input.sitemapPresent === false) issues.push(issue(null, "sitemap_unavailable", "critical", "Sitemap could not be retrieved", "sitemap", false));
  if (input.robotsPresent === false) issues.push(issue(null, "robots_unavailable", "high", "Robots.txt could not be retrieved", "robots", false));
  const knownStatuses = new Map(input.pages.map((page) => [page.normalizedUrl, page.statusCode]));
  for (const page of input.pages) {
    if (page.statusCode >= 400) issues.push(issue(page, "http_error", page.statusCode >= 500 ? "critical" : "high", `Page returned HTTP ${page.statusCode}`, "status", page.statusCode));
    if (page.redirectChain.length > 1) issues.push(issue(page, "redirect_chain", "medium", "Page uses a multi-hop redirect chain", "redirect_hops", page.redirectChain.length));
    if (!page.title) issues.push(issue(page, "title_missing", "high", "Page title is missing", "title", null));
    if (!page.metaDescription) issues.push(issue(page, "meta_description_missing", "medium", "Meta description is missing", "meta_description", null));
    if (page.headings.h1.length !== 1) issues.push(issue(page, "h1_structure", "medium", `Page has ${page.headings.h1.length} H1 elements`, "h1_count", page.headings.h1.length));
    if (page.headings.h2.length === 0) issues.push(issue(page, "h2_missing", "low", "Page has no H2 structure", "h2_count", 0));
    const missingAlt = page.images.filter((image) => image.alt === null || !image.alt.trim()).length;
    if (missingAlt) issues.push(issue(page, "image_alt_missing", "medium", `${missingAlt} images have no alt text`, "missing_alt_count", missingAlt));
    if (page.schemaTypes.includes("InvalidJsonLd")) issues.push(issue(page, "structured_data_invalid", "high", "Page contains invalid JSON-LD", "schema", "InvalidJsonLd"));
    if (/\/shop\//.test(new URL(page.normalizedUrl).pathname) && !page.schemaTypes.includes("Product")) issues.push(issue(page, "product_schema_missing", "high", "Product page has no Product schema", "schema.Product", false));
    if (/\/shop\//.test(new URL(page.normalizedUrl).pathname) && !page.schemaTypes.includes("BreadcrumbList")) issues.push(issue(page, "breadcrumb_schema_missing", "medium", "Product page has no Breadcrumb schema", "schema.BreadcrumbList", false));
    issues.push(...validateCanonical(page));
    for (const link of page.internalLinks) if ((knownStatuses.get(link) || 0) >= 400) issues.push(issue(page, "broken_internal_link", "high", `Internal link returns HTTP ${knownStatuses.get(link)}`, "broken_link", link));
    if (page.responseMs !== null && page.responseMs > 2500) issues.push(issue(page, "slow_response", "medium", "Server response exceeded 2.5 seconds", "response_ms", page.responseMs));
    const lcp = page.mobileMetrics.lcpMs; const cls = page.mobileMetrics.cls; const inp = page.mobileMetrics.inpMs;
    if (typeof lcp === "number" && lcp > 2500) issues.push(issue(page, "core_web_vital_lcp", "medium", "Measured mobile LCP exceeds 2.5 seconds", "mobile.lcp_ms", lcp));
    if (typeof cls === "number" && cls > 0.1) issues.push(issue(page, "core_web_vital_cls", "medium", "Measured mobile CLS exceeds 0.1", "mobile.cls", cls));
    if (typeof inp === "number" && inp > 200) issues.push(issue(page, "core_web_vital_inp", "medium", "Measured mobile INP exceeds 200 ms", "mobile.inp_ms", inp));
  }
  return [...issues, ...validateHreflang(input.pages), ...duplicateMetadataIssues(input.pages)];
}
