import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getProduct,
  isProductReadyForStorefront,
  products,
  storefrontProducts
} from "../data/products";

test("storefront hides products without a real image or price", () => {
  assert.ok(storefrontProducts.length < products.length);
  assert.ok(storefrontProducts.every(isProductReadyForStorefront));
  assert.equal(getProduct("tote-bag-1"), undefined);
  assert.equal(getProduct("toiletry-bag"), undefined);
  assert.ok(getProduct("seat-bag"));
});

test("placeholder-only and missing-photo products stay hidden even with a price", () => {
  const base = products.find(product => product.slug === "seat-bag")!;
  assert.equal(isProductReadyForStorefront({ ...base, images: [] }), false);
  assert.equal(isProductReadyForStorefront({ ...base, images: ["/products/placeholder-bag.svg"] }), false);
  assert.equal(isProductReadyForStorefront({ ...base, price: 0 }), false);
  assert.equal(getProduct("socks"), undefined);
  assert.equal(getProduct("airtag-case"), undefined);
});
