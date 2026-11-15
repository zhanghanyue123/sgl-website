import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AIRWALLEX_SANDBOX_BASE_URL,
  getAirwallexApiConfig
} from "../lib/payments/airwallex/config";
import {
  createAirwallexPaymentIntent,
  getAirwallexAccessToken,
  resetAirwallexTokenCacheForTests
} from "../lib/payments/airwallex/client";
import { airwallexAmountToCents, centsToAirwallexAmount } from "../lib/payments/airwallex/money";
import {
  deterministicAirwallexRequestId,
  hashAirwallexPaymentRequest,
  validateAirwallexPaymentIntent
} from "../lib/payments/airwallex/invariants";
import { createCheckoutStatusToken, verifyCheckoutStatusToken } from "../lib/payments/airwallex/status-token";
import {
  parseVerifiedAirwallexWebhook,
  signAirwallexWebhookForTest,
  verifyAirwallexWebhookSignature
} from "../lib/payments/airwallex/webhook";
import { readBoundedRequestBody, RequestBodyError } from "../lib/http/read-bounded-body";

const envNames = [
  "AIRWALLEX_ENV",
  "AIRWALLEX_CLIENT_ID",
  "AIRWALLEX_API_KEY",
  "AIRWALLEX_WEBHOOK_SECRET",
  "AIRWALLEX_EXPECTED_ACCOUNT_ID",
  "AIRWALLEX_WEBHOOK_API_VERSION"
] as const;

function configure() {
  process.env.AIRWALLEX_ENV = "sandbox";
  process.env.AIRWALLEX_CLIENT_ID = "client_unit_test";
  process.env.AIRWALLEX_API_KEY = "api_key_unit_test";
  process.env.AIRWALLEX_WEBHOOK_SECRET = "webhook_secret_unit_test";
  process.env.AIRWALLEX_EXPECTED_ACCOUNT_ID = "acct_unit_test";
  process.env.AIRWALLEX_WEBHOOK_API_VERSION = "2026-08-21";
}

function cleanup() {
  resetAirwallexTokenCacheForTests();
  for (const name of envNames) delete process.env[name];
}

test("Airwallex configuration is fixed to the Sandbox API", () => {
  configure();
  assert.equal(AIRWALLEX_SANDBOX_BASE_URL, "https://api.sandbox.airwallex.com");
  assert.equal(getAirwallexApiConfig().baseUrl, AIRWALLEX_SANDBOX_BASE_URL);
  process.env.AIRWALLEX_ENV = "production";
  assert.throws(() => getAirwallexApiConfig(), /exactly sandbox/);
  cleanup();
});

test("authentication is server-side, cached, and PaymentIntent creation uses authoritative values", async () => {
  configure();
  let logins = 0;
  let creates = 0;
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/api/v1/authentication/login")) {
      logins++;
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers["x-client-id"], "client_unit_test");
      assert.equal(headers["x-api-key"], "api_key_unit_test");
      return Response.json({ token: "sandbox_token", expires_at: new Date(Date.now() + 30 * 60_000).toISOString() }, { status: 201 });
    }
    creates++;
    assert.equal(url, `${AIRWALLEX_SANDBOX_BASE_URL}/api/v1/pa/payment_intents/create`);
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer sandbox_token");
    assert.equal(headers["x-api-version"], "2026-08-21");
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body, {
      request_id: "sgl_pi_request",
      merchant_order_id: "11111111-1111-4111-8111-111111111111",
      amount: 25.5,
      currency: "USD",
      return_url: "https://example.test/checkout/success"
    });
    return Response.json({
      id: "int_unit_test",
      request_id: body.request_id,
      merchant_order_id: body.merchant_order_id,
      amount: body.amount,
      currency: body.currency,
      status: "REQUIRES_PAYMENT_METHOD",
      updated_at: new Date().toISOString(),
      client_secret: "client_secret_unit_test"
    }, { status: 201 });
  };
  assert.equal(await getAirwallexAccessToken(mockFetch), "sandbox_token");
  const intent = await createAirwallexPaymentIntent({
    requestId: "sgl_pi_request",
    merchantOrderId: "11111111-1111-4111-8111-111111111111",
    amountCents: 2550,
    currency: "USD",
    returnUrl: "https://example.test/checkout/success"
  }, mockFetch);
  assert.equal(intent.id, "int_unit_test");
  assert.equal(logins, 1);
  assert.equal(creates, 1);
  cleanup();
});

