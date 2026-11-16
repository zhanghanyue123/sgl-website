import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { storefrontProducts } from "../data/products";
import { addCartLine, applyCartAdd, cartItemCount, normalizeSavedCart, persistCart, type CartLine } from "../lib/cart";

const singleVariantProduct = storefrontProducts.find(product => !product.soldOut && product.variants.filter(variant => !variant.soldOut).length <= 1)!;
const multiVariantProduct = storefrontProducts.find(product => !product.soldOut && product.variants.filter(variant => !variant.soldOut).length > 1)!;
const availableVariantIndexes = multiVariantProduct.variants.flatMap((variant, index) => variant.soldOut ? [] : [index]);

test("one cart operation is applied once while a new customer action may increase quantity", () => {
  const command = { slug: singleVariantProduct.slug, variant: 0, quantity: 1, operationId: "cart-op-0001" };
  const first = applyCartAdd([], command, new Set());
  assert.equal(first.status, "added");
  assert.equal(cartItemCount(first.lines), 1);

  const duplicate = applyCartAdd(first.lines, command, first.appliedOperations);
  assert.equal(duplicate.status, "duplicate");
  assert.deepEqual(duplicate.lines, first.lines);
  assert.equal(cartItemCount(duplicate.lines), 1);

  const intentionalSecondAdd = applyCartAdd(duplicate.lines, { ...command, operationId: "cart-op-0002" }, duplicate.appliedOperations);
  assert.equal(intentionalSecondAdd.status, "added");
  assert.equal(cartItemCount(intentionalSecondAdd.lines), 2);
});

test("different variants stay independent and saved cart state survives normalization", () => {
  assert.ok(availableVariantIndexes.length > 1);
  const first: CartLine = { slug: multiVariantProduct.slug, variant: availableVariantIndexes[0], quantity: 2 };
  const second: CartLine = { slug: multiVariantProduct.slug, variant: availableVariantIndexes[1], quantity: 1 };
  const lines = addCartLine(addCartLine([], first), second);
  assert.equal(lines.length, 2);
  assert.equal(cartItemCount(lines), 3);
  assert.deepEqual(normalizeSavedCart(JSON.parse(JSON.stringify(lines))), lines);
});

test("Owner-confirmed sold-out products cannot enter or survive the cart", () => {
  const soldOutSlugs = [
    "seagull-cap-khaki-brown", "seagull-cap-lavender", "seagull-cap-black-grey", "seagull-friends-family-cap-white-blue",
    "wheel-deal-logo-study-tee", "wheel-deal-gull-rider-tee", "celtic-gull-tee-washed-black", "sgl-patch-tee-sky-blue",
    "chrissy", "chrissy-team", "chrissy-special", "reveal-shoe-sack"
  ];
  for (const slug of soldOutSlugs) {
    assert.deepEqual(normalizeSavedCart([{ slug, variant: 0, quantity: 1 }]), []);
    assert.throws(() => addCartLine([], { slug, variant: 0, quantity: 1 }), /invalid/);
  }
});

test("Chrissy Ti exposes only the unified active Production variant", () => {
  const ti = storefrontProducts.find(product => product.slug === "chrissy1")!;
  assert.equal(ti.variants.length, 1);
  assert.equal(ti.variants[0]?.sku, "SGL-BIK-CTI-V00");
  assert.doesNotThrow(() => addCartLine([], { slug: ti.slug, variant: 0, quantity: 1 }));
  assert.throws(() => addCartLine([], { slug: ti.slug, variant: 1, quantity: 1 }), /invalid/);
  assert.deepEqual(normalizeSavedCart([{ slug: ti.slug, variant: 6, quantity: 1 }]), []);
});

