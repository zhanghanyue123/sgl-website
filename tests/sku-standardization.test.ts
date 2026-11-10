import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { products } from "../data/products";
import {
  approvedSkuFor,
  approvedSkuRows,
  assertApprovedSkuManifest,
  stableCatalogueUuid,
} from "../lib/admin/sku-standardization";

test("approved SKU manifest covers all 44 products and 79 variants with stable identities", () => {
  assert.doesNotThrow(assertApprovedSkuManifest);
  assert.equal(new Set(approvedSkuRows.map((row) => row.productSlug)).size, 44);
  assert.equal(approvedSkuRows.length, 79);
  for (const product of products) {
    const count = Math.max(product.variants.length, 1);
    for (let position = 0; position < count; position++) {
      const row = approvedSkuFor(product.slug, position);
      assert.ok(row, `${product.slug}:${position}`);
      assert.equal(row.productId, stableCatalogueUuid(`product:${product.slug}`));
      assert.equal(row.variantId, stableCatalogueUuid(`product:${product.slug}:variant:${position}`));
    }
  }
});

test("catalogue initializer is owner gated and never creates inventory or movements", async () => {
  const [route, initializer] = await Promise.all([
    readFile(new URL("../app/api/admin/catalogue/sku-initialization/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/admin/catalogue-initialization.ts", import.meta.url), "utf8"),
  ]);
  assert.match(route, /session\.role !== "owner"/);
  assert.match(route, /SKU_INITIALIZATION_MANIFEST_SHA256/);
  assert.match(route, /SKU_INITIALIZATION_CONFIRMATION/);
  assert.doesNotMatch(initializer, /INSERT INTO inventory_levels/i);
  assert.doesNotMatch(initializer, /INSERT INTO inventory_movements/i);
  assert.match(initializer, /counts\.inventory !== 0 \|\| counts\.movements !== 0/);
});
