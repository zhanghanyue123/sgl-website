import { test } from "node:test";
import assert from "node:assert/strict";
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
    STORE_CHECKOUT_ENABLED: "true",
    SITE_URL: "https://example.test",
    OPS_STORE_API_URL: "https://ops.example.test/store",
    OPS_STORE_API_TOKEN: "ops-test-token"
  });
  __resetPayPalTokenCacheForTests();
}

function clearEnvironment() {
  for (const key of ["PAYPAL_ENV", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID", "STORE_CHECKOUT_ENABLED", "SITE_URL", "OPS_STORE_API_URL", "OPS_STORE_API_TOKEN"]) delete process.env[key];
  __resetPayPalTokenCacheForTests();
}

const paypalOrder = (status = "CREATED"): PayPalOrder => ({
  id: "5O190127TN364715T",
  status,
  purchase_units: [{ reference_id: "order_123", custom_id: "order_123", amount: { currency_code: "USD", value: "25.00" } }],
  links: [{ rel: "payer-action", method: "GET", href: "https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T" }]
});

test("PayPal configuration is sandbox-only and server credentials are required", () => {
  assert.deepEqual(paypalConfig(config), { baseUrl: "https://api-m.sandbox.paypal.com", clientId: config.PAYPAL_CLIENT_ID, clientSecret: config.PAYPAL_CLIENT_SECRET, webhookId: config.PAYPAL_WEBHOOK_ID });
  assert.throws(() => paypalConfig({ ...config, PAYPAL_ENV: "live" }));
  assert.throws(() => paypalConfig({ ...config, PAYPAL_CLIENT_SECRET: "" }));
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
  assert.match(approveUrl(paypalOrder()), /^https:\/\/www\.sandbox\.paypal\.com\//);
  assert.throws(() => approveUrl({ ...paypalOrder(), links: [{ rel: "approve", href: "https://www.paypal.com/checkoutnow?token=x" }] }));
  assert.doesNotThrow(() => assertPayPalOrderMatches(paypalOrder(), { paypalOrderId: "5O190127TN364715T", orderId: "order_123", amountTotal: 2500, currency: "usd" }));
  assert.throws(() => assertPayPalOrderMatches(paypalOrder(), { paypalOrderId: "5O190127TN364715T", orderId: "other", amountTotal: 2500, currency: "usd" }));
  assert.throws(() => assertPayPalOrderMatches(paypalOrder(), { paypalOrderId: "5O190127TN364715T", orderId: "order_123", amountTotal: 1, currency: "usd" }));
});

test("PayPal checkout route gets an OPS quote, creates an order and requires durable binding", async () => {
  setEnvironment();
  const original = globalThis.fetch;
  const calls: string[] = [];
  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input); calls.push(url);
      if (url.endsWith("/checkout/quotes")) return Response.json({
        orderId: "order_123", expiresAt: Math.floor(Date.now() / 1000) + 3600, currency: "usd", amountTotal: 2500,
        shippingRateId: "shr_test", shippingAmount: 500, allowedCountries: ["US"], lines: [{ priceId: "price_test", quantity: 1, unitAmount: 2000 }]
      });
      if (url.endsWith("/v1/oauth2/token")) return Response.json({ access_token: "access-token", expires_in: 300 });
      if (url.endsWith("/v2/checkout/orders")) return Response.json(paypalOrder(), { status: 201 });
      if (url.endsWith("/checkout/paypal/orders")) {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.amountTotal, 2500);
        assert.equal(body.orderId, "order_123");
        return Response.json({ persisted: true, orderId: "order_123" });
      }
      throw new Error(`Unexpected request ${url}`);
    };
    const response = await createOrderRoute(new Request("https://example.test/api/paypal/orders", {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json", "idempotency-key": "paypal-checkout-123456789" },
      body: JSON.stringify({ items: [{ slug: "sgl-three-pair-sock-set", variant: 0, quantity: 1 }], locale: "en" })
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.provider, "paypal");
    assert.equal(body.environment, "sandbox");
    assert.equal(body.paypalOrderId, "5O190127TN364715T");
    assert.deepEqual(calls.map(url => new URL(url).pathname), ["/store/checkout/quotes", "/v1/oauth2/token", "/v2/checkout/orders", "/store/checkout/paypal/orders"]);
  } finally { globalThis.fetch = original; clearEnvironment(); }
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
