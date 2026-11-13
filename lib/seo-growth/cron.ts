import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { getDb, toJson } from "@/lib/admin/db";
import type { ContentDraftActor } from "@/lib/content-drafts/types";
import { discoverCatalogKeywordOpportunities, runSeoTechnicalAudit } from "./service";
import { saveSeoAudit } from "./repository";

export type SeoCronCadence = "daily" | "weekly";
type CronEnvironment = Readonly<Record<string, string | undefined>>;

export class SeoCronError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const digest = (value: string) => createHash("sha256").update(value).digest();

export function authorizeSeoCron(authorization: string | null, environment: CronEnvironment = process.env) {
  if (environment.SEO_CRON_ENABLED !== "true") throw new SeoCronError(503, "SEO schedules are disabled");
  const secret = environment.CRON_SECRET || "";
  if (secret.length < 32) throw new SeoCronError(503, "SEO cron authentication is not configured");
  const match = authorization?.match(/^Bearer (.+)$/);
  if (!match || !timingSafeEqual(digest(match[1]), digest(secret))) throw new SeoCronError(401, "Unauthorized");
}

export function shanghaiScheduleWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const date = `${value("year")}-${value("month")}-${value("day")}`;
  const start = new Date(`${date}T00:00:00+08:00`);
  return { date, start, end: new Date(start.getTime() + 86_400_000) };
}

async function cronActor(): Promise<Extract<ContentDraftActor, { type: "agent" }>> {
  const rows = await getDb()<Array<{ client_id: string; token_id: string }>>`
    SELECT c.id AS client_id,t.id AS token_id
    FROM agent_clients c JOIN agent_tokens t ON t.client_id=c.id
    WHERE c.active=true AND c.revoked_at IS NULL AND t.revoked_at IS NULL AND t.expires_at>now()
      AND t.scopes ? 'seo:audit'
    ORDER BY t.created_at DESC LIMIT 1`;
  if (!rows[0]) throw new SeoCronError(503, "No active SEO audit service identity is configured");
  return { type: "agent", clientId: rows[0].client_id, tokenId: rows[0].token_id, requestId: `seo-cron-${randomUUID()}` };
}

const safeError = (error: unknown) => (error instanceof Error ? error.message : "Unknown SEO audit failure").slice(0, 500);

async function scheduledAudit(input: { baseUrl: string; cadence: SeoCronCadence; maxPages: number; actor: Extract<ContentDraftActor, { type: "agent" }>; now: Date }) {
  const db = getDb();
  const window = shanghaiScheduleWindow(input.now);
  const leaseKey = `seo:${input.cadence}:${window.date}:${new URL(input.baseUrl).origin}`;
  return db.begin(async (tx) => {
    const lock = await tx<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtextextended(${leaseKey},0)) AS acquired`;
    if (!lock[0]?.acquired) return { status: "running" as const, baseUrl: input.baseUrl };
    const existing = await tx<Array<{ id: string; status: string; pages_audited: number; issues_found: number }>>`
      SELECT id,status,pages_audited,issues_found FROM seo_crawl_runs
      WHERE base_url=${new URL(input.baseUrl).origin} AND trigger_type='scheduled' AND schedule_scope=${input.cadence}
        AND started_at>=${window.start} AND started_at<${window.end}
      ORDER BY started_at DESC LIMIT 1`;
    if (existing[0]) return { status: "skipped" as const, baseUrl: input.baseUrl, run: existing[0] };
    try {
      const run = await runSeoTechnicalAudit({ baseUrl: input.baseUrl, maxPages: input.maxPages, triggerType: "scheduled", scheduleScope: input.cadence }, input.actor);
      return { status: "completed" as const, baseUrl: input.baseUrl, run };
    } catch (error) {
      const message = safeError(error);
      const run = await saveSeoAudit({ baseUrl: new URL(input.baseUrl).origin, triggerType: "scheduled", scheduleScope: input.cadence, pages: [], issues: [], errorSummary: message }, input.actor);
      return { status: "failed" as const, baseUrl: input.baseUrl, run, error: message };
    }
  });
}

async function weeklyReport(actor: Extract<ContentDraftActor, { type: "agent" }>, now: Date) {
  const db = getDb(); const window = shanghaiScheduleWindow(now); const reportId = randomUUID();
  return db.begin(async (tx) => {
    const lock = await tx<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtextextended(${`seo:weekly-report:${window.date}`},0)) AS acquired`;
    if (!lock[0]?.acquired) return { status: "running" as const };
    const existing = await tx<Array<{ entity_id: string }>>`SELECT entity_id FROM agent_audit_logs
      WHERE client_id=${actor.clientId} AND action='seo.weekly_report.generated' AND created_at>=${window.start} AND created_at<${window.end}
      ORDER BY created_at DESC LIMIT 1`;
    if (existing[0]) return { status: "skipped" as const, reportId: existing[0].entity_id };
    const keywordResult = await discoverCatalogKeywordOpportunities();
    const summary = await tx<Array<{ runs: number; completed: number; failed: number; pages: number; issues: number }>>`
      SELECT count(*)::int AS runs,count(*) FILTER(WHERE status='completed')::int AS completed,
        count(*) FILTER(WHERE status='failed')::int AS failed,COALESCE(sum(pages_audited),0)::int AS pages,
        COALESCE(sum(issues_found),0)::int AS issues FROM seo_crawl_runs
      WHERE started_at>=${new Date(window.start.getTime()-6*86_400_000)} AND started_at<${window.end}`;
    const data = { periodEnd: window.date, ...summary[0], keywordOpportunities: keywordResult.opportunities.length, automaticPublishing: "off" };
    await tx`INSERT INTO agent_audit_logs(id,client_id,token_id,method,path,action,entity_type,entity_id,request_id,outcome,data)
      VALUES(${randomUUID()},${actor.clientId},${actor.tokenId},'GET','/api/cron/seo/weekly','seo.weekly_report.generated','seo_weekly_report',${reportId},${actor.requestId || null},'success',${tx.json(toJson(data))})`;
    return { status: "completed" as const, reportId, summary: data };
  });
}

export async function executeSeoCron(cadence: SeoCronCadence, now = new Date()) {
  const actor = await cronActor();
  const sites = ["https://www.theseagulllabs.com", "https://cn.theseagulllabs.com"];
  const audits = cadence === "daily"
    ? await Promise.all(sites.map((baseUrl) => scheduledAudit({ baseUrl, cadence, maxPages: 50, actor, now })))
    : [];
  const report = cadence === "weekly" ? await weeklyReport(actor, now) : null;
  return { cadence, scheduleDate: shanghaiScheduleWindow(now).date, audits, report, automaticPublishing: "off" };
}
