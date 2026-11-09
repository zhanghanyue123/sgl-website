import { test } from "node:test";
import assert from "node:assert/strict";
import {
  categories,
  getProduct,
  getProductsByCategory,
  isProductReadyForStorefront,
  products,
  storefrontProducts
} from "../data/products";
import { splitIntoProductRows } from "../lib/product-layout";

test("storefront hides products without a real image or price", () => {
  assert.ok(storefrontProducts.length < products.length);
  assert.ok(storefrontProducts.every(isProductReadyForStorefront));
  assert.equal(getProduct("tote-bag-1"), undefined);
  assert.equal(getProduct("toiletry-bag"), undefined);
  assert.ok(getProduct("seat-bag"));
});

test("Wear begins with one row of caps followed by one row of tees", () => {
  assert.deepEqual(getProductsByCategory("Wear").slice(0, 8).map(product => product.slug), [
    "seagull-friends-family-cap-white-blue",
    "seagull-cap-khaki-brown",
    "seagull-cap-lavender",
    "seagull-cap-black-grey",
    "wheel-deal-logo-study-tee",
    "wheel-deal-gull-rider-tee",
    "celtic-gull-tee-washed-black",
    "sgl-patch-tee-sky-blue"
  ]);
});

test("home shop keeps all tees together and starts socks on the next row", () => {
  const featured = storefrontProducts.slice(0, 9);
  assert.deepEqual(featured.map(product => product.slug), [
    "seagull-friends-family-cap-white-blue",
    "seagull-cap-khaki-brown",
    "seagull-cap-lavender",
    "seagull-cap-black-grey",
    "wheel-deal-logo-study-tee",
    "wheel-deal-gull-rider-tee",
    "celtic-gull-tee-washed-black",
    "sgl-patch-tee-sky-blue",
    "sgl-three-pair-sock-set"
  ]);
  assert.deepEqual(splitIntoProductRows(featured).map(row => row.map(product => product.slug)), [
    featured.slice(0, 4).map(product => product.slug),
    featured.slice(4, 8).map(product => product.slug),
    ["sgl-three-pair-sock-set"]
  ]);
  assert.equal(getProductsByCategory("Wear")[8]?.slug, "sgl-three-pair-sock-set");
});

test("four tee products use the approved images, descriptions and USD 59 price", () => {
  const expected = [
    ["wheel-deal-logo-study-tee", "/products/tees/wheel-deal-logo-study-cream-red.webp"],
    ["wheel-deal-gull-rider-tee", "/products/tees/wheel-deal-gull-rider-sand.webp"],
    ["celtic-gull-tee-washed-black", "/products/tees/celtic-gull-washed-black.webp"],
    ["sgl-patch-tee-sky-blue", "/products/tees/sgl-patch-sky-blue.webp"]
  ] as const;
  for (const [slug, image] of expected) {
    const tee = getProduct(slug)!;
    assert.equal(tee.category, "Wear");
    assert.equal(tee.price, 59);
    assert.equal(tee.priceLabel, "59");
    assert.equal(tee.images[0], image);
    assert.ok(tee.description.length > 40);
  }
});

test("shop category sections follow the approved order", () => {
  assert.deepEqual(categories, [
    "Bikes",
    "Bags & Carry",
    "Wear",
    "Station Goods",
    "Accessories"
  ]);
});

test("black handlebar bag sits between the white-grey and grey colourways", () => {
  assert.deepEqual(getProductsByCategory("Bags & Carry").slice(0, 3).map(product => product.slug), [
    "handlebar-bag-white-grey",
    "handlebar-bags",
    "handleber-bags-grey"
  ]);
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
  assert.equal(getProduct("seagull-cap-khaki-brown")?.images[0], "/products/caps/khaki-brown-studio.webp");
  const navyGrey = getProduct("seagull-cap-lavender")!;
  assert.equal(navyGrey.images[0], "/products/caps/navy-grey-friends-family-studio.webp");
  assert.equal(navyGrey.images.length, 1);
  assert.equal(navyGrey.title, "SGL Friends & Family Cap — Navy / Grey");
  assert.match(navyGrey.description, /washed navy and charcoal-grey/i);
  assert.equal(getProduct("seagull-cap-black-grey")?.images[0], "/products/caps/black-grey-studio.webp");

  assert.equal(getProduct("seagull-cap-khaki-brown")?.soldOut, true);
  assert.equal(navyGrey.soldOut, undefined);
  assert.equal(getProduct("reflective-gear-safety-reflector-baby-seagull")?.soldOut, true);

  assert.equal(getProduct("sgl-three-pair-sock-set")?.images[0], "/products/socks/sgl-three-pair-sock-set-studio.webp");
  assert.equal(getProduct("seat-bag")?.images[0], "/products/seat-bag-studio.webp");
});

