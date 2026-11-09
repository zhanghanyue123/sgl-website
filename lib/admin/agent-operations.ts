import { unstable_cache } from "next/cache";
import { databaseConfigured, getDb } from "./db";
import { readStoredAgentProjection } from "./agent-projections";
import { adminSourceTimeoutMs } from "./performance";

export type AgentId = "retail" | "hello" | "fries";
export type AgentOperationalStatus = "running" | "healthy" | "degraded" | "error" | "not_connected" | "not_deployed" | "stale";
export type AgentConnectionStatus = "connected" | "error" | "not_connected" | "not_deployed" | "stale";

export type AgentMetric = {
  key: string;
  label: string;
  value: number | null;
  status: "ok" | "stale" | "error" | "not_connected" | "not_deployed" | "n_a";
  source: string;
  updatedAt: string | null;
};

export type AgentActivity = {
  id: string;
  agent: AgentId;
  occurredAt: string;
  eventType: string;
  result: "success" | "warning" | "error";
  customerId: string | null;
  taskId: string | null;
  source: string;
};

export type AgentError = { id: string; agent: AgentId; occurredAt: string; code: string; source: string };
export type AgentApproval = { id: string; agent: AgentId; label: string; requestedAt: string; href: string; source: string };

export type AgentSnapshot = {
  id: AgentId;
  name: string;
  connectionStatus: AgentConnectionStatus;
  operationalStatus: AgentOperationalStatus;
  runtimeStatus: string;
  lastExecution: string | null;
  lastSuccessfulExecution: string | null;
  nextScheduledRun: string | null;
  tasksCompleted: number | null;
  errors: number | null;
  pendingActions: number | null;
  lastUpdated: string | null;
  source: string;
  sourceDetail: string;
  metrics: AgentMetric[];
};

export type AgentOperations = {
  schemaVersion: "sgl.admin.agent-operations.v1";
  generatedAt: string;
  timezone: string;
  agents: AgentSnapshot[];
  activity: AgentActivity[];
  approvals: AgentApproval[];
  errors: AgentError[];
};

const STALE_AFTER_MS = 15 * 60 * 1000;
const agentNames: Record<AgentId, string> = { retail: "Retail Sales Agent", hello: "Hello Reception Agent", fries: "Fries Website Agent" };
const metricLabels: Record<AgentId, Array<[string, string]>> = {
  retail: [
    ["researchCities", "研究城市"], ["searches", "搜索次数"], ["candidates", "候选店家"], ["crmCreated", "CRM 新增"],
    ["emailDrafts", "邮件草稿"], ["pendingEmailApprovals", "待审批邮件"], ["repliesReceived", "店家回复"], ["cooperations", "合作状态"], ["unsubscribed", "退订数量"]
  ],
  hello: [
    ["newMessages", "新邮件"], ["generalInquiry", "一般咨询"], ["productInquiry", "产品咨询"], ["wholesalePartnership", "批发 / 合作"],
    ["eventCollaboration", "活动 / 联名"], ["customerSupport", "客户支持"], ["other", "其他"], ["autoAcknowledgements", "自动确认"],
    ["stationCustomers", "Station Customer"], ["stationTasks", "Station Task"], ["awaitingHumanReply", "待人工回复"], ["syncErrors", "同步错误"]
  ],
  fries: [
    ["activeConversations", "活跃会话"], ["conversationsToday", "今日对话"], ["qualifiedLeads", "有效客户线索"], ["productEnquiries", "商品咨询"],
    ["partnershipEnquiries", "合作咨询"], ["humanHandoffs", "人工接管"], ["openTickets", "待处理工单"], ["outboxPending", "Outbox Pending"],
    ["outboxFailed", "Outbox Failed"]
  ]
};

function validServiceUrl(raw: string | undefined) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url : null;
  } catch { return null; }
}

function optionalIso(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ? date.toISOString() : null;
}

