import { test } from "node:test";
import assert from "node:assert/strict";
import type { Product } from "../data/products";
import { inventorySummary, mergeWebsiteCatalogueWithInventory, type DatabaseInventoryRow } from "../lib/admin/inventory-projection";

const product: Product = {
  slug: "test-bag", originalHandle: "test-bag", title: "Test Bag", category: "Bags & Carry", price: 20, priceLabel: "20",
  images: ["/products/test.webp"], description: "Test", details: [], buyLinks: {},
  variants: [
    { sku: "SGL-BAG-BLK", options: [{ name: "Colour", value: "Black" }], price: 22 },
    { options: [{ name: "Colour", value: "White" }], price: 20 },
  ],
};

function databaseRow(overrides: Partial<DatabaseInventoryRow> = {}): DatabaseInventoryRow {
  return {
    variant_id: "11111111-1111-4111-8111-111111111111", product_id: "22222222-2222-4222-8222-222222222222",
    slug: "test-bag", product_title: "Test Bag", variant_legacy_key: "0", variant_title: "Colour: Black",
    sku: "SGL-BAG-BLK", active: true, image_url: null, price_cents: 2200, currency: "USD",
    warehouse_id: "33333333-3333-4333-8333-333333333333", warehouse_name: "Online Fulfillment",
    on_hand: 0, reserved: 0, available: 0, low_stock_threshold: 3, updated_at: "2026-11-10T00:00:00.000Z", ...overrides,
  };
}

test("catalogue rows remain visible when no inventory records exist", () => {
  const rows = mergeWebsiteCatalogueWithInventory([product], []);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.inventory_status === "not_recorded"));
  assert.ok(rows.every((row) => row.on_hand === null));
});

test("recorded zero remains distinct from missing inventory", () => {
  const rows = mergeWebsiteCatalogueWithInventory([product], [databaseRow()]);
  const recorded = rows.find((row) => row.sku === "SGL-BAG-BLK");
  const missing = rows.find((row) => row.sku === null);
  assert.equal(recorded?.inventory_status, "recorded");
  assert.equal(recorded?.on_hand, 0);
  assert.equal(missing?.inventory_status, "not_recorded");
  assert.equal(missing?.on_hand, null);
  assert.deepEqual(inventorySummary(rows, 0), {
    catalogue_products: 1, catalogue_rows: 2, sku_count: 1, inventory_records: 1, recorded_zero: 1,
    without_inventory: 1, total_on_hand: 0, total_reserved: 0, total_available: 0, movement_records: 0,
    updated_at: "2026-11-10T00:00:00.000Z",
  });
});

test("inventory mappings prefer an explicit SKU and retain warehouse identity", () => {
  const rows = mergeWebsiteCatalogueWithInventory([product], [databaseRow({ on_hand: 8, available: 6, reserved: 2 })]);
  const recorded = rows.find((row) => row.inventory_status === "recorded");
  assert.equal(recorded?.warehouse_name, "Online Fulfillment");
  assert.equal(recorded?.on_hand, 8);
  assert.equal(recorded?.reserved, 2);
  assert.equal(recorded?.available, 6);
});
