import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import { products } from "../data/products";
import { locales } from "../lib/i18n";
import { hasPermission } from "../lib/admin/permissions";
import { hashPassword, safeOrigin, verifyPassword } from "../lib/admin/security";
import { parseAdminProduct, parseInventoryAdjustment, parseShipment, parseShipmentStatus } from "../lib/admin/validation";

const categoryId = "11111111-1111-4111-8111-111111111111";
const validProduct = () => ({
  slug: "test-product", originalHandle: "test-product", categoryId, status: "draft", basePriceCents: 2500, currency: "USD",
  localizations: locales.map((locale) => ({ locale, title: `${locale} title`, description: `${locale} description` })),
  images: [{ url: "/images/test.webp", altText: "Test" }], variants: [{ sku: "SGL-TEST", title: "Default", options: [], priceCents: 2500, currency: "USD", active: true }]
});

test("RBAC keeps read-only, catalogue and inventory roles separated", () => {
  assert.equal(hasPermission("viewer", "products:read"), true);
  assert.equal(hasPermission("viewer", "products:write"), false);
  assert.equal(hasPermission("editor", "products:publish"), true);
  assert.equal(hasPermission("inventory", "inventory:adjust"), true);
  assert.equal(hasPermission("inventory", "products:write"), false);
  assert.equal(hasPermission("owner", "users:manage"), true);
});

test("admin passwords use a salted verifier", async () => {
  const credentials = await hashPassword("StrongAdminPassword123");
  assert.equal(await verifyPassword("StrongAdminPassword123", credentials.salt, credentials.hash), true);
  assert.equal(await verifyPassword("WrongAdminPassword123", credentials.salt, credentials.hash), false);
  await assert.rejects(() => hashPassword("too-short"));
});

test("mutating requests require the configured same origin", () => {
  process.env.SITE_URL = "https://store.example";
  assert.equal(safeOrigin(new Request("https://store.example/api/admin", { headers: { origin: "https://store.example" } })), true);
  assert.equal(safeOrigin(new Request("https://store.example/api/admin", { headers: { origin: "https://evil.example" } })), false);
  delete process.env.SITE_URL;
});

test("product validation requires complete locales and keeps update slugs immutable", () => {
  const parsed = parseAdminProduct(validProduct(), true);
  assert.equal(parsed.localizations.length, 5);
  assert.equal(parsed.slug, "test-product");
  const update = parseAdminProduct({ ...validProduct(), slug: "attempted-change" }, false);
  assert.equal(update.slug, undefined);
  assert.throws(() => parseAdminProduct({ ...validProduct(), localizations: validProduct().localizations.slice(0, 4) }, true));
  assert.throws(() => parseAdminProduct({ ...validProduct(), variants: [{ ...validProduct().variants[0], priceCents: -1 }] }, true));
  assert.throws(() => parseAdminProduct({ ...validProduct(), variants: [validProduct().variants[0], validProduct().variants[0]] }, true));
});

test("inventory adjustments reject zero, fractions and malformed IDs", () => {
  assert.deepEqual(parseInventoryAdjustment({ variantId: categoryId, deltaOnHand: -2, reason: "Cycle count" }), { variantId: categoryId, deltaOnHand: -2, reason: "Cycle count" });
  assert.throws(() => parseInventoryAdjustment({ variantId: categoryId, deltaOnHand: 0, reason: "No-op" }));
  assert.throws(() => parseInventoryAdjustment({ variantId: categoryId, deltaOnHand: 1.5, reason: "Fraction" }));
  assert.throws(() => parseInventoryAdjustment({ variantId: "bad", deltaOnHand: 1, reason: "Bad id" }));
});

test("database contract prevents overselling and records every movement", async () => {
  const sql = await readFile(new URL("../db/migrations/0001_admin_catalog.sql", import.meta.url), "utf8");
  assert.match(sql, /CHECK \(on_hand >= reserved\)/);
  assert.match(sql, /on_hand \+ p_delta_on_hand >= reserved \+ p_delta_reserved/);
  assert.match(sql, /INSERT INTO inventory_movements/);
  assert.match(sql, /CREATE TABLE audit_logs/);
});

test("catalogue import preserves identifiers and never fabricates blank SKUs", () => {
  assert.equal(products.length, 44);
  assert.equal(new Set(products.map((product) => product.slug)).size, products.length);
  const missing = products.reduce((count, product) => count + (product.variants.length ? product.variants.filter((variant) => !variant.sku?.trim()).length : 1), 0);
  assert.ok(missing > 0);
});

test("manual shipment actions require address confirmation and safe tracking data", () => {
  const shipment = parseShipment({ orderId: categoryId, carrier: "SF Express", trackingNumber: "SF123456", trackingUrl: "https://example.test/track/SF123456", addressConfirmed: true });
  assert.equal(shipment.carrier, "SF Express");
  assert.throws(() => parseShipment({ ...shipment, addressConfirmed: false }));
  assert.throws(() => parseShipment({ ...shipment, trackingUrl: "http://example.test/track" }));
  assert.deepEqual(parseShipmentStatus({ shipmentId: categoryId, status: "delivered" }), { shipmentId: categoryId, status: "delivered" });
  assert.throws(() => parseShipmentStatus({ shipmentId: categoryId, status: "paid" }));
});

test("fulfillment schema keeps shipment history and notification delivery evidence", async () => {
  const sql = await readFile(new URL("../db/migrations/0003_fulfillment.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE fulfillment_shipments/);
  assert.match(sql, /CREATE TABLE fulfillment_events/);
  assert.match(sql, /CREATE TABLE notification_outbox/);
  assert.match(sql, /status IN \('pending', 'accepted', 'delivered', 'failed', 'cancelled'\)/);
  assert.match(sql, /address_confirmed_at timestamptz NOT NULL/);
});
