import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { agentScopes, hasAgentScope } from "../lib/agent/policy";
import {
  parseSupportEventAck,
  parseSupportEventNack,
  parseSupportEventPull,
  parseSupportEventReplay,
  sanitizeWebsiteSupportPayload,
  SupportEventInputError
} from "../lib/integrations/outbox";

test("support event scopes are independent and explicit", () => {
  assert.ok(agentScopes.includes("support-events:read"));
  assert.ok(agentScopes.includes("support-events:ack"));
  assert.equal(hasAgentScope(["support-events:read"], "support-events:read"), true);
  assert.equal(hasAgentScope(["support-events:read"], "support-events:ack"), false);
});

test("support event payload permits operational metadata and rejects customer data", () => {
  assert.deepEqual(sanitizeWebsiteSupportPayload({
    category: "order_issue",
    priority: "high",
    status: "waiting_staff",
    locale: "zh-CN",
    humanActionRequired: true,
    intentKind: "wholesale_retail_partnership",
    intentStrength: "high",
    signal: "human_takeover",
    ticketProgress: "assigned"
  }), {
    category: "order_issue",
    priority: "high",
    status: "waiting_staff",
    locale: "zh-CN",
    humanActionRequired: true,
    intentKind: "wholesale_retail_partnership",
    intentStrength: "high",
    signal: "human_takeover",
    ticketProgress: "assigned"
  });
  for (const payload of [
    { email: "customer@example.com" },
    { body: "customer message" },
    { orderId: "order-1" },
    { summary: "unreviewed text" }
  ]) {
    assert.throws(() => sanitizeWebsiteSupportPayload(payload), SupportEventInputError);
  }
});

test("support event pull and ack parsers are bounded and strict", () => {
  assert.deepEqual(parseSupportEventPull({ limit: "10", leaseSeconds: "45" }), { limit: 10, leaseSeconds: 45 });
  assert.throws(() => parseSupportEventPull({ limit: 101 }), /limit/);
  assert.throws(() => parseSupportEventPull({ extra: true }), /unknown field/);
  const valid = {
    eventId: "123e4567-e89b-42d3-a456-426614174000",
    receipt: "a".repeat(43),
    idempotencyKey: "ack-key-0001"
  };
  assert.deepEqual(parseSupportEventAck(valid), valid);
  assert.throws(() => parseSupportEventAck({ ...valid, eventId: "------------------------------------" }), /UUID/);
  assert.throws(() => parseSupportEventAck({ ...valid, customerEmail: "x@example.com" }), /unknown field/);
  assert.deepEqual(parseSupportEventNack({eventId:valid.eventId,receipt:valid.receipt,errorCode:"station.timeout",retryable:true}),{eventId:valid.eventId,receipt:valid.receipt,errorCode:"station.timeout",retryable:true});
  assert.throws(()=>parseSupportEventNack({eventId:valid.eventId,receipt:valid.receipt,errorCode:"bad value",retryable:true}),/errorCode/);
  assert.deepEqual(parseSupportEventReplay({eventId:valid.eventId}),{eventId:valid.eventId});
});

test("migration extends the shared outbox without duplicating commerce records", async () => {
  const sql = await readFile(new URL("../db/migrations/0012_support_event_outbox.sql", import.meta.url), "utf8");
  assert.match(sql, /ALTER TABLE integration_outbox/);
  assert.doesNotMatch(sql, /CREATE TABLE/);
  assert.match(sql, /source <> 'website' OR status <> 'processing'/);
  assert.match(sql, /source <> 'website' OR status <> 'delivered'/);
  assert.match(sql, /destination = 'retail_agent'/);
  assert.match(sql, /integration_outbox_agent_ack_idempotency_idx/);
  assert.match(sql, /max_attempts/);
  assert.match(sql, /failed_at/);
  assert.match(sql, /ALTER TABLE agent_clients/);
  assert.match(sql, /organization_id/);
});

test("support route binds leases to clients, hashes receipts, and audits lifecycle changes", async () => {
  const operations = await readFile(new URL("../lib/integrations/outbox.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/agent/v1/support-events/route.ts", import.meta.url), "utf8");
  assert.match(operations, /FOR UPDATE SKIP LOCKED/);
  assert.match(operations, /leased_by_agent_client_id=\$\{clientId\}/);
  assert.match(operations, /lease_token_hash=\$\{hashToken\(receipt\)\}/);
  assert.match(operations, /status='delivered'/);
  assert.match(operations, /support\.outbox\.(nacked|dead_lettered)/);
  assert.match(operations, /organization_id=\$\{scope\.organizationId\}/);
  assert.match(operations, /support\.outbox\.(leased|acknowledged)/);
  assert.match(route, /"support-events:read"/);
  assert.match(route, /"support-events:ack"/);
  assert.match(route, /"support-events:nack"/);
  assert.match(route, /"support-events:replay"/);
  assert.match(route, /logAgentAction/);
  assert.match(route, /readBoundedRequestBody\(request, 4_096\)/);
  assert.match(route, /Cache-Control.*no-store/);
});
