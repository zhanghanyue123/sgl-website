import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { authorize, parsePayload, persist } from "../lib/events.js";

const event = { environment: "sandbox", event: { id: "WH-12345678", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAPTURE-1", email: "private@example.test" } }, payloadSha256: "a".repeat(64) };

test("OPS token is mandatory and compared exactly", () => {
  assert.doesNotThrow(() => authorize(`Bearer ${"x".repeat(32)}`, "x".repeat(32)));
  assert.throws(() => authorize("Bearer wrong", "x".repeat(32)), error => error.status === 401);
  assert.throws(() => authorize(undefined, "x".repeat(32)), error => error.status === 401);
});

test("only sandbox allowlisted events with matching idempotency keys are accepted", () => {
  assert.deepEqual(parsePayload(event, event.event.id), { id: event.event.id, eventType: event.event.event_type, payloadSha256: event.payloadSha256, resourceId: "CAPTURE-1", paypalOrderId: null, captureId: "CAPTURE-1", providerStatus: null, amountCents: null, currency: null });
  assert.throws(() => parsePayload({ ...event, environment: "live" }, event.event.id));
  assert.throws(() => parsePayload(event, "WH-OTHER123"));
  assert.throws(() => parsePayload({ ...event, event: { ...event.event, event_type: "CUSTOMER.DISPUTE.CREATED" } }, event.event.id));
});

test("durable persistence reports created and duplicate ACKs", async () => {
  let count = 0;
  const sql = async () => [{ event_id: event.event.id, delivery_count: ++count }];
  const input = parsePayload(event, event.event.id);
  assert.deepEqual(await persist(sql, input), { persisted: true, eventId: event.event.id, status: "created", orderSyncStatus: undefined });
  assert.deepEqual(await persist(sql, input), { persisted: true, eventId: event.event.id, status: "duplicate", orderSyncStatus: undefined });
});

test("runtime role is constrained to the sandbox event table", async () => {
  const migration = await readFile(new URL("../migrations/0001_paypal_sandbox_events.sql", import.meta.url), "utf8");
  const bootstrap = await readFile(new URL("../scripts/bootstrap-runtime-role.js", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS paypal_sandbox_events/);
  assert.match(bootstrap, /GRANT SELECT, INSERT, UPDATE ON TABLE/);
  assert.doesNotMatch(bootstrap, /GRANT[^\n]*DELETE/);
  assert.match(bootstrap, /REVOKE CREATE ON SCHEMA public/);
  assert.match(bootstrap, /unexpected\.length/);
  assert.match(bootstrap, /GRANT EXECUTE ON FUNCTION apply_paypal_sandbox_event/);
  assert.match(bootstrap, /REVOKE ALL ON TABLE paypal_sandbox_test_orders/);
});

test("capture events project only bounded order and amount fields", () => {
  const value = {
    environment: "sandbox",
    event: {
      id: "WH-CAPTURE123", event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: { id: "CAPTURE-2", status: "COMPLETED", amount: { value: "1.00", currency_code: "usd" }, supplementary_data: { related_ids: { order_id: "ORDER-2" } } }
    },
    payloadSha256: "b".repeat(64)
  };
  const parsed = parsePayload(value, value.event.id);
  assert.equal(parsed.paypalOrderId, "ORDER-2");
  assert.equal(parsed.captureId, "CAPTURE-2");
  assert.equal(parsed.amountCents, 100);
  assert.equal(parsed.currency, "USD");
  assert.equal(parsed.providerStatus, "COMPLETED");
});