function finiteNumber(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function statusForMetric(agent: AgentSnapshot): AgentMetric["status"] {
  if (agent.operationalStatus === "not_deployed") return "not_deployed";
  if (agent.connectionStatus === "not_connected") return "not_connected";
  if (agent.operationalStatus === "stale") return "stale";
  if (agent.operationalStatus === "error") return "error";
  return "ok";
}

export function emptyAgent(id: AgentId, status: "not_connected" | "not_deployed" = "not_connected"): AgentSnapshot {
  const agent: AgentSnapshot = {
    id, name: agentNames[id], connectionStatus: status, operationalStatus: status,
    runtimeStatus: status === "not_deployed" ? "Not Deployed" : "Not Connected",
    lastExecution: null, lastSuccessfulExecution: null, nextScheduledRun: null,
    tasksCompleted: null, errors: null, pendingActions: null, lastUpdated: null,
    source: id === "fries" ? "website:postgresql" : `${id}:read-only-projection`,
    sourceDetail: status === "not_deployed" ? `${agentNames[id]} production deployment is not declared` : `${agentNames[id]} read-only projection is not configured`,
    metrics: []
  };
  agent.metrics = metricLabels[id].map(([key, label]) => ({ key, label, value: null, status: statusForMetric(agent), source: agent.source, updatedAt: null }));
  return agent;
}

type ProjectionActivity = { id?: unknown; occurredAt?: unknown; eventType?: unknown; result?: unknown; customerId?: unknown; taskId?: unknown };
type ProjectionError = { id?: unknown; occurredAt?: unknown; code?: unknown };
type AgentProjection = {
  schemaVersion?: unknown; source?: unknown; deploymentStatus?: unknown; businessStatus?: unknown; runtimeStatus?: unknown;
  lastExecution?: unknown; lastSuccessfulExecution?: unknown; nextScheduledRun?: unknown; lastUpdated?: unknown;
  tasksCompleted?: unknown; errors?: unknown; pendingActions?: unknown; metrics?: unknown; activity?: unknown; recentErrors?: unknown;
};

function safeReference(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return /^[A-Za-z0-9:_-]{1,120}$/.test(clean) ? clean : null;
}

function safeEventType(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return /^[A-Za-z0-9:._-]{1,120}$/.test(clean) ? clean : null;
}

export function normalizeProjectionActivity(agent: AgentId, value: ProjectionActivity, source: string): AgentActivity | null {
  const id = safeReference(value.id); const occurredAt = optionalIso(value.occurredAt); const eventType = safeEventType(value.eventType);
  if (!id || !occurredAt || !eventType) return null;
  const result = value.result === "error" ? "error" : value.result === "warning" ? "warning" : "success";
  return { id: `${agent}:${id}`, agent, occurredAt, eventType, result, customerId: safeReference(value.customerId), taskId: safeReference(value.taskId), source };
}

function businessStatus(value: unknown, updatedAt: string | null): AgentOperationalStatus {
  if (updatedAt && Date.now() - new Date(updatedAt).valueOf() > STALE_AFTER_MS) return "stale";
  return ["running", "healthy", "degraded", "error"].includes(String(value)) ? value as AgentOperationalStatus : "degraded";
}

async function readProjection(id: "retail" | "hello", urlName: string, tokenName: string) {
  const fallback = emptyAgent(id);
  const stored = await readStoredAgentProjection(id, "operations") as AgentProjection | null;
  if (stored) return normalizeProjection(id, stored, fallback);
  const url = validServiceUrl(process.env[urlName]); const token = process.env[tokenName];
  if (!url || !token) return { agent: fallback, activity: [] as AgentActivity[], errors: [] as AgentError[] };
  try {
    const response = await fetch(url, { headers: { authorization: `Bearer ${token}`, accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(adminSourceTimeoutMs()) });
    if (!response.ok) return { agent: { ...fallback, connectionStatus: "error" as const, operationalStatus: "error" as const, runtimeStatus: "Unavailable", sourceDetail: `${agentNames[id]} returned HTTP ${response.status}` }, activity: [], errors: [] };
    return normalizeProjection(id, await response.json() as AgentProjection, fallback);
  } catch (error) {
    const timedOut = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    return { agent: { ...fallback, connectionStatus: "error" as const, operationalStatus: "error" as const, runtimeStatus: "Unavailable", sourceDetail: timedOut ? `${agentNames[id]} projection timed out` : `${agentNames[id]} projection is unavailable` }, activity: [], errors: [] };
  }
}

function normalizeProjection(id: "retail" | "hello", body: AgentProjection, fallback = emptyAgent(id)) {
    if (body.schemaVersion !== "sgl.admin.agent-operations.v1" || body.source !== id) return { agent: { ...fallback, connectionStatus: "error" as const, operationalStatus: "error" as const, runtimeStatus: "Invalid projection", sourceDetail: `${agentNames[id]} returned an invalid Agent Operations contract` }, activity: [] as AgentActivity[], errors: [] as AgentError[] };
    if (body.deploymentStatus === "not_deployed") return { agent: emptyAgent(id, "not_deployed"), activity: [] as AgentActivity[], errors: [] as AgentError[] };
    const lastUpdated = optionalIso(body.lastUpdated);
    const agent: AgentSnapshot = {
      ...fallback, connectionStatus: lastUpdated && Date.now() - new Date(lastUpdated).valueOf() > STALE_AFTER_MS ? "stale" : "connected",
      operationalStatus: businessStatus(body.businessStatus, lastUpdated), runtimeStatus: typeof body.runtimeStatus === "string" ? body.runtimeStatus.slice(0, 80) : "Unknown",
      lastExecution: optionalIso(body.lastExecution), lastSuccessfulExecution: optionalIso(body.lastSuccessfulExecution), nextScheduledRun: optionalIso(body.nextScheduledRun),
      tasksCompleted: finiteNumber(body.tasksCompleted), errors: finiteNumber(body.errors), pendingActions: finiteNumber(body.pendingActions), lastUpdated,
      sourceDetail: `${agentNames[id]} read-only business projection connected`
    };
    const rawMetrics = body.metrics && typeof body.metrics === "object" && !Array.isArray(body.metrics) ? body.metrics as Record<string, unknown> : {};
    agent.metrics = metricLabels[id].map(([key, label]) => ({ key, label, value: finiteNumber(rawMetrics[key]), status: rawMetrics[key] === undefined ? "n_a" : statusForMetric(agent), source: agent.source, updatedAt: lastUpdated }));
    const activity = Array.isArray(body.activity) ? body.activity.map(value => normalizeProjectionActivity(id, value as ProjectionActivity, agent.source)).filter((value): value is AgentActivity => Boolean(value)) : [];
    const errors = Array.isArray(body.recentErrors) ? body.recentErrors.flatMap((value: ProjectionError) => {
      const ref = safeReference(value.id); const occurredAt = optionalIso(value.occurredAt); const code = safeReference(value.code);
      return ref && occurredAt && code ? [{ id: `${id}:${ref}`, agent: id, occurredAt, code, source: agent.source }] : [];
    }) : [];
    return { agent, activity, errors };
}

async function readFries(generatedAt: string) {
  if (process.env.SGL_FRIES_DEPLOYMENT_STATUS !== "connected") return { agent: emptyAgent("fries", "not_deployed"), activity: [] as AgentActivity[], errors: [] as AgentError[] };
  const llmReady = process.env.SGL_FRIES_LLM_STATUS === "ready";
  const fallback = emptyAgent("fries");
  if (!databaseConfigured()) return { agent: fallback, activity: [], errors: [] };
  try {
    const db = getDb();
    const [summary, categories, outbox, activityRows, errorRows] = await Promise.all([
      db`SELECT count(*) FILTER (WHERE status NOT IN ('resolved','closed'))::int active_conversations,count(*) FILTER (WHERE created_at >= date_trunc('day',now()))::int conversations_today,count(*) FILTER (WHERE human_handoff_requested AND status NOT IN ('resolved','closed'))::int handoffs,(SELECT count(*)::int FROM support_tickets WHERE status IN ('open','pending')) open_tickets,max(updated_at) last_updated FROM support_conversations`,
      db`SELECT count(*) FILTER (WHERE category='product_enquiry')::int product_enquiries,count(*) FILTER (WHERE category='general_feedback' AND human_handoff_requested)::int qualified_leads FROM support_conversations`,
      db`SELECT count(*) FILTER (WHERE status IN ('pending','processing'))::int pending,count(*) FILTER (WHERE status='failed')::int failed,max(updated_at) last_updated FROM integration_outbox WHERE source='website'`,
      db`SELECT id::text,created_at occurred_at,action event_type,CASE WHEN action LIKE '%.failed' THEN 'error' ELSE 'success' END result,entity_id FROM audit_logs WHERE action LIKE 'support.%' ORDER BY created_at DESC LIMIT 20`,
      db`SELECT id::text,created_at occurred_at,action code FROM audit_logs WHERE action LIKE 'support.%failed%' ORDER BY created_at DESC LIMIT 10`
    ]);
    const row = summary[0] as any; const cats = categories[0] as any; const box = outbox[0] as any;
    const lastUpdated = [row?.last_updated, box?.last_updated].filter(Boolean).map(value => new Date(value).valueOf()).sort((a, b) => b - a)[0];
    const updated = lastUpdated ? new Date(lastUpdated).toISOString() : generatedAt;
    const outboxFailed = Number(box?.failed || 0); const active = Number(row?.active_conversations || 0);
    const agent: AgentSnapshot = {
      id: "fries", name: agentNames.fries, connectionStatus: "connected", operationalStatus: outboxFailed || !llmReady ? "degraded" : "healthy", runtimeStatus: !llmReady ? "Evidence fallback · LLM unavailable" : active ? "Serving conversations" : "Ready",
      lastExecution: updated, lastSuccessfulExecution: updated, nextScheduledRun: null, tasksCompleted: Number(row?.conversations_today || 0), errors: outboxFailed,
      pendingActions: Number(row?.handoffs || 0) + Number(row?.open_tickets || 0), lastUpdated: updated, source: "website:postgresql", sourceDetail: llmReady ? "Fries business state from Website support and integration outbox tables" : "Fries is deployed with approved-evidence fallback; Preview LLM provider is unavailable", metrics: []
    };
    const values: Record<string, number> = { activeConversations: Number(row?.active_conversations || 0), conversationsToday: Number(row?.conversations_today || 0), qualifiedLeads: Number(cats?.qualified_leads || 0), productEnquiries: Number(cats?.product_enquiries || 0), partnershipEnquiries: 0, humanHandoffs: Number(row?.handoffs || 0), openTickets: Number(row?.open_tickets || 0), outboxPending: Number(box?.pending || 0), outboxFailed };
    agent.metrics = metricLabels.fries.map(([key, label]) => ({ key, label, value: key === "partnershipEnquiries" ? null : values[key] ?? null, status: key === "partnershipEnquiries" ? "n_a" : "ok", source: agent.source, updatedAt: updated }));
    const activity: AgentActivity[] = (activityRows as any[]).map(value => ({ id: `fries:${String(value.id)}`, agent: "fries", occurredAt: new Date(value.occurred_at).toISOString(), eventType: String(value.event_type), result: value.result === "error" ? "error" : "success", customerId: null, taskId: /^[-A-Za-z0-9_:]{1,120}$/.test(String(value.entity_id || "")) ? String(value.entity_id) : null, source: agent.source }));
    const errors: AgentError[] = (errorRows as any[]).map(value => ({ id: `fries:${String(value.id)}`, agent: "fries", occurredAt: new Date(value.occurred_at).toISOString(), code: String(value.code).slice(0, 80), source: agent.source }));
    return { agent, activity, errors };
  } catch {
    return { agent: { ...fallback, connectionStatus: "error" as const, operationalStatus: "error" as const, runtimeStatus: "Query failed", sourceDetail: "Fries business metrics query failed" }, activity: [], errors: [] };
  }
}

async function readApprovals(): Promise<AgentApproval[]> {
  if (!databaseConfigured()) return [];
  try {
    const rows = await getDb()`SELECT r.id::text,r.requested_at,c.name FROM agent_action_requests r JOIN agent_clients c ON c.id=r.client_id WHERE r.status='pending' ORDER BY r.requested_at DESC LIMIT 30`;
    return (rows as any[]).map(row => {
      const name = String(row.name).toLowerCase();
      const agent: AgentId = name.includes("retail") ? "retail" : name.includes("hello") ? "hello" : "fries";
      return { id: String(row.id), agent, label: `Agent action · ${String(row.name).slice(0, 80)}`, requestedAt: new Date(row.requested_at).toISOString(), href: "/admin/agent-actions", source: "website:agent_action_requests" };
    });
  } catch { return []; }
}

async function loadAgentOperations(): Promise<AgentOperations> {
  const generatedAt = new Date().toISOString();
  const [retail, hello, fries, approvals] = await Promise.all([
    readProjection("retail", "SGL_RETAIL_AGENT_OPERATIONS_URL", "SGL_RETAIL_OVERVIEW_TOKEN"),
    readProjection("hello", "SGL_HELLO_AGENT_OPERATIONS_URL", "SGL_HELLO_OVERVIEW_TOKEN"),
    readFries(generatedAt), readApprovals()
  ]);
  const activity = [...retail.activity, ...hello.activity, ...fries.activity].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 40);
  const errors = [...retail.errors, ...hello.errors, ...fries.errors].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 30);
  return { schemaVersion: "sgl.admin.agent-operations.v1", generatedAt, timezone: process.env.SGL_ADMIN_TIMEZONE || "Asia/Shanghai", agents: [retail.agent, hello.agent, fries.agent], activity, approvals, errors };
}

export const getAgentOperations = unstable_cache(loadAgentOperations, ["admin-agent-operations-v1"], {
  revalidate: 30,
  tags: ["admin-agent-operations"]
});
