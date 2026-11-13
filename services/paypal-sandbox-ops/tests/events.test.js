import test from "node:test";
import assert from "node:assert/strict";
import { authorize, parsePayload, persist } from "../lib/events.js";

const event = { environment: "sandbox", event: { id: "WH-12345678", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAPTURE-1", email: "private@example.test" } }, payloadSha256: "a".repeat(64) };

test("OPS token is mandatory and compared exactly", () => {
  assert.doesNotThrow(() => authorize(`Bearer ${"x".repeat(32)}`, "x".repeat(32)));
  assert.throws(() => authorize("Bearer wrong", "x".repeat(32)), error => error.status === 401);
  assert.throws(() => authorize(undefined, "x".repeat(32)), error => error.status === 401);
});

test("only sandbox allowlisted events with matching idempotency keys are accepted", () => {
  assert.deepEqual(parsePayload(event, event.event.id), { id: event.event.id, eventType: event.event.event_type, payloadSha256: event.payloadSha256, resourceId: "CAPTURE-1" });
  assert.throws(() => parsePayload({ ...event, environment: "live" }, event.event.id));
  assert.throws(() => parsePayload(event, "WH-OTHER123"));
  assert.throws(() => parsePayload({ ...event, event: { ...event.event, event_type: "CUSTOMER.DISPUTE.CREATED" } }, event.event.id));
});

test("durable persistence reports created and duplicate ACKs", async () => {
  let count = 0;
  const sql = async () => [{ event_id: event.event.id, delivery_count: ++count }];
  const input = parsePayload(event, event.event.id);
  assert.deepEqual(await persist(sql, input), { persisted: true, eventId: event.event.id, status: "created" });
  assert.deepEqual(await persist(sql, input), { persisted: true, eventId: event.event.id, status: "duplicate" });
});
