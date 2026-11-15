import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production OPS migration is isolated and least privilege", async () => {
  const sql = await readFile(new URL("../services/paypal-production-ops/migrations/0001_paypal_production_ops.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE SCHEMA IF NOT EXISTS paypal_ops/);
  assert.match(sql, /SECURITY DEFINER/g);
  assert.match(sql, /REVOKE ALL ON SCHEMA paypal_ops FROM PUBLIC/);
  assert.doesNotMatch(sql, /customer_email|customer_name|order_addresses/);
  assert.doesNotMatch(sql, /INSERT INTO public\.refunds|UPDATE public\.refunds|inventory_adjustment/);
  assert.ok(sql.includes("paypal_order_id text NOT NULL UNIQUE"));
  assert.match(sql, /event_id text PRIMARY KEY/);
  assert.match(sql, /payment amount or currency mismatch/);
});

test("production OPS routes require bearer identity and durable idempotency", async () => {
  const helper = await readFile(new URL("../lib/payments/paypal/ops.ts", import.meta.url), "utf8");
  const create = await readFile(new URL("../app/api/internal/paypal-ops/checkout/paypal/orders/route.ts", import.meta.url), "utf8");
  const capture = await readFile(new URL("../app/api/internal/paypal-ops/payments/paypal/captures/route.ts", import.meta.url), "utf8");
  const events = await readFile(new URL("../app/api/internal/paypal-ops/payments/paypal/events/route.ts", import.meta.url), "utf8");
  assert.match(helper, /PAYPAL_OPS_TOKEN/);
  assert.match(helper, /timingSafeEqual/);
  assert.match(helper, /PAYPAL_OPS_DATABASE_URL/);
  assert.match(helper, /sslmode.*verify-full/);
  assert.match(create, /opsIdempotencyKey/);
  assert.match(capture, /opsIdempotencyKey/);
  assert.match(events, /key !== eventId/);
  assert.match(events, /Unsupported PayPal event/);
});