test("cart UI exposes loading, success, error, badge and same-line duplicate guards", () => {
  const hook = readFileSync(new URL("../components/useCartAdd.ts", import.meta.url), "utf8");
  const provider = readFileSync(new URL("../components/CartProvider.tsx", import.meta.url), "utf8");
  const purchase = readFileSync(new URL("../components/ProductPurchase.tsx", import.meta.url), "utf8");
  const card = readFileSync(new URL("../components/ProductCard.tsx", import.meta.url), "utf8");
  const header = readFileSync(new URL("../components/Header.tsx", import.meta.url), "utf8");
  const toast = readFileSync(new URL("../components/CartAddToast.tsx", import.meta.url), "utf8");
  const productPage = readFileSync(new URL("../app/shop/[slug]/page.tsx", import.meta.url), "utf8");
  const localizedPages = readFileSync(new URL("../app/[locale]/[[...segments]]/page.tsx", import.meta.url), "utf8");
  assert.match(hook, /pending\.current/);
  assert.match(hook, /crypto\.randomUUID/);
  assert.match(hook, /requestAnimationFrame/);
  assert.match(hook, /MINIMUM_LOADING_MS = 250/);
  assert.match(provider, /pendingLines\.current\.has/);
  assert.match(provider, /persistCart\(localStorage, next\)/);
  assert.match(purchase, /aria-busy/);
  assert.match(purchase, /role="alert"/);
  assert.match(card, /Quick add/);
  assert.match(card, /Choose options/);
  assert.match(card, /bg-white px-4 py-3 text-sm font-black uppercase/);
  assert.match(card, /group flex h-full flex-col/);
  assert.match(card, /href=\{productPath\} className="flex flex-1 flex-col"/);
  assert.match(card, /className="mt-auto px-5 pb-5 pt-10"/);
  assert.match(header, /cartItemCount/);
  assert.match(header, /99\+/);
  assert.match(toast, /createPortal/);
  assert.match(toast, /fixed bottom-5/);
  assert.match(toast, /document\.body/);
  assert.match(toast, /bg-white/);
  assert.doesNotMatch(toast, /sglAcid|d6ff00/);
  assert.match(productPage, /<ProductPurchase product=\{product\}/);
  assert.match(localizedPages, /<ProductPurchase product=\{product\}/);
});

test("checkout exposes configured providers and simplifies the PayPal-only action", () => {
  const wrapper = readFileSync(new URL("../app/cart/page.tsx", import.meta.url), "utf8");
  const cart = readFileSync(new URL("../components/CartPageClient.tsx", import.meta.url), "utf8");
  const checkout = readFileSync(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8");
  assert.match(wrapper, /AIRWALLEX_ENABLED/);
  assert.match(wrapper, /PAYPAL_ENABLED/);
  assert.match(wrapper, /PAYPAL_LIVE_ENABLED/);
  assert.match(wrapper, /PAYPAL_CLIENT_SECRET/);
  assert.match(wrapper, /PAYPAL_LIVE_CLIENT_SECRET/);
  assert.match(cart, /Airwallex Sandbox/);
  assert.match(cart, /PayPal Sandbox/);
  assert.match(cart, /paypalEnvironment === "live" \? "PayPal"/);
  assert.match(cart, /airwallexEnabled && paypalEnabled && <fieldset/);
  assert.match(cart, /busy \? c\.preparing : c\.checkout/);
  assert.match(cart, /sm:w-\[20rem\]/);
  assert.doesNotMatch(cart, /Contact SGL to confirm an order/);
  assert.doesNotMatch(cart, /c\.contact/);
  assert.doesNotMatch(cart, /Checkout with PayPal/);
  assert.doesNotMatch(cart, /value="stripe"/);
  assert.match(checkout, /AIRWALLEX_ENABLED/);
  assert.match(checkout, /requireStableSku: true/);
  assert.doesNotMatch(checkout, /getStripe|stripe\.checkout/);
});

test("cart persistence surfaces storage failures and permits a later retry", () => {
  const lines: CartLine[] = [{ slug: singleVariantProduct.slug, variant: 0, quantity: 1 }];
  assert.throws(() => persistCart({ setItem() { throw new Error("quota"); } }, lines), /quota/);
  let saved = "";
  assert.doesNotThrow(() => persistCart({ setItem(_key, value) { saved = value; } }, lines));
  assert.deepEqual(normalizeSavedCart(JSON.parse(saved)), lines);
});
