import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  __resetPayPalTokenCacheForTests,
  approveUrl,
  assertPayPalOrderMatches,
  createPayPalOrder,
  paypalConfig,
  verifyPayPalWebhook,
  type PayPalOrder
} from "../lib/payments/paypal/client";
import { POST as createOrderRoute } from "../app/api/paypal/orders/route";
import { POST as captureRoute } from "../app/api/paypal/orders/capture/route";
import { POST as webhookRoute } from "../app/api/paypal/webhook/route";

const config = {
  PAYPAL_ENV: "sandbox",
  PAYPAL_CLIENT_ID: "sandbox-client-id",
  PAYPAL_CLIENT_SECRET: "sandbox-client-secret",
  PAYPAL_WEBHOOK_ID: "sandbox-webhook-id"
};

function setEnvironment() {
  Object.assign(process.env, config, {
    PAYPAL_ENABLED: "true",
    PAYPAL_WEBHOOK_ENABLED: "true",
    STORE_CHECKOUT_ENABLED: "true",
    SITE_URL: "https://example.test",
    OPS_STORE_API_URL: "https://ops.example.test/store",
    OPS_STORE_API_TOKEN: "ops-test-token"
  });
  __resetPayPalTokenCacheForTests();
}

function clearEnvironment() {
  for (const key of ["PAYPAL_ENV", "PAYPAL_ENABLED", "PAYPAL_LIVE_ENABLED", "PAYPAL_WEBHOOK_ENABLED", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID", "PAYPAL_LIVE_CLIENT_ID", "PAYPAL_LIVE_CLIENT_SECRET", "PAYPAL_LIVE_WEBHOOK_ID", "STORE_CHECKOUT_ENABLED", "SITE_URL", "OPS_STORE_API_URL", "OPS_STORE_API_TOKEN"]) delete process.env[key];
  __resetPayPalTokenCacheForTests();
}

const paypalOrder = (status = "CREATED"): PayPalOrder => ({
  id: "5O190127TN364715T",
  status,
  purchase_units: [{ reference_id: "order_123", custom_id: "order_123", amount: { currency_code: "USD", value: "25.00" } }],
  links: [{ rel: "payer-action", method: "GET", href: "https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T" }]
});

test("PayPal configuration separates sandbox and live credentials", () => {
  const sandbox = paypalConfig(config);
  assert.equal(sandbox.environment, "sandbox");
  assert.equal(sandbox.baseUrl, "https://api-m.sandbox.paypal.com");
  assert.equal(sandbox.approvalHost, "www.sandbox.paypal.com");
  const live = paypalConfig({ ...config, PAYPAL_ENV: "live", PAYPAL_LIVE_CLIENT_ID: "live-client-id", PAYPAL_LIVE_CLIENT_SECRET: "live-client-secret", PAYPAL_LIVE_WEBHOOK_ID: "live-webhook-id" });
  assert.equal(live.environment, "live");
  assert.equal(live.baseUrl, "https://api-m.paypal.com");
  assert.equal(live.approvalHost, "www.paypal.com");
  assert.notEqual(live.webhookId, sandbox.webhookId);
  assert.throws(() => paypalConfig({ ...config, PAYPAL_ENV: "live" }));
  assert.throws(() => paypalConfig({ ...config, PAYPAL_ENV: "invalid" }));
  assert.throws(() => paypalConfig({ ...config, PAYPAL_CLIENT_SECRET: "" }));
});

test("PayPal website routes stay closed unless the dedicated server flag is enabled", async () => {
  clearEnvironment();
  const createResponse = await createOrderRoute(new Request("https://example.test/api/paypal/orders", { method: "POST" }));
  const captureResponse = await captureRoute(new Request("https://example.test/api/paypal/orders/capture", { method: "POST" }));
  const webhookResponse = await webhookRoute(new Request("https://example.test/api/paypal/webhook", { method: "POST" }));
  assert.equal(createResponse.status, 503);
  assert.equal(captureResponse.status, 503);
  assert.equal(webhookResponse.status, 503);
});

test("PayPal live order creation stays closed behind the second release gate", async () => {
  setEnvironment();
  process.env.PAYPAL_ENV = "live";
  process.env.PAYPAL_LIVE_CLIENT_ID = "live-client-id";
  process.env.PAYPAL_LIVE_CLIENT_SECRET = "live-client-secret";
  process.env.PAYPAL_LIVE_WEBHOOK_ID = "live-webhook-id";
  delete process.env.PAYPAL_LIVE_ENABLED;
  try {
    const response = await createOrderRoute(new Request("https://example.test/api/paypal/orders", {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json", "idempotency-key": "paypal-live-gate-123456" },
      body: JSON.stringify({ items: [{ slug: "sgl-three-pair-sock-set", variant: 0, quantity: 1 }], locale: "en" })
    }));
    assert.equal(response.status, 503);
  } finally { clearEnvironment(); }
});

test("PayPal create order uses server amount, sandbox API and a bounded idempotency key", async () => {
  setEnvironment();
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    if (String(input).endsWith("/v1/oauth2/token")) return Response.json({ access_token: "access-token", expires_in: 300 });
    return Response.json(paypalOrder(), { status: 201 });
  };
  try {
    const result = await createPayPalOrder({ orderId: "order_123", amountTotal: 2500, currency: "usd", returnUrl: "https://example.test/return", cancelUrl: "https://example.test/cart", requestId: "sgl-request-1234567890" }, fetcher);
    assert.equal(result.id, "5O190127TN364715T");
    assert.equal(calls[0].url, "https://api-m.sandbox.paypal.com/v1/oauth2/token");
    assert.match(String((calls[0].init?.headers as Record<string, string>).Authorization), /^Basic /);
    const request = calls[1];
    assert.equal(request.url, "https://api-m.sandbox.paypal.com/v2/checkout/orders");
    assert.equal((request.init?.headers as Record<string, string>)["PayPal-Request-Id"], "sgl-request-1234567890");
    const body = JSON.parse(String(request.init?.body));
    assert.equal(body.purchase_units[0].amount.value, "25.00");
    assert.equal(body.purchase_units[0].custom_id, "order_123");
    assert.equal(String(request.init?.body).includes(config.PAYPAL_CLIENT_SECRET), false);
  } finally { clearEnvironment(); }
});

test("approval and capture validation reject live hosts, wrong amounts and wrong SGL orders", () => {
  const sandbox = paypalConfig(config);
  assert.match(approveUrl(paypalOrder(), sandbox), /^https:\/\/www\.sandbox\.paypal\.com\//);
  assert.throws(() => approveUrl({ ...paypalOrder(), links: [{ rel: "approve", href: "https://www.paypal.com/checkoutnow?token=x" }] }, sandbox));
  assert.doesNotThrow(() => assertPayPalOrderMatches(paypalOrder(), { paypalOrderId: "5O190127TN364715T", orderId: "order_123", amountTotal: 2500, currency: "usd" }));
  assert.throws(() => assertPayPalOrderMatches(paypalOrder(), { paypalOrderId: "5O190127TN364715T", orderId: "other", amountTotal: 2500, currency: "usd" }));
  assert.throws(() => assertPayPalOrderMatches(paypalOrder(), { paypalOrderId: "5O190127TN364715T", orderId: "order_123", amountTotal: 1, currency: "usd" }));
});

test("PayPal checkout creates the SGL order locally and gives OPS only the payment association", async () => {
  const route = await readFile(new URL("../app/api/paypal/orders/route.ts", import.meta.url), "utf8");
  assert.match(route, /createPendingOrder\(\{ items, locale, idempotencyKey: requestKey, requireStableSku: true \}\)/);
  assert.match(route, /opsRequest\("\/checkout\/paypal\/orders"/);
  assert.doesNotMatch(route, /opsRequest\("\/checkout\/quotes"/);
  assert.doesNotMatch(route, /customer_email|customer_name|order_addresses/);
});

test("capture validates the server-owned context and only succeeds after OPS persists it", async () => {
  setEnvironment();
  const original = globalThis.fetch;
  const calls: string[] = [];
  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input); calls.push(url);
      if (url.endsWith("/checkout/paypal/capture-context")) return Response.json({ orderId: "order_123", paypalOrderId: "5O190127TN364715T", amountTotal: 2500, currency: "usd" });
      if (url.endsWith("/v1/oauth2/token")) return Response.json({ access_token: "access-token", expires_in: 300 });
      if (url.endsWith("/v2/checkout/orders/5O190127TN364715T") && init?.method === "GET") return Response.json(paypalOrder("APPROVED"));
      if (url.endsWith("/capture")) return Response.json({ ...paypalOrder("COMPLETED"), purchase_units: [{ ...paypalOrder().purchase_units![0], payments: { captures: [{ id: "3Y662965014333303", status: "COMPLETED", amount: { currency_code: "USD", value: "25.00" } }] } }] });
      if (url.endsWith("/payments/paypal/captures")) return Response.json({ persisted: true, orderId: "order_123" });
      throw new Error(`Unexpected request ${url}`);
    };
    const response = await captureRoute(new Request("https://example.test/api/paypal/orders/capture", {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json", "idempotency-key": "paypal-capture-1234567890" },
      body: JSON.stringify({ paypalOrderId: "5O190127TN364715T" })
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { orderId: "order_123", paymentStatus: "paid" });
    assert.equal(calls.filter(url => url.endsWith("/capture")).length, 1);
  } finally { globalThis.fetch = original; clearEnvironment(); }
});

test("webhook requires successful PayPal signature verification and durable OPS acknowledgement", async () => {
  setEnvironment();
  const original = globalThis.fetch;
  const now = new Date().toISOString();
  const headers = {
    "paypal-transmission-time": now,
    "paypal-cert-url": "https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-TEST",
    "paypal-auth-algo": "SHA256withRSA",
    "paypal-transmission-id": "transmission-test",
    "paypal-transmission-sig": "signature-test"
  };
  const event = { id: "WH-12345678", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "3Y662965014333303" } };
  try {
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/v1/oauth2/token")) return Response.json({ access_token: "access-token", expires_in: 300 });
      if (url.endsWith("/verify-webhook-signature")) return Response.json({ verification_status: "SUCCESS" });
      if (url.endsWith("/payments/paypal/events")) return Response.json({ persisted: true, eventId: event.id });
      throw new Error(`Unexpected request ${url}`);
    };
    await assert.doesNotReject(() => verifyPayPalWebhook(new Headers(headers), event));
    __resetPayPalTokenCacheForTests();
    const response = await webhookRoute(new Request("https://example.test/api/paypal/webhook", { method: "POST", headers, body: JSON.stringify(event) }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { received: true });
    __resetPayPalTokenCacheForTests();
    globalThis.fetch = async (input) => String(input).endsWith("/v1/oauth2/token") ? Response.json({ access_token: "access-token", expires_in: 300 }) : Response.json({ verification_status: "FAILURE" });
    assert.equal((await webhookRoute(new Request("https://example.test/api/paypal/webhook", { method: "POST", headers, body: JSON.stringify(event) }))).status, 400);
  } finally { globalThis.fetch = original; clearEnvironment(); }
});

test("webhook rejects event types outside the payment state allowlist", async () => {
  setEnvironment();
  const now = new Date().toISOString();
  try {
    const response = await webhookRoute(new Request("https://example.test/api/paypal/webhook", {
      method: "POST",
      headers: {
        "paypal-transmission-time": now,
        "paypal-cert-url": "https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-TEST",
        "paypal-auth-algo": "SHA256withRSA",
        "paypal-transmission-id": "transmission-test",
        "paypal-transmission-sig": "signature-test"
      },
      body: JSON.stringify({ id: "WH-UNSUPPORTED-1234", event_type: "CUSTOMER.DISPUTE.CREATED", resource: {} })
    }));
    assert.equal(response.status, 400);
  } finally { clearEnvironment(); }
});