test("white and grey handlebar bag has its own storefront link", () => {
  const bag = getProduct("handlebar-bag-white-grey")!;
  assert.equal(bag.title, "SGL Handlebar Bag — White / Grey");
  assert.equal(bag.price, 50);
  assert.equal(bag.images[0], "/products/handlebar-bag-white-grey.webp");
  assert.equal(bag.images[1], "/products/handlebar-bag-white-grey-detail.webp");
});

test("new handlebar bag colourways have independent links and approved imagery", () => {
  const expected = [
    ["handlebar-bag-black-white", 55, "/products/handlebar-bag-black-white-studio.webp"],
    ["handlebar-bag-brown-purple", 50, "/products/handlebar-bag-brown-purple-studio.webp"],
    ["handlebar-bag-red-grey", 50, "/products/handlebar-bag-red-grey-studio.webp"]
  ] as const;
  for (const [slug, price, image] of expected) {
    const bag = getProduct(slug)!;
    assert.equal(bag.price, price);
    assert.equal(bag.images[0], image);
  }
  assert.equal(getProduct("handlebar-bags")?.images[0], "/products/handlebar-bag-black-studio.webp");
  assert.equal(getProduct("handlebar-bags-reflect-grey")?.images[0], "/products/handlebar-bag-grey-orange-studio.webp");
  assert.equal(getProduct("handleber-bags-grey")?.images[0], "/products/handlebar-bag-grey-studio.webp");
  assert.equal(getProduct("handlebar-bags-purple")?.images[0], "/products/handlebar-bag-purple-studio.webp");
  assert.equal(getProduct("handleber-bags-red")?.images[0], "/products/handlebar-bag-red-studio.webp");
});

test("newly supplied catalogue images are used as product primary images", () => {
  assert.equal(getProduct("sports-bandana-outdoor-magic-scarf")?.images[0], "/products/sports-bandana-studio.webp");
  assert.equal(getProduct("cycling-leg-strap-pant-strap")?.images[0], "/products/cycling-trouser-strap-white-studio.webp");
  assert.equal(getProduct("handlebar-bag-brown-purple")?.images[0], "/products/handlebar-bag-brown-purple-studio.webp");
  assert.equal(getProduct("handlebar-bag-red-grey")?.images[0], "/products/handlebar-bag-red-grey-studio.webp");
  const toiletryBag = products.find(product => product.slug === "toiletry-bag")!;
  assert.equal(toiletryBag.images[0], "/products/toiletry-bag-orange-studio.webp");
  assert.equal(getProduct("toiletry-bag"), undefined);
});

test("bike cover uses the approved studio primary image and new detail gallery", () => {
  const bikeCover = getProduct("bike-cover")!;
  assert.deepEqual(bikeCover.images.slice(0, 4), [
    "/products/bike-cover-studio.webp",
    "/products/bike-cover-detail-logo.webp",
    "/products/bike-cover-detail-white.webp",
    "/products/bike-cover-detail-zip.webp"
  ]);
});

test("new accessory and shoe bag studio images are used as primary images", () => {
  const expected = [
    ["reveal-shoe-sack", "/products/sgl-shoe-bag-studio.webp"],
    ["reflective-gear-safety-reflector-baby-seagull", "/products/baby-seagull-reflector-studio.webp"],
    ["pin", "/products/three-seagulls-pin-studio.webp"],
    ["cover", "/products/sgl-bicycle-reflector-studio.webp"]
  ] as const;

  for (const [slug, image] of expected) {
    const product = getProduct(slug)!;
    assert.equal(product.images[0], image);
    assert.equal(product.variants[0]?.image, image);
  }
});
