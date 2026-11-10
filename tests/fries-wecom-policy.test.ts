import assert from "node:assert/strict";
import test from "node:test";
import { MockStationOS, mapSupportLeaseToAgentOps, signAgentOpsEvent } from "../lib/integrations/agent-ops";
import type { SupportEventLease, WebsiteSupportEventPayload } from "../lib/integrations/outbox";
import { buildFriesWeeklyDigest, readFriesWeeklyDigestConfig, redactWeComText, renderPolicyWeCom } from "../lib/integrations/wecom-policy";

const organizationId = "00000000-0000-4000-8000-000000000001";
const token = "mock-station-token-at-least-24-chars";
const secret = "mock-signing-secret-at-least-24-chars";

function lease(payload: WebsiteSupportEventPayload, eventType = "support.conversation.updated", aggregateType = "support_conversation"): SupportEventLease {
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    organizationId,
    storeId: null,
    eventType,
    aggregateType,
    aggregateId: aggregateType === "support_ticket" ? "ticket-1" : "conversation-1",
    payload,
    createdAt: "2026-11-09T01:00:00.000Z",
    leaseExpiresAt: "2026-11-09T01:01:00.000Z",
    receipt: "r".repeat(43)
  };
}

test("instant policy selects only approved Fries business events", () => {
  const cases: Array<[WebsiteSupportEventPayload, string, string, string]> = [
    [{ signal: "conversation_started", intentKind: "purchase_interest", intentStrength: "high", humanActionRequired: false }, "support.conversation.created", "support_conversation", "Fries 高意向商机"],
    [{ signal: "conversation_started", intentKind: "wholesale_retail_partnership", intentStrength: "high", humanActionRequired: false }, "support.conversation.created", "support_conversation", "Fries 高意向商机"],
    [{ signal: "customer_reply", humanActionRequired: true, status: "waiting_staff" }, "support.conversation.updated", "support_conversation", "Fries 重要客户回复"],
    [{ signal: "ai_answer", category: "damaged_item", humanActionRequired: true }, "support.conversation.updated", "support_conversation", "Fries 订单 / 售后待处理"],
    [{ signal: "human_takeover", humanActionRequired: true }, "support.conversation.updated", "support_conversation", "Fries 请求人工接管"],
    [{ signal: "ticket_progress", ticketProgress: "resolved", humanActionRequired: false }, "support.ticket.updated", "support_ticket", "Fries 工单关键进度"]
  ];
  for (const [payload, eventType, aggregateType, title] of cases) {
    const event = mapSupportLeaseToAgentOps(lease(payload, eventType, aggregateType));
    const notification = renderPolicyWeCom(event, "task-1");
    assert.equal(notification?.title, title);
    assert.ok(notification?.action.label);
    assert.match(notification?.summary || "", /Fries|网站|官网|客户|订单|工单/);
  }
});

test("instant policy suppresses operational noise and low-signal conversations", () => {
  for (const payload of [
    { signal: "heartbeat" as const },
    { signal: "search" as const },
    { signal: "sync" as const },
    { signal: "no_progress" as const },
    { signal: "ai_answer" as const, intentKind: "general_support" as const, intentStrength: "low" as const },
    { signal: "conversation_started" as const, intentKind: "purchase_interest" as const, intentStrength: "medium" as const },
    { signal: "ticket_progress" as const, ticketProgress: "updated" as const }
  ]) {
    assert.equal(renderPolicyWeCom(mapSupportLeaseToAgentOps(lease(payload)), null), null);
  }
});

test("mock Station deduplicates handled events and stores no customer content", () => {
  const station = new MockStationOS(token, secret, organizationId);
  const event = mapSupportLeaseToAgentOps(lease({ signal: "customer_reply", humanActionRequired: true }));
  const signature = signAgentOpsEvent(event, secret);
  assert.equal(station.ingest(token, event, signature).code, "accepted");
  assert.equal(station.ingest(token, event, signature).code, "duplicate");
  assert.equal(station.notifications.length, 1);
  assert.doesNotMatch(JSON.stringify(station.notifications), /@|customer message|对话正文.*[^。]/i);
  assert.match(station.notifications[0].dedupeKey, /^fries:/);
});

test("WeCom summaries and weekly digest redact PII and use the disabled Monday default", () => {
  assert.equal(redactWeComText("联系 a@example.com 或 +86 138 0013 8000 token=abc"), "联系 [邮箱已隐藏] 或 [电话已隐藏] token=[已隐藏]");
  assert.deepEqual(readFriesWeeklyDigestConfig({}), { enabled: false, weekday: 1, time: "09:00", timezone: "Asia/Shanghai" });
  assert.deepEqual(readFriesWeeklyDigestConfig({ FRIES_WECOM_WEEKLY_DIGEST_ENABLED: "true", FRIES_WECOM_WEEKLY_DIGEST_WEEKDAY: "5", FRIES_WECOM_WEEKLY_DIGEST_TIME: "18:30", FRIES_WECOM_WEEKLY_DIGEST_TIMEZONE: "Asia/Tokyo" }), { enabled: true, weekday: 5, time: "18:30", timezone: "Asia/Tokyo" });
  const digest = buildFriesWeeklyDigest({
    periodStart: "2026-11-02",
    periodEnd: "2026-11-08",
    metrics: { consultations: 24, qualifiedLeads: 4, tickets: 6, handoffs: 3, conversions: 1 },
    outcomes: ["完成 1 个转化，客户 a@example.com"],
    incomplete: ["2 个售后待处理"],
    importantIssues: ["+86 138 0013 8000 反馈物流问题"],
    nextWeekAdvice: ["优先回复高意向零售合作"]
  }, {});
  assert.equal(digest.schedule.weekday, 1);
  assert.equal(digest.schedule.time, "09:00");
  assert.equal(digest.schedule.timezone, "Asia/Shanghai");
  assert.deepEqual(digest.sections.map((section) => section.key), ["outcomes", "incomplete", "important_issues", "next_week_advice"]);
  assert.doesNotMatch(JSON.stringify(digest), /a@example\.com|138 0013 8000/);
  assert.throws(() => readFriesWeeklyDigestConfig({ FRIES_WECOM_WEEKLY_DIGEST_WEEKDAY: "0" }), /weekday/);
  assert.throws(() => readFriesWeeklyDigestConfig({ FRIES_WECOM_WEEKLY_DIGEST_TIMEZONE: "not-a-zone" }), /timezone/);
});
