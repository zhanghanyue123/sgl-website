import { randomUUID } from "node:crypto";
import { getDb, toJson } from "@/lib/admin/db";
import type { ContentDraftActor } from "@/lib/content-drafts/types";
import type { CrawledPage, KeywordOpportunity, SeoIssue, SearchPerformanceRow } from "./types";

const actorIds = (actor: ContentDraftActor) => actor.type === "admin" ? { admin: actor.adminId, agent: null } : { admin: null, agent: actor.clientId };

export async function saveSeoAudit(input: { baseUrl: string; triggerType: "manual" | "scheduled"; scheduleScope?: "daily" | "weekly" | "monthly" | null; pages: CrawledPage[]; issues: SeoIssue[]; errorSummary?: string | null }, actor: ContentDraftActor) {
  return getDb().begin(async (tx) => {
    const runId = randomUUID(); const actorId = actorIds(actor);
    await tx`INSERT INTO seo_crawl_runs(id,base_url,trigger_type,schedule_scope,status,pages_discovered,pages_audited,issues_found,error_summary,created_by_admin_id,created_by_agent_client_id,finished_at)
      VALUES(${runId},${input.baseUrl},${input.triggerType},${input.scheduleScope || null},${input.errorSummary ? "failed" : "completed"},${input.pages.length},${input.pages.length},${input.issues.length},${input.errorSummary || null},${actorId.admin},${actorId.agent},now())`;
    const pageIds = new Map<string, string>();
    for (const page of input.pages) {
      const id = randomUUID(); pageIds.set(page.normalizedUrl, id);
      await tx`INSERT INTO seo_crawl_pages(id,run_id,url,normalized_url,status_code,redirect_chain,canonical_url,locale,title,meta_description,headings,hreflang,internal_links,images,schema_types,mobile_metrics,response_ms,fetched_at)
        VALUES(${id},${runId},${page.url},${page.normalizedUrl},${page.statusCode},${tx.json(toJson(page.redirectChain))},${page.canonicalUrl},${page.locale},${page.title},${page.metaDescription},${tx.json(toJson(page.headings))},${tx.json(toJson(page.hreflang))},${tx.json(toJson(page.internalLinks))},${tx.json(toJson(page.images))},${tx.json(toJson(page.schemaTypes))},${tx.json(toJson(page.mobileMetrics))},${page.responseMs},${page.fetchedAt})`;
    }
    for (const finding of input.issues) {
      const fingerprint = `${finding.type}:${finding.pageUrl || "site"}`;
      await tx`INSERT INTO seo_issues(id,run_id,page_id,fingerprint,issue_type,severity,page_url,summary,evidence)
        VALUES(${randomUUID()},${runId},${finding.pageUrl ? pageIds.get(finding.pageUrl) || null : null},${fingerprint},${finding.type},${finding.severity},${finding.pageUrl},${finding.summary},${tx.json(toJson({ sources: finding.evidence }))})`;
    }
    if (actor.type === "admin") await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data,request_id)
      VALUES(${randomUUID()},${actor.adminId},'seo.audit.completed','seo_crawl_run',${runId},${tx.json(toJson({ pages: input.pages.length, issues: input.issues.length, status: input.errorSummary ? "failed" : "completed" }))},${actor.requestId || null})`;
    return { id: runId, pages: input.pages.length, issues: input.issues.length, status: input.errorSummary ? "failed" : "completed" };
  });
}

export async function saveKeywordOpportunities(opportunities: KeywordOpportunity[]) {
  const db = getDb();
  const ids = new Map<string, string>();
  for (const item of opportunities) {
    const id = randomUUID();
    const rows = await db<{ id: string }[]>`INSERT INTO seo_keywords(id,keyword,locale,intent,cluster_name,source_type,source_reference,metrics)
    VALUES(${id},${item.keyword},${item.locale},${item.intent},${item.cluster},${item.sourceType},${item.sourceReference},${db.json(toJson(item.metrics))})
    ON CONFLICT(lower(keyword),locale,source_type,source_reference) DO UPDATE SET intent=EXCLUDED.intent,cluster_name=EXCLUDED.cluster_name,metrics=EXCLUDED.metrics,updated_at=now() RETURNING id`;
    if (rows[0]) ids.set(`${item.keyword}\0${item.locale}\0${item.sourceReference}`, rows[0].id || id);
  }
  return ids;
}

export async function saveKeywordMapping(input: { keywordId: string; productId?: string; categoryId?: string; pageUrl?: string; relevance: number; evidence: Record<string, unknown> }) {
  const db = getDb();
  await db`INSERT INTO seo_keyword_mappings(keyword_id,product_id,category_id,page_url,relevance,evidence)
    VALUES(${input.keywordId},${input.productId || null},${input.categoryId || null},${input.pageUrl || null},${input.relevance},${db.json(toJson(input.evidence))})
    ON CONFLICT(keyword_id,product_id,category_id,page_url) DO UPDATE SET relevance=EXCLUDED.relevance,evidence=EXCLUDED.evidence`;
}

export async function savePerformanceSnapshot(provider: "google_search_console" | "bing_webmaster" | "ga4", period: { start: string; end: string }, rows: SearchPerformanceRow[]) {
  const db = getDb();
  for (const row of rows) {
    const dimensions = { query: row.query, page: row.page, country: row.country, device: row.device, language: row.language };
    const metrics = { impressions: row.impressions, clicks: row.clicks, ctr: row.ctr, averagePosition: row.averagePosition, sessions: row.sessions };
    await db`INSERT INTO seo_performance_snapshots(id,provider,period_start,period_end,dimensions,metrics,evidence_reference)
      VALUES(${randomUUID()},${provider},${period.start},${period.end},${db.json(toJson(dimensions))},${db.json(toJson(metrics))},${row.evidence.id})
      ON CONFLICT(provider,period_start,period_end,dimensions) DO UPDATE SET metrics=EXCLUDED.metrics,evidence_reference=EXCLUDED.evidence_reference,collected_at=now()`;
  }
}

export async function seoOverview() {
  const db = getDb();
  const counts = await db<{ open_issues: number; critical_issues: number; crawl_runs: number; keyword_count: number; performance_count: number }[]>`SELECT
    (SELECT count(*)::int FROM seo_issues WHERE status='open') AS open_issues,
    (SELECT count(*)::int FROM seo_issues WHERE status='open' AND severity IN ('critical','high')) AS critical_issues,
    (SELECT count(*)::int FROM seo_crawl_runs) AS crawl_runs,
    (SELECT count(*)::int FROM seo_keywords) AS keyword_count,
    (SELECT count(*)::int FROM seo_performance_snapshots) AS performance_count`;
  const runs = await db`SELECT * FROM seo_crawl_runs ORDER BY started_at DESC LIMIT 20`;
  return { counts: counts[0] || { open_issues: 0, critical_issues: 0, crawl_runs: 0, keyword_count: 0, performance_count: 0 }, runs };
}
export async function listSeoIssues() { return getDb()`SELECT * FROM seo_issues ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,last_seen_at DESC LIMIT 500`; }
export async function listSeoKeywords() { return getDb()`SELECT * FROM seo_keywords ORDER BY updated_at DESC LIMIT 500`; }
export async function listSeoPerformance() { return getDb()`SELECT * FROM seo_performance_snapshots ORDER BY period_end DESC,collected_at DESC LIMIT 500`; }
export async function latestSeoEvidence(pageUrl?: string) {
  const db=getDb();
  const rows = await db<SeoIssue[]>`SELECT issue_type AS type,severity,page_url AS "pageUrl",summary,(evidence->'sources') AS evidence
    FROM seo_issues WHERE status='open' AND (${pageUrl || null}::text IS NULL OR page_url=${pageUrl || null}) ORDER BY last_seen_at DESC LIMIT 100`;
  const search=await db<Array<{id:string;property_uri:string;query:string|null;page_url:string|null;clicks:number;impressions:number;ctr:number;average_position:number;observed_at:string}>>`SELECT id,property_uri,query,page_url,clicks,impressions,ctr,average_position,observed_at FROM search_console_evidence WHERE (${pageUrl || null}::text IS NULL OR page_url=${pageUrl || null}) ORDER BY period_end DESC,observed_at DESC LIMIT 100`;
  return [...rows.flatMap((row) => row.evidence || []),...search.map(item=>({id:`gsc:evidence:${item.id}`,type:"search_performance" as const,label:`Verified Google Search Console metrics${item.query?` for query ${item.query}`:""}`,sourceUrl:item.page_url||item.property_uri,observedAt:new Date(item.observed_at).toISOString(),recordId:item.id,value:JSON.stringify({clicks:item.clicks,impressions:item.impressions,ctr:item.ctr,averagePosition:item.average_position})}))];
}

export async function readSeoCatalog() {
  return getDb()<{ id: string; title: string; category_id: string; category: string; slug: string }[]>`SELECT p.id,COALESCE(l.title,p.slug) AS title,c.id AS category_id,c.name AS category,p.slug
    FROM products p JOIN product_categories c ON c.id=p.category_id LEFT JOIN product_localizations l ON l.product_id=p.id AND l.locale='en'
    WHERE p.status IN ('published','unpublished') ORDER BY p.updated_at DESC`;
}

export async function recordOptimizationResult(input: { draftId: string; pageUrl: string; baselineEvidence: Record<string, unknown>; followupEvidence?: Record<string, unknown> | null }) {
  const db = getDb(); const id = randomUUID();
  const rows = await db<{ id: string }[]>`INSERT INTO seo_optimization_results(id,draft_id,page_url,baseline_evidence,followup_evidence,evaluated_at)
    VALUES(${id},${input.draftId},${input.pageUrl},${db.json(toJson(input.baselineEvidence))},${input.followupEvidence ? db.json(toJson(input.followupEvidence)) : null},${input.followupEvidence ? new Date() : null})
    ON CONFLICT(draft_id,page_url) DO UPDATE SET followup_evidence=EXCLUDED.followup_evidence,evaluated_at=EXCLUDED.evaluated_at RETURNING id`;
  return rows[0];
}
