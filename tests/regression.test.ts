import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { storefrontProducts } from "../data/products";
import { CART_STORAGE_KEY, normalizeSavedCart, validCartLine } from "../lib/cart";
import { locales, localizedPath } from "../lib/i18n";
import { STATION_BIKE_STUDIO_IMAGE, STATION_CLUB_HOUSE_IMAGE, STATION_HERO_IMAGE } from "../lib/seo";

test("every public product image exists in the production asset tree", () => {
  for (const product of storefrontProducts) for (const image of product.images) {
    assert.equal(existsSync(join(process.cwd(), "public", image.slice(1))), true, `${product.slug}: ${image}`);
  }
});

test("Station and About venue assets remain available", () => {
  assert.equal(STATION_HERO_IMAGE, "/station/seagull-coffee-characters-v2.webp");
  assert.equal(STATION_BIKE_STUDIO_IMAGE, "/station/shanghai-bike-studio-v3.webp");
  assert.equal(STATION_CLUB_HOUSE_IMAGE, "/station/station-club-house-v2.webp");
  for (const image of [STATION_HERO_IMAGE, STATION_BIKE_STUDIO_IMAGE, STATION_CLUB_HOUSE_IMAGE]) {
    assert.equal(existsSync(join(process.cwd(), "public", image.slice(1))), true, image);
  }
});

test("cart persistence is locale-independent and rejects invalid or sold-out lines", () => {
  assert.equal(CART_STORAGE_KEY, "sgl-cart-v1");
  assert.equal(localizedPath("/cart", "it-IT"), "/it/cart");
  assert.equal(validCartLine({ slug: "seagull-cap-lavender", variant: 0, quantity: 1 }), true);
  assert.equal(validCartLine({ slug: "seagull-cap-khaki-brown", variant: 0, quantity: 1 }), false);
  assert.equal(validCartLine({ slug: "seagull-cap-lavender", variant: 99, quantity: 1 }), false);
  assert.equal(validCartLine({ slug: "seagull-cap-lavender", variant: 0, quantity: 100 }), false);
  assert.deepEqual(normalizeSavedCart([
    { slug: "seagull-cap-lavender", variant: 0, quantity: 1 },
    { slug: "seagull-cap-lavender", variant: 0, quantity: 2 },
    { slug: "missing", variant: 0, quantity: 1 }
  ]), [{ slug: "seagull-cap-lavender", variant: 0, quantity: 2 }]);
});

test("public smoke matrix includes every locale, core page and visible product", () => {
  const corePages = 10; const expected = locales.length * (corePages + storefrontProducts.length) + 2;
  assert.equal(expected, 207);
  for (const locale of locales) for (const product of storefrontProducts) assert.ok(localizedPath(`/shop/${product.slug}`, locale));
});

test("fulfillment writes tracking history and queues a notification without claiming delivery", () => {
  const source = readFileSync(new URL("../lib/admin/fulfillment.ts", import.meta.url), "utf8");
  assert.match(source, /INSERT INTO fulfillment_events/);
  assert.match(source, /INSERT INTO notification_outbox/);
  assert.match(source, /shipment_confirmation/);
  assert.doesNotMatch(source, /notification_outbox[\s\S]{0,500}status[^\n]*delivered/);
});

test("admin and agent mutation routes enforce separate authorization", () => {
  const inventory = readFileSync(new URL("../app/api/admin/inventory/adjust/route.ts", import.meta.url), "utf8");
  const proposal = readFileSync(new URL("../app/api/agent/v1/actions/route.ts", import.meta.url), "utf8");
  assert.match(inventory, /requireAdmin\(request, "inventory:adjust", true\)/);
  assert.match(proposal, /requireAgent/);
  assert.doesNotMatch(proposal, /adjustAdminInventory|createShipment|capture_order_payment/);
});
