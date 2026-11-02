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

test("cap prices and newly supplied primary images match the approved catalogue", () => {
  for (const slug of ["seagull-cap-khaki-brown", "seagull-cap-lavender", "seagull-cap-black-grey"]) {
    const cap = getProduct(slug)!;
    assert.equal(cap.price, 45);
    assert.equal(cap.priceLabel, "45");
  }
  const friendsFamily = getProduct("seagull-friends-family-cap-white-blue")!;
  assert.equal(friendsFamily.price, 50);
  assert.equal(friendsFamily.priceLabel, "50");
  assert.equal(friendsFamily.images[0], "/products/caps/friends-family-white-blue.webp");

  assert.equal(getProduct("sgl-three-pair-sock-set")?.images[0], "/products/socks/sgl-three-pair-sock-set-studio.webp");
  assert.equal(getProduct("seat-bag")?.images[0], "/products/seat-bag-studio.webp");
});