test("authentication retries once after 401 and coalesces concurrent token refresh", async () => {
  configure();
  let logins = 0;
  let apiCalls = 0;
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/api/v1/authentication/login")) {
      logins++;
      await Promise.resolve();
      return Response.json({ token: `token_${logins}`, expires_at: new Date(Date.now() + 30 * 60_000).toISOString() }, { status: 201 });
    }
    apiCalls++;
    const headers = init?.headers as Record<string, string>;
    if (apiCalls === 1) {
      assert.equal(headers.Authorization, "Bearer token_1");
      return Response.json({ code: "unauthorized" }, { status: 401 });
    }
    assert.equal(headers.Authorization, "Bearer token_2");
    return Response.json({
      id: "int_retry_test",
      request_id: "sgl_pi_retry",
      merchant_order_id: "11111111-1111-4111-8111-111111111111",
      amount: 10,
      currency: "USD",
      status: "REQUIRES_PAYMENT_METHOD",
      updated_at: new Date().toISOString()
    }, { status: 201 });
  };
  await Promise.all([getAirwallexAccessToken(mockFetch), getAirwallexAccessToken(mockFetch)]);
  assert.equal(logins, 1);
  const intent = await createAirwallexPaymentIntent({
    requestId: "sgl_pi_retry",
    merchantOrderId: "11111111-1111-4111-8111-111111111111",
    amountCents: 1000,
    currency: "USD",
    returnUrl: "https://example.test/checkout/success"
  }, mockFetch);
  assert.equal(intent.id, "int_retry_test");
  assert.equal(logins, 2);
  assert.equal(apiCalls, 2);
  cleanup();
});

test("amounts, deterministic request IDs, and provider responses are exact", () => {
  assert.equal(centsToAirwallexAmount(2550, "USD"), 25.5);
  assert.equal(airwallexAmountToCents("25.50", "USD"), 2550);
  assert.throws(() => airwallexAmountToCents("25.501", "USD"));
  assert.throws(() => centsToAirwallexAmount(100, "JPY"));
  const request = deterministicAirwallexRequestId("pi", "order", "key");
  assert.equal(request, deterministicAirwallexRequestId("pi", "order", "key"));
  assert.equal(request.length, 64);
  assert.notEqual(request, deterministicAirwallexRequestId("pi", "order", "other"));
  const claim = {
    paymentId: "22222222-2222-4222-8222-222222222222",
    orderId: "11111111-1111-4111-8111-111111111111",
    requestId: request,
    merchantOrderId: "11111111-1111-4111-8111-111111111111",
    amountCents: 2550,
    currency: "USD",
    providerReference: null,
    paymentStatus: "created"
  };
  const valid = { id: "int_test", request_id: request, merchant_order_id: claim.merchantOrderId, amount: 25.5, currency: "USD", status: "REQUIRES_PAYMENT_METHOD", updated_at: new Date().toISOString() };
  assert.equal(validateAirwallexPaymentIntent(valid, claim).id, "int_test");
  assert.equal(validateAirwallexPaymentIntent({ ...valid, request_id: "later_hpp_operation" }, claim).id, "int_test");
  assert.throws(() => validateAirwallexPaymentIntent({ ...valid, amount: 1 }, claim));
  assert.equal(hashAirwallexPaymentRequest(claim.orderId, 2550, "USD"), hashAirwallexPaymentRequest(claim.orderId, 2550, "USD"));
});

