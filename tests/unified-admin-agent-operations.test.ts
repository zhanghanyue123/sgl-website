import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { emptyAgent, normalizeProjectionActivity } from "../lib/admin/agent-operations";

test("Fries stays explicitly Not Deployed without a deployment declaration", () => {
  const agent = emptyAgent("fries", "not_deployed");
  assert.equal(agent.operationalStatus, "not_deployed");
  assert.equal(agent.connectionStatus, "not_deployed");
  assert.equal(agent.tasksCompleted, null);
  assert.ok(agent.metrics.every(metric => metric.value === null && metric.status === "not_deployed"));
});

test("Agent activity accepts opaque references and rejects customer content", () => {
  const activity = normalizeProjectionActivity("hello", {
    id: "event_123", occurredAt: "2026-11-08T08:00:00.000Z", eventType: "hello.message.classified",
    result: "success", customerId: "customer_42", taskId: "task_81"
  }, "hello:read-only-projection");
  assert.equal(activity?.customerId, "customer_42");
  assert.equal(activity?.taskId, "task_81");
  assert.equal(normalizeProjectionActivity("hello", {
    id: "event_124", occurredAt: "2026-11-08T08:00:00.000Z", eventType: "hello.message.received", customerId: "person@example.com"
  }, "hello:read-only-projection")?.customerId, null);
});

test("Agent Operations BFF is session protected, read-only and uncached", async () => {
  const route = await readFile(new URL("../app/api/admin/unified/agents/route.ts", import.meta.url), "utf8");
  assert.match(route, /requireAdmin\(request, "agents:read"\)/);
  assert.match(route, /cache-control.*private, no-store/i);
  assert.doesNotMatch(route, /export async function (POST|PATCH|PUT|DELETE)/);
});

test("Agent Operations integrations remain server-only and bounded", async () => {
  const source = await readFile(new URL("../lib/admin/agent-operations.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /NEXT_PUBLIC_/);
  assert.match(source, /sgl\.admin\.agent-operations\.v1/);
  assert.match(source, /AbortSignal\.timeout\(adminSourceTimeoutMs\(\)\)/);
  assert.doesNotMatch(source, /email_body|message_body|raw_mime/i);
});

test("Agent Operations UI exposes no mutation controls", async () => {
  const source = await readFile(new URL("../components/admin/AgentOperationsDashboard.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fetch\(|method:\s*["'](?:POST|PATCH|PUT|DELETE)/);
  assert.match(source, /所有开发邮件继续使用现有人工审批/);
  assert.match(source, /Not Deployed/);
});
