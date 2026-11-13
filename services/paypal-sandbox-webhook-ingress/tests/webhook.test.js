import test from "node:test";
import assert from "node:assert/strict";
import { EVENT_ALLOWLIST, HttpError, __resetForTests, persistEvent, rateLimit, validateEvent, verifySignature } from "../lib/webhook.js";

const originalEnv = { ...process.env };
const event = { id: "WH-12345678", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAPTURE-1", email_address: "private@example.test" } };
const headers = {
  "paypal-transmission-time": new Date().toISOString(),
  "paypal-cert-url": "https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-1",
  "paypal-auth-algo": "SHA256withRSA",
  "paypal-transmission-id": "tx-1",
  "paypal-transmission-sig": "signature"
};

function setEnv() {
  Object.assign(process.env, { PAYPAL_ENV: "sandbox", PAYPAL_CLIENT_ID: "client", PAYPAL_CLIENT_SECRET: "secret", PAYPAL_WEBHOOK_ID: "webhook", PREVIEW_OPS_URL: "https://ops.example.test", PREVIEW_OPS_TOKEN: "ops-token" });
  __resetForTests();
}

test.afterEach(() => { process.env = { ...originalEnv }; __resetForTests(); });

test("configuration is sandbox-only and event allowlist is explicit", async () => {
  setEnv();
  assert.equal(EVENT_ALLOWLIST.has("PAYMENT.CAPTURE.COMPLETED"), true);
  assert.equal(EVENT_ALLOWLIST.has("CUSTOMER.DISPUTE.CREATED"), false);
  assert.equal(validateEvent(event), event);
  process.env.PAYPAL_ENV = "live";
  await assert.rejects(() => verifySignature(headers, event, async () => new Response()), HttpError);
});

test("official verification is required before persistence", async () => {
  setEnv();
  const calls = [];
  const fetcher = async (input, init) => {
    calls.push([String(input), init]);
    if (String(input).endsWith("/v1/oauth2/token")) return Response.json({ access_token: "token", expires_in: 300 });
    return Response.json({ verification_status: "SUCCESS" });
  };
  await verifySignature(headers, event, fetcher);
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[1][1].body).webhook_event.id, event.id);
  assert.equal(calls[1][1].headers.Authorization, "Bearer token");
});

test("invalid PayPal signature is rejected", async () => {
  setEnv();
  const fetcher = async input => String(input).endsWith("/v1/oauth2/token") ? Response.json({ access_token: "token", expires_in: 300 }) : Response.json({ verification_status: "FAILURE" });
  await assert.rejects(() => verifySignature(headers, event, fetcher), error => error.status === 400);
});

test("OPS durable acknowledgement must bind the same event", async () => {
  setEnv();
  const raw = JSON.stringify(event);
  const ok = await persistEvent(event, raw, async (_input, init) => {
    assert.equal(init.headers.Authorization, "Bearer ops-token");
    assert.equal(init.headers["Idempotency-Key"], event.id);
    const body = JSON.parse(init.body);
    assert.match(body.payloadSha256, /^[a-f0-9]{64}$/);
    return Response.json({ persisted: true, eventId: event.id, status: "created" });
  });
  assert.equal(ok.status, "created");
  await assert.rejects(() => persistEvent(event, raw, async () => Response.json({ persisted: true, eventId: "wrong", status: "created" })), error => error.status === 502);
});

test("rate limiting fails closed", () => {
  for (let index = 0; index < 60; index += 1) rateLimit("source", 1000);
  assert.throws(() => rateLimit("source", 1000), error => error.status === 429);
});
