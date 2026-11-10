import type { AgentOpsEventV1, AgentOpsWeComV1 } from "./agent-ops";

export const DEFAULT_FRIES_WEEKLY_DIGEST = {
  enabled: false,
  weekday: 1,
  time: "09:00",
  timezone: "Asia/Shanghai"
} as const;

export type FriesWeeklyMetrics = {
  consultations: number;
  qualifiedLeads: number;
  tickets: number;
  handoffs: number;
  conversions: number;
};

export type FriesWeeklyDigestInput = {
  periodStart: string;
  periodEnd: string;
  metrics: FriesWeeklyMetrics;
  outcomes: string[];
  incomplete: string[];
  importantIssues: string[];
  nextWeekAdvice: string[];
};

export type FriesWeeklyDigest = {
  schemaVersion: "fries.wecom.weekly-digest.v1";
  title: string;
  schedule: { weekday: number; time: string; timezone: string };
  period: { start: string; end: string };
  metrics: FriesWeeklyMetrics;
  sections: Array<{ key: "outcomes" | "incomplete" | "important_issues" | "next_week_advice"; title: string; items: string[] }>;
};

const AFTER_SALES = new Set(["order_issue", "payment_issue", "shipping_delay", "damaged_item", "wrong_item", "return_exchange"]);
const KEY_TICKET_PROGRESS = new Set(["assigned", "unassigned", "pending", "resolved", "reopened", "escalated"]);
const NOISE_SIGNALS = new Set(["heartbeat", "search", "sync", "no_progress"]);

type FriesWeComEnvironment = Readonly<Record<string, string | undefined>>;

export function readFriesWeeklyDigestConfig(env: FriesWeComEnvironment = process.env) {
  const weekday = env.FRIES_WECOM_WEEKLY_DIGEST_WEEKDAY === undefined ? 1 : Number(env.FRIES_WECOM_WEEKLY_DIGEST_WEEKDAY);
  const time = env.FRIES_WECOM_WEEKLY_DIGEST_TIME || DEFAULT_FRIES_WEEKLY_DIGEST.time;
  const timezone = env.FRIES_WECOM_WEEKLY_DIGEST_TIMEZONE || DEFAULT_FRIES_WEEKLY_DIGEST.timezone;
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) throw new Error("invalid_fries_weekly_digest_weekday");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("invalid_fries_weekly_digest_time");
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(); }
  catch { throw new Error("invalid_fries_weekly_digest_timezone"); }
  return { enabled: env.FRIES_WECOM_WEEKLY_DIGEST_ENABLED === "true", weekday, time, timezone };
}

export function redactWeComText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[邮箱已隐藏]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[电话已隐藏]")
    .replace(/\b(token|secret|password|api[_ -]?key)\s*[:=]\s*\S+/gi, "$1=[已隐藏]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, "[编号已隐藏]")
    .slice(0, 240);
}

function notificationReason(event: AgentOpsEventV1) {
  const facts = event.facts;
  if (facts.signal && NOISE_SIGNALS.has(facts.signal)) return null;
  if (facts.signal === "human_takeover" || event.eventType === "website.handoff_requested") return "human_takeover" as const;
  if (facts.intentStrength === "high" && (facts.intentKind === "purchase_interest" || facts.intentKind === "wholesale_retail_partnership")) return "qualified_lead" as const;
  if (facts.signal === "customer_reply" && facts.humanActionRequired) return "important_customer_reply" as const;
  if (facts.humanActionRequired && facts.category && AFTER_SALES.has(facts.category)) return "after_sales" as const;
  if (facts.signal === "ticket_progress" && facts.ticketProgress && KEY_TICKET_PROGRESS.has(facts.ticketProgress)) return "ticket_progress" as const;
  return null;
}

export function renderPolicyWeCom(event: AgentOpsEventV1, taskId: string | null): AgentOpsWeComV1 | null {
  const reason = notificationReason(event);
  if (!reason) return null;
  const copy = {
    qualified_lead: ["Fries 高意向商机", "官网出现高意向购买或零售合作线索。", "及时确认需求并安排负责人跟进"],
    important_customer_reply: ["Fries 重要客户回复", "人工处理中会话收到新的客户回复。", "查看会话并回复客户"],
    after_sales: ["Fries 订单 / 售后待处理", "订单或售后事项需要人工处理。", "核对问题并更新处理进度"],
    human_takeover: ["Fries 请求人工接管", "网站访客需要人工接管；摘要不含联系方式或对话正文。", "在 Station 接管会话"],
    ticket_progress: ["Fries 工单关键进度", "工单状态或负责人出现关键变化。", "确认进度并处理下一步"]
  }[reason];
  const stationPath = taskId ? `/agent-operations/tasks/${encodeURIComponent(taskId)}` : "/agent-operations";
  return {
    schemaVersion: "agent-ops.wecom.v1",
    notificationId: `wecom:website:${event.eventId}:${reason}:manager`,
    dedupeKey: `fries:${event.subject.kind}:${event.subject.reference}:${reason}:${event.facts.ticketProgress || event.eventId}`,
    source: "website",
    eventId: event.eventId,
    eventType: event.eventType,
    severity: event.severity,
    audience: "manager",
    title: copy[0],
    summary: redactWeComText(copy[1]),
    facts: [
      { label: "来源", value: "官网 Fries" },
      { label: "优先级", value: event.severity },
      ...(event.facts.category ? [{ label: "类别", value: event.facts.category }] : [])
    ],
    action: { required: true, label: copy[2], stationPath },
    createdAt: event.occurredAt
  };
}

function boundedItems(items: string[]) {
  return items.slice(0, 20).map(redactWeComText).filter(Boolean);
}

export function buildFriesWeeklyDigest(input: FriesWeeklyDigestInput, env: FriesWeComEnvironment = process.env): FriesWeeklyDigest {
  const config = readFriesWeeklyDigestConfig(env);
  for (const value of Object.values(input.metrics)) if (!Number.isInteger(value) || value < 0) throw new Error("invalid_fries_weekly_digest_metric");
  return {
    schemaVersion: "fries.wecom.weekly-digest.v1",
    title: "Fries 客服与商机周报",
    schedule: { weekday: config.weekday, time: config.time, timezone: config.timezone },
    period: { start: input.periodStart, end: input.periodEnd },
    metrics: input.metrics,
    sections: [
      { key: "outcomes", title: "本周结果", items: boundedItems(input.outcomes) },
      { key: "incomplete", title: "未完成事项", items: boundedItems(input.incomplete) },
      { key: "important_issues", title: "重要问题", items: boundedItems(input.importantIssues) },
      { key: "next_week_advice", title: "下周建议", items: boundedItems(input.nextWeekAdvice) }
    ]
  };
}
