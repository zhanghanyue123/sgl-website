import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hashOrderRequest, makeOrderNumber } from "../lib/orders/service";

const migration = readFileSync(new URL("../db/migrations/0002_orders.sql", import.meta.url), "utf8");
const successPage = readFileSync(new URL("../app/checkout/success/page.tsx", import.meta.url), "utf8");

test("order request hashing is stable and sensitive to cart changes", () => {
  const cart = [{ slug: "seat-bag", variant: 0, quantity: 1 }];
  assert.equal(hashOrderRequest(cart, "en"), hashOrderRequest(cart, "en"));
  assert.notEqual(hashOrderRequest(cart, "en"), hashOrderRequest([{ ...cart[0], quantity: 2 }], "en"));
  assert.notEqual(hashOrderRequest(cart, "en"), hashOrderRequest(cart, "zh-CN"));
});

test("order numbers contain the UTC date and a stable identifier segment", () => {
  assert.equal(makeOrderNumber(new Date("2026-11-03T01:02:03Z"), "12345678-1234-1234-1234-123456789abc"), "SGL-20261103-12345678");
});

test("order schema keeps order, payment and fulfillment status separate", () => {
  assert.match(migration, /order_status text NOT NULL/);
  assert.match(migration, /payment_status text NOT NULL/);
  assert.match(migration, /fulfillment_status text NOT NULL/);
  assert.match(migration, /idempotency_key text NOT NULL UNIQUE/);
  assert.match(migration, /line_total_cents = unit_price_cents \* quantity/);
});

test("inventory reservation, capture and expiry are atomic and idempotent", () => {
  assert.match(migration, /SELECT \* INTO target FROM orders WHERE id = p_order_id FOR UPDATE/);
  assert.match(migration, /available >= item\.quantity/);
  assert.match(migration, /reserved = reserved \+ item\.quantity/);
  assert.match(migration, /on_hand = on_hand - item\.quantity, reserved = reserved - item\.quantity/);
  assert.match(migration, /payment_status = 'paid' AND target\.payment_reference = p_payment_reference/);
  assert.match(migration, /FOR UPDATE SKIP LOCKED/);
  assert.match(migration, /release_order_reservation\(candidate\.id, 'expired'/);
});

test("checkout return page cannot mark an order paid", () => {
  assert.doesNotMatch(successPage, /capture_order_payment|payment_status\s*=\s*['"]paid/);
  assert.match(successPage, /does not confirm payment|不代表付款|payment/i);
});
