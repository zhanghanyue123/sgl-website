import { unstable_cache } from "next/cache";
import { databaseConfigured, getDb } from "./db";
import { readStoredAgentProjection } from "./agent-projections";

export type OverviewStatus = "ok" | "stale" | "not_connected" | "error" | "n_a";
export type OverviewMetric = {
  key: string;
  value: number | string | null;
  unit: "cents" | "items" | "orders" | "customers" | "tasks" | "events" | "percent";
  currency?: string;
  status: OverviewStatus;
  sourceSystem: "website" | "station" | "retail" | "hello" | "fries";
  sourceRef: string;
  period: { from: string | null; to: string };
  asOf: string;
  definition: string;
  errorCode: string | null;
};

export type SourceHealth = {
  source: "website" | "station" | "retail" | "hello" | "fries";
  label: string;
  status: OverviewStatus;
  updatedAt: string | null;
  detail: string;
};

export type UnifiedOverview = {
  schemaVersion: "sgl.admin.overview.v1";
  generatedAt: string;
  timezone: string;
  commerce: { todaySales: OverviewMetric[]; monthSales: OverviewMetric[]; orderStates: Record<string, number>; paymentStates: Record<string, number> };
  inventory: { totalAvailable: OverviewMetric; lowStock: OverviewMetric; smallBags: { target: OverviewMetric; actual: OverviewMetric; progress: OverviewMetric } };
  crm: { websiteCustomers: OverviewMetric; newCustomersToday: OverviewMetric; retailPartners: OverviewMetric };
  agents: SourceHealth[];
  pending: Array<{ key: string; label: string; count: number | null; status: OverviewStatus; source: string; href: string }>;
  activity: Array<{ id: string; occurredAt: string; source: string; label: string; outcome: "success" | "warning" | "error" }>;
  errors: Array<{ id: string; occurredAt: string; source: string; code: string; status: "open" }>;
};

const SMALL_BAG_TARGET = 2500;
const STALE_AFTER_MS = 15 * 60 * 1000;

function nowIso() { return new Date().toISOString(); }
function metric(input: Omit<OverviewMetric, "period" | "asOf" | "errorCode"> & { from?: string | null; asOf?: string; errorCode?: string | null }): OverviewMetric {
  const asOf = input.asOf || nowIso();
  return { ...input, period: { from: input.from ?? null, to: asOf }, asOf, errorCode: input.errorCode ?? null };
}