test("raw-body HMAC rejects body changes, bad signatures and stale timestamps", () => {
  const timestamp = String(Date.now());
  const raw = new TextEncoder().encode('{"id":"evt_1"}');
  const signature = signAirwallexWebhookForTest("secret", timestamp, raw);
  assert.equal(verifyAirwallexWebhookSignature({ rawBody: raw, timestamp, signature, secret: "secret" }), Number(timestamp));
  assert.throws(() => verifyAirwallexWebhookSignature({ rawBody: new TextEncoder().encode('{"id":"evt_1"} '), timestamp, signature, secret: "secret" }));
  assert.throws(() => verifyAirwallexWebhookSignature({ rawBody: raw, timestamp, signature: "0".repeat(64), secret: "secret" }));
  assert.throws(() => verifyAirwallexWebhookSignature({ rawBody: raw, timestamp, signature, secret: "secret", nowMs: Number(timestamp) + 600_000 }));
});

test("verified webhook parsing enforces account, version, amount and merchant order", () => {
  const timestampMs = Date.now();
  const event = {
    id: "evt_unit_1",
    name: "payment_intent.succeeded",
    account_id: "acct_unit_test",
    org_id: "org_unit_test",
    version: "2026-08-21",
    created_at: new Date(timestampMs).toISOString(),
    data: { object: { id: "int_unit_test", request_id: "request_unit", merchant_order_id: "11111111-1111-4111-8111-111111111111", amount: 25.5, currency: "USD", status: "SUCCEEDED" } }
  };
  const rawBody = new TextEncoder().encode(JSON.stringify(event));
  const parsed = parseVerifiedAirwallexWebhook({ rawBody, timestampMs, expectedAccountId: "acct_unit_test", expectedApiVersion: "2026-08-21" });
  assert.equal(parsed.amountCents, 2550);
  assert.equal(parsed.merchantOrderId, event.data.object.merchant_order_id);
  assert.equal(parsed.resourceId, "int_unit_test");
  assert.throws(() => parseVerifiedAirwallexWebhook({ rawBody, timestampMs, expectedAccountId: "wrong", expectedApiVersion: "2026-08-21" }));
  assert.throws(() => parseVerifiedAirwallexWebhook({ rawBody, timestampMs, expectedAccountId: "acct_unit_test", expectedApiVersion: "2025-01-01" }));
  const falseSuccess = new TextEncoder().encode(JSON.stringify({ ...event, data: { object: { ...event.data.object, status: "PENDING" } } }));
  assert.throws(() => parseVerifiedAirwallexWebhook({ rawBody: falseSuccess, timestampMs, expectedAccountId: "acct_unit_test", expectedApiVersion: "2026-08-21" }), /event and resource status/);
  const falseRefund = new TextEncoder().encode(JSON.stringify({
    ...event,
    id: "evt_refund_1",
    name: "refund.accepted",
    data: { object: { id: "rfd_unit_test", request_id: "sgl_rf_request", payment_intent_id: "int_unit_test", amount: 25.5, currency: "USD", status: "RECEIVED" } }
  }));
  assert.throws(() => parseVerifiedAirwallexWebhook({ rawBody: falseRefund, timestampMs, expectedAccountId: "acct_unit_test", expectedApiVersion: "2026-08-21" }), /event and resource status/);
});

test("bounded body reader rejects oversized declared and streaming bodies", async () => {
  await assert.rejects(
    readBoundedRequestBody(new Request("https://example.test", { method: "POST", headers: { "content-length": "5" } }), 4),
    (error: unknown) => error instanceof RequestBodyError && error.status === 413
  );
  await assert.rejects(
    readBoundedRequestBody(new Request("https://example.test", { method: "POST", body: new Uint8Array([1, 2, 3, 4, 5]) }), 4),
    (error: unknown) => error instanceof RequestBodyError && error.status === 413
  );
});

