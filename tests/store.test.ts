import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { parseItems, parseQuote, parseRequestKey } from "../lib/store/validation";
import { POST as checkout } from "../app/api/checkout/route";
import { POST as webhook } from "../app/api/stripe/webhook/route";
const valid = { slug: "seat-bag", variant: 0, quantity: 2 };
test("checkout ignores browser supplied amounts", () => {
  assert.deepEqual(parseItems({ items: [{ ...valid, price: 1, currency: "usd" }] }), [valid]);
});
test("invalid carts and duplicate variants are rejected", () => {
  for (const items of [[], [valid, valid], [{ ...valid, quantity: -1 }], [{ ...valid, quantity: 1.5 }], [{ ...valid, quantity: 100 }], [{ ...valid, variant: -1 }], [{ ...valid, slug: "../secret" }]]) assert.throws(() => parseItems({ items }));
});
test("requires bounded idempotency key", () => {
  assert.throws(() => parseRequestKey(null));
  assert.throws(() => parseRequestKey("short"));
  assert.equal(parseRequestKey("request-1234567890"), "request-1234567890");
});
const quote = () => ({ orderId: "order_123", expiresAt: Math.floor(Date.now()/1000) + 3600, currency: "usd", amountTotal: 2500, shippingRateId: "shr_test", shippingAmount: 500, allowedCountries: ["US"], lines: [{ priceId: "price_test", quantity: 2, unitAmount: 1000 }] });
test("OPS totals must reconcile and reservations must be fresh", () => {
  assert.equal(parseQuote(quote()).amountTotal, 2500);
  assert.throws(() => parseQuote({ ...quote(), amountTotal: 1 }));
  assert.throws(() => parseQuote({ ...quote(), expiresAt: 1 }));
  assert.throws(() => parseQuote({ ...quote(), allowedCountries: [] }));
});
test("checkout is closed without enabling configuration", async () => {
  delete process.env.STORE_CHECKOUT_ENABLED;
  const response = await checkout(new Request("https://example.test/api/checkout", { method: "POST" }));
  assert.equal(response.status, 503);
});
test("cross-origin checkout rejected before external calls", async () => {
  process.env.STORE_CHECKOUT_ENABLED = "true";
  process.env.SITE_URL = "https://example.test";
  const response = await checkout(new Request("https://example.test/api/checkout", { method: "POST", headers: { origin: "https://wrong.test" } }));
  assert.equal(response.status, 403);
  delete process.env.STORE_CHECKOUT_ENABLED;
});
test("webhook signature, durable acknowledgement and retries", async () => {
  const secret = "whsec_local_unit_test_only";
  process.env.STRIPE_SECRET_KEY = "sk_test_local_unit_test_only";
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  process.env.OPS_STORE_API_URL = "https://ops.example.test/store";
  process.env.OPS_STORE_API_TOKEN = "unit-test-only";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const event = { id: "evt_unit_test", object: "event", type: "checkout.session.completed", livemode: false, data: { object: { id: "cs_test_local", payment_status: "paid" } } };
  const raw = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload: raw, secret });
  const request = (signature = header, body = raw) => new Request("https://example.test/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signature }, body });
  const original = globalThis.fetch;
  let forwarded = 0;
  try {
    globalThis.fetch = async (_url, options) => { forwarded++; assert.equal((options?.headers as Record<string,string>)["Idempotency-Key"], event.id); return Response.json({ persisted: true, eventId: event.id }); };
    assert.equal((await webhook(request("invalid"))).status, 400);
    assert.equal((await webhook(request(header, raw + " "))).status, 400);
    assert.equal(forwarded, 0);
    assert.equal((await webhook(request())).status, 200);
    assert.equal((await webhook(request())).status, 200);
    assert.equal(forwarded, 2); // Same key: OPS is responsible for transactional deduplication.
    globalThis.fetch = async () => Response.json({ persisted: false });
    assert.equal((await webhook(request())).status, 503);
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal((await webhook(request())).status, 503);
    delete process.env.OPS_STORE_API_URL;
    assert.equal((await webhook(request())).status, 503);
  } finally { globalThis.fetch = original; delete process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_WEBHOOK_SECRET; delete process.env.OPS_STORE_API_TOKEN; }
});