export function parseSmallBagSkus(value = process.env.SGL_SMALL_BAG_SKUS || "") {
  return [...new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

export function buildSmallBagMetrics(input: { available: number | null; updatedAt?: string | null; configured: boolean; asOf?: string }) {
  const asOf = input.asOf || nowIso();
  const actualStatus: OverviewStatus = input.configured ? (input.available === null ? "error" : "ok") : "not_connected";
  const actual = metric({ key: "inventory.small_bags.available", value: input.available, unit: "items", status: actualStatus, sourceSystem: "website", sourceRef: "configured-skus", asOf, definition: "Sellable Small Bags across Website inventory for explicitly configured SKU mappings; excludes the sell-through target", errorCode: input.configured && input.available === null ? "inventory_query_failed" : !input.configured ? "small_bag_sku_mapping_missing" : null });
  const target = metric({ key: "inventory.small_bags.sell_through_target", value: SMALL_BAG_TARGET, unit: "items", status: "ok", sourceSystem: "website", sourceRef: "owner-approved-business-target", asOf, definition: "Owner-approved sell-through target; this is not an inventory count" });
  const progressValue = input.available === null ? null : Math.max(0, Math.min(100, ((SMALL_BAG_TARGET - input.available) / SMALL_BAG_TARGET) * 100));
  const progress = metric({ key: "inventory.small_bags.sell_through_progress", value: progressValue === null ? null : Number(progressValue.toFixed(1)), unit: "percent", status: actualStatus, sourceSystem: "website", sourceRef: "configured-skus", asOf, definition: "Target progress calculated from current sellable Website inventory; unavailable until SKU mapping is configured", errorCode: actual.errorCode });
  return { target, actual, progress };
}

function unavailableMetric(key: string, unit: OverviewMetric["unit"], sourceSystem: OverviewMetric["sourceSystem"], sourceRef: string, definition: string, errorCode = "source_not_connected") {
  return metric({ key, value: null, unit, status: "not_connected", sourceSystem, sourceRef, definition, errorCode });
}

function validOverviewUrl(raw: string | undefined) {
  if (!raw) return null;
  try { const url = new URL(raw); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url : null; } catch { return null; }
}

type ProjectionPayload = { schemaVersion?: unknown; source?: unknown; status?: unknown; updatedAt?: unknown; counts?: unknown };
async function projectionHealth(source: "station" | "retail" | "hello", label: string, urlName: string, tokenName: string): Promise<{ health: SourceHealth; counts: Record<string, number> }> {
  const url = validOverviewUrl(process.env[urlName]);
  if (!url && source !== "station") {
    const stored = await readStoredAgentProjection(source, "overview") as ProjectionPayload | null;
    if (stored) return normalizeOverviewProjection(source, label, stored);
  }
  if (!url) return { health: { source, label, status: "not_connected", updatedAt: null, detail: `${label} read-only projection is not configured` }, counts: {} };
  const token = process.env[tokenName];
  if (!token) return { health: { source, label, status: "not_connected", updatedAt: null, detail: `${label} service credential is not configured` }, counts: {} };
  try {
    const response = await fetch(url, { headers: { authorization: `Bearer ${token}`, accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!response.ok) return { health: { source, label, status: "error", updatedAt: null, detail: `${label} returned HTTP ${response.status}` }, counts: {} };
    return normalizeOverviewProjection(source, label, await response.json() as ProjectionPayload);
  } catch (error) {
    const detail = error instanceof Error && error.name === "TimeoutError" ? `${label} request timed out` : `${label} read-only projection is unavailable`;
    return { health: { source, label, status: "error", updatedAt: null, detail }, counts: {} };
  }
}

export function normalizeOverviewProjection(source: "station" | "retail" | "hello", label: string, body: ProjectionPayload): { health: SourceHealth; counts: Record<string, number> } {
    if (body.schemaVersion !== "sgl.admin.overview.v1" || body.source !== source || typeof body.updatedAt !== "string") return { health: { source, label, status: "error", updatedAt: null, detail: `${label} returned an invalid projection contract` }, counts: {} };
    const updatedAt = new Date(body.updatedAt);
    if (!Number.isFinite(updatedAt.valueOf())) return { health: { source, label, status: "error", updatedAt: null, detail: `${label} returned an invalid timestamp` }, counts: {} };
    const status: OverviewStatus = Date.now() - updatedAt.valueOf() > STALE_AFTER_MS ? "stale" : body.status === "ok" ? "ok" : "error";
    const counts = body.counts && typeof body.counts === "object" && !Array.isArray(body.counts)
      ? Object.fromEntries(Object.entries(body.counts as Record<string, unknown>).filter((entry): entry is [string, number] => Number.isFinite(entry[1]))) : {};
    return { health: { source, label, status, updatedAt: updatedAt.toISOString(), detail: status === "stale" ? `${label} projection is older than 15 minutes` : `${label} read-only projection connected` }, counts };
}

function baseOverview(generatedAt = nowIso()): UnifiedOverview {
  const empty = unavailableMetric("inventory.total.available", "items", "website", "postgresql:inventory_levels", "Sellable Website inventory across active variants", "website_database_not_connected");
  return {
    schemaVersion: "sgl.admin.overview.v1", generatedAt, timezone: process.env.SGL_ADMIN_TIMEZONE || "Asia/Shanghai",
    commerce: { todaySales: [unavailableMetric("sales.today.net", "cents", "website", "postgresql:payments", "Captured payment amount less recorded refunds for the current business day", "website_database_not_connected")], monthSales: [unavailableMetric("sales.month.net", "cents", "website", "postgresql:payments", "Captured payment amount less recorded refunds for the current business month", "website_database_not_connected")], orderStates: {}, paymentStates: {} },
    inventory: { totalAvailable: empty, lowStock: unavailableMetric("inventory.low_stock", "items", "website", "postgresql:inventory_levels", "Active stock locations at or below their alert threshold", "website_database_not_connected"), smallBags: buildSmallBagMetrics({ available: null, configured: false, asOf: generatedAt }) },
    crm: { websiteCustomers: unavailableMetric("crm.website.customers", "customers", "website", "postgresql:customers", "Website customer records", "website_database_not_connected"), newCustomersToday: unavailableMetric("crm.website.customers.today", "customers", "website", "postgresql:customers", "Website customers created during the current business day", "website_database_not_connected"), retailPartners: unavailableMetric("crm.retail.partners", "customers", "retail", "retail:overview", "Retail partner records supplied by the Retail read-only projection") },
    agents: [
      { source: "website", label: "Website Commerce", status: "not_connected", updatedAt: null, detail: "Website database is not configured" },
      { source: "retail", label: "Retail", status: "not_connected", updatedAt: null, detail: "Retail read-only projection is not configured" },
      { source: "hello", label: "Hello", status: "not_connected", updatedAt: null, detail: "Hello read-only projection is not configured" },
      { source: "fries", label: "Fries", status: "not_connected", updatedAt: null, detail: "Fries deployment status is not configured" }
    ], pending: [], activity: [], errors: []
  };
}

export async function loadUnifiedOverviewUncached(): Promise<UnifiedOverview> {
  const generatedAt = nowIso();
  const overview = baseOverview(generatedAt);
  const [station, retail, hello] = await Promise.all([
    projectionHealth("station", "Station OS", "SGL_STATION_OVERVIEW_URL", "SGL_STATION_OVERVIEW_TOKEN"),
    projectionHealth("retail", "Retail Agent", "SGL_RETAIL_OVERVIEW_URL", "SGL_RETAIL_OVERVIEW_TOKEN"),
    projectionHealth("hello", "Hello Reception", "SGL_HELLO_OVERVIEW_URL", "SGL_HELLO_OVERVIEW_TOKEN")
  ]);
  const commerceProjectionEnabled = process.env.SGL_WEBSITE_COMMERCE_PROJECTION_ENABLED === "true";
  overview.agents = [
    {
      source: "website",
      label: "Website Commerce",
      status: "not_connected",
      updatedAt: null,
      detail: commerceProjectionEnabled
        ? "Website commerce projection database is not configured"
        : "Website commerce projection is not connected"
    },
    station.health,
    retail.health,
    hello.health,
    { source: "fries", label: "Fries", status: "not_connected", updatedAt: null, detail: "Fries production deployment is not declared" }
  ];
  overview.crm.retailPartners = retail.health.status === "ok" || retail.health.status === "stale"
    ? metric({ key: "crm.retail.partners", value: retail.counts.partners ?? null, unit: "customers", status: retail.counts.partners === undefined ? "n_a" : retail.health.status, sourceSystem: "retail", sourceRef: "retail:overview", asOf: retail.health.updatedAt || generatedAt, definition: "Retail partner records reported by the Retail read-only projection", errorCode: retail.counts.partners === undefined ? "metric_unavailable" : null })
    : overview.crm.retailPartners;
  if (!commerceProjectionEnabled || !databaseConfigured()) return overview;

  const db = getDb();
  try {
    const timezone = overview.timezone;
    const smallBagSkus = parseSmallBagSkus();
    const [todaySales, monthSales, orderStates, paymentStates, stock, lowStock, customers, newCustomers, pending, activity, errors, fries, smallBags] = await Promise.all([
      db`SELECT currency, COALESCE(sum(captured_amount_cents-refunded_amount_cents),0)::int value,min(date_trunc('day', timezone(${timezone}, now())) AT TIME ZONE ${timezone}) period_start FROM payments WHERE status IN ('paid','partially_refunded','refunded') AND COALESCE(succeeded_at,created_at) >= (date_trunc('day', timezone(${timezone}, now())) AT TIME ZONE ${timezone}) GROUP BY currency ORDER BY currency`,
      db`SELECT currency, COALESCE(sum(captured_amount_cents-refunded_amount_cents),0)::int value,min(date_trunc('month', timezone(${timezone}, now())) AT TIME ZONE ${timezone}) period_start FROM payments WHERE status IN ('paid','partially_refunded','refunded') AND COALESCE(succeeded_at,created_at) >= (date_trunc('month', timezone(${timezone}, now())) AT TIME ZONE ${timezone}) GROUP BY currency ORDER BY currency`,
      db`SELECT order_status status,count(*)::int count FROM orders GROUP BY order_status ORDER BY order_status`,
      db`SELECT status,count(*)::int count FROM payments GROUP BY status ORDER BY status`,
      db`SELECT COALESCE(sum(i.available) FILTER (WHERE v.active),0)::int available,max(i.updated_at) updated_at FROM inventory_levels i JOIN product_variants v ON v.id=i.variant_id`,
      db`SELECT count(*)::int count,max(i.updated_at) updated_at FROM inventory_levels i JOIN product_variants v ON v.id=i.variant_id WHERE v.active AND i.available<=i.low_stock_threshold`,
      db`SELECT count(*)::int count,max(updated_at) updated_at FROM customers`,
      db`SELECT count(*)::int count FROM customers WHERE created_at >= (date_trunc('day', timezone(${timezone}, now())) AT TIME ZONE ${timezone})`,
      db`SELECT (SELECT count(*) FROM agent_action_requests WHERE status='pending')::int agent_actions,(SELECT count(*) FROM refunds WHERE status IN ('requested','approved'))::int refunds,(SELECT count(*) FROM content_drafts WHERE status='review')::int content_reviews,(SELECT count(*) FROM support_tickets WHERE status IN ('open','pending'))::int support_tickets,(SELECT count(*) FROM support_conversations WHERE human_handoff_requested AND status NOT IN ('resolved','closed'))::int handoffs`,
      db`SELECT id::text,created_at occurred_at,'website' source,action label,'success' outcome FROM audit_logs ORDER BY created_at DESC LIMIT 8`,
      db`SELECT id::text,created_at occurred_at,'website-agent' source,action code FROM agent_audit_logs WHERE outcome='failed' ORDER BY created_at DESC LIMIT 6`,
      db`SELECT count(*) FILTER (WHERE status IN ('open','waiting_staff'))::int open,count(*) FILTER (WHERE human_handoff_requested AND status NOT IN ('resolved','closed'))::int handoffs,max(updated_at) updated_at FROM support_conversations`,
      smallBagSkus.length ? db`SELECT COALESCE(sum(i.available),0)::int available,max(i.updated_at) updated_at FROM inventory_levels i JOIN product_variants v ON v.id=i.variant_id WHERE v.active AND lower(v.sku)=ANY(${smallBagSkus})` : Promise.resolve([])
    ]);
    const salesMetrics = (rows: any[], key: string, definition: string) => rows.length ? rows.map((row) => metric({ key: `${key}.${String(row.currency).toLowerCase()}`, value: Number(row.value), unit: "cents", currency: String(row.currency), status: "ok", sourceSystem: "website", sourceRef: "postgresql:payments", from: row.period_start ? new Date(row.period_start).toISOString() : null, asOf: generatedAt, definition })) : [metric({ key, value: 0, unit: "cents", currency: "USD", status: "ok", sourceSystem: "website", sourceRef: "postgresql:payments", from: null, asOf: generatedAt, definition })];
    overview.commerce.todaySales = salesMetrics(todaySales, "sales.today.net", "Captured payment amount less recorded refunds for the current business day; grouped by currency");
    overview.commerce.monthSales = salesMetrics(monthSales, "sales.month.net", "Captured payment amount less recorded refunds for the current business month; grouped by currency");
    overview.commerce.orderStates = Object.fromEntries(orderStates.map((row: any) => [String(row.status), Number(row.count)]));
    overview.commerce.paymentStates = Object.fromEntries(paymentStates.map((row: any) => [String(row.status), Number(row.count)]));
    overview.inventory.totalAvailable = metric({ key: "inventory.total.available", value: Number(stock[0]?.available || 0), unit: "items", status: "ok", sourceSystem: "website", sourceRef: "postgresql:inventory_levels", asOf: stock[0]?.updated_at ? new Date(stock[0].updated_at).toISOString() : generatedAt, definition: "Sellable Website inventory across active variants" });
    overview.inventory.lowStock = metric({ key: "inventory.low_stock", value: Number(lowStock[0]?.count || 0), unit: "items", status: "ok", sourceSystem: "website", sourceRef: "postgresql:inventory_levels", asOf: lowStock[0]?.updated_at ? new Date(lowStock[0].updated_at).toISOString() : generatedAt, definition: "Active stock locations at or below their alert threshold" });
    overview.inventory.smallBags = buildSmallBagMetrics({ available: smallBagSkus.length ? Number(smallBags[0]?.available || 0) : null, configured: smallBagSkus.length > 0, updatedAt: smallBags[0]?.updated_at ? new Date(smallBags[0].updated_at).toISOString() : null, asOf: generatedAt });
    overview.crm.websiteCustomers = metric({ key: "crm.website.customers", value: Number(customers[0]?.count || 0), unit: "customers", status: "ok", sourceSystem: "website", sourceRef: "postgresql:customers", asOf: customers[0]?.updated_at ? new Date(customers[0].updated_at).toISOString() : generatedAt, definition: "Website customer records" });
    overview.crm.newCustomersToday = metric({ key: "crm.website.customers.today", value: Number(newCustomers[0]?.count || 0), unit: "customers", status: "ok", sourceSystem: "website", sourceRef: "postgresql:customers", asOf: generatedAt, definition: "Website customers created during the current business day" });
    const p = pending[0] || {};
    overview.pending = [
      { key: "agent_actions", label: "Agent 待审批", count: Number(p.agent_actions || 0), status: "ok", source: "Website", href: "/admin/agent-actions" },
      { key: "refunds", label: "退款待处理", count: Number(p.refunds || 0), status: "ok", source: "Website", href: "/admin/payments" },
      { key: "content_reviews", label: "内容待审核", count: Number(p.content_reviews || 0), status: "ok", source: "Website", href: "/admin/content" },
      { key: "support_tickets", label: "客服待跟进", count: Number(p.support_tickets || 0), status: "ok", source: "Fries", href: "/admin/support" },
      { key: "handoffs", label: "人工接管", count: Number(p.handoffs || 0), status: "ok", source: "Fries", href: "/admin/support" }
    ];
    overview.activity = activity.map((row: any) => ({ id: String(row.id), occurredAt: new Date(row.occurred_at).toISOString(), source: String(row.source), label: String(row.label), outcome: "success" as const }));
    overview.errors = errors.map((row: any) => ({ id: String(row.id), occurredAt: new Date(row.occurred_at).toISOString(), source: String(row.source), code: String(row.code), status: "open" as const }));
    overview.agents.unshift({ source: "website", label: "Website Commerce", status: "ok", updatedAt: generatedAt, detail: "Website commerce database connected" });
    const friesDeclared = process.env.SGL_FRIES_DEPLOYMENT_STATUS === "connected";
    const friesIndex = overview.agents.findIndex((item) => item.source === "fries");
    overview.agents[friesIndex] = { source: "fries", label: "Fries", status: friesDeclared ? "ok" : "not_connected", updatedAt: friesDeclared && fries[0]?.updated_at ? new Date(fries[0].updated_at).toISOString() : null, detail: friesDeclared ? `${Number(fries[0]?.open || 0)} open · ${Number(fries[0]?.handoffs || 0)} handoffs` : "Fries production deployment is not declared" };
    return overview;
  } catch {
    overview.agents.unshift({ source: "website", label: "Website Commerce", status: "error", updatedAt: null, detail: "Website metrics query failed" });
    return overview;
  }
}

// RBAC is evaluated before this shared read model is returned. Sessions and
// service credentials are deliberately excluded from the cached value.
export const getUnifiedOverview = unstable_cache(loadUnifiedOverviewUncached, ["admin-unified-overview-v1"], {
  revalidate: 30,
  tags: ["admin-overview"]
});