test("checkout status tokens are signed and cannot be tampered with", () => {
  configure();
  const token = createCheckoutStatusToken("11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222");
  assert.deepEqual(verifyCheckoutStatusToken(token), {
    orderId: "11111111-1111-4111-8111-111111111111",
    paymentId: "22222222-2222-4222-8222-222222222222"
  });
  assert.equal(verifyCheckoutStatusToken(token.replace(/.$/, token.endsWith("a") ? "b" : "a")), null);
  cleanup();
});

test("migration enforces idempotency, durable inbox, monotonic review and refund caps", async () => {
  const sql = await readFile(new URL("../db/migrations/0007_airwallex_sandbox.sql", import.meta.url), "utf8");
  assert.match(sql, /provider IN \('stripe', 'alipay', 'airwallex', 'development'\)/);
  assert.match(sql, /payments_provider_request_unique/);
  assert.match(sql, /provider_transition_rank/);
  assert.match(sql, /payments_one_open_airwallex_intent_per_order/);
  assert.match(sql, /CREATE TABLE payment_webhook_inbox/);
  assert.match(sql, /UNIQUE\(provider,environment,external_event_id\)/);
  assert.match(sql, /apply_airwallex_payment_succeeded/);
  assert.match(sql, /evt\.provider_status<>'SUCCEEDED'/);
  assert.match(sql, /provider_reference=evt\.resource_id/);
  assert.doesNotMatch(sql, /provider_reference IS NULL AND merchant_order_reference=evt/);
  assert.match(sql, /payment_payload_mismatch/);
  assert.match(sql, /payment_terminal_conflict/);
  assert.match(sql, /pay\.status='cancelled'/);
  assert.match(sql, /evt\.occurred_at<=pay\.provider_updated_at/);
  assert.match(sql, /late_success_after_release/);
  assert.match(sql, /inventory_inconsistent/);
  assert.match(sql, /provider_transition_rank=1000/);
  assert.doesNotMatch(sql, /pay\.provider_updated_at>evt\.occurred_at/);
  assert.match(sql, /refund total exceeds captured payment/);
  assert.match(sql, /refunds_maker_checker_check/);
  assert.match(sql, /refunds_sandbox_execution_state_check/);
  assert.match(sql, /environment='sandbox'/);
  assert.doesNotMatch(sql, /api\.airwallex\.com/);
});

test("refund execution is not exposed by this checkout-only integration or Agent APIs", async () => {
  const agentRoutes = await readFile(new URL("../app/api/agent/v1/actions/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(agentRoutes, /executeApprovedAirwallexRefund|payments:execute/);
  const webhookService = await readFile(new URL("../lib/payments/airwallex/webhook-service.ts", import.meta.url), "utf8");
  assert.match(webhookService, /row\.approved_by/);
  assert.match(webhookService, /row\.executed_by/);
  assert.match(webhookService, /row\.provider_request_id !== event\.providerRequestId/);
  assert.match(webhookService, /provider_transition_rank=\$\{paymentEventRank\(event\)\}/);
  assert.match(webhookService, /lowerLifecycleRank/);
  assert.match(webhookService, /failedAttemptReset/);
  assert.match(webhookService, /payment_intent\.requires_payment_method/);
  assert.match(webhookService, /resetsFailedPaymentAttempt\(event\)/);
  assert.match(webhookService, /airwallex:refund:' \+ row\.refund_id \+ ':retail_agent/);
});

test("Airwallex checkout fails closed without webhook configuration and HTTPS", async () => {
  const route = await readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8");
  assert.match(route, /getAirwallexWebhookConfig\(\)/);
  assert.match(route, /protocol !== "https:"/);
  const browser = await readFile(new URL("../lib/payments/airwallex/browser.ts", import.meta.url), "utf8");
  assert.match(browser, /url\.protocol !== "https:"/);
  assert.doesNotMatch(browser, /url\.hostname !== "localhost"/);
  const service = await readFile(new URL("../lib/payments/airwallex/service.ts", import.meta.url), "utf8");
  assert.match(service, /provider_event_type=NULL,provider_transition_rank=NULL/);
});
