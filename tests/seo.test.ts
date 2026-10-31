import test from "node:test";
import assert from "node:assert/strict";
import { storefrontProducts, products } from "../data/products";
import { productJsonLd, serializeJsonLd, SITE_URL } from "../lib/seo";
import sitemap from "../app/sitemap";

test("sitemap contains only canonical public pages and visible products", () => {
  const urls = sitemap().map(item => item.url);
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every(url => url.startsWith(SITE_URL + "/")));
  for (const product of storefrontProducts) assert.ok(urls.includes(`${SITE_URL}/shop/${product.slug}`));
  for (const product of products.filter(p => !storefrontProducts.includes(p))) assert.ok(!urls.includes(`${SITE_URL}/shop/${product.slug}`));
  for (const path of ["/cart", "/checkout/success", "/api/checkout"]) assert.ok(!urls.includes(SITE_URL + path));
});

test("product data matches visible USD prices without inventing reviews or inventory", () => {
  for (const product of storefrontProducts) {
    const schema = productJsonLd(product);
    assert.equal(schema.name, product.title);
    assert.equal(schema.offers.price, product.price);
    assert.equal(schema.offers.priceCurrency, "USD");
    assert.ok(schema.image.every(url => url.startsWith(SITE_URL)));
    assert.ok(!/shopify|replace this copy/i.test(schema.description));
    assert.ok(!("aggregateRating" in schema));
    assert.ok(!("availability" in schema.offers));
  }
});

test("JSON-LD safely escapes script-closing content", () => {
  const value = { name: '</script><script>alert("x")</script>' };
  const result = serializeJsonLd(value);
  assert.ok(!result.includes("<"));
  assert.deepEqual(JSON.parse(result), value);
});

test("only the apex host permanently redirects to canonical www", async () => {
  const configPath = "../next.config.mjs";
  const { default: config } = await import(configPath);
  const rules = await config.redirects();
  assert.deepEqual(rules, [{ source: "/:path*", has: [{ type: "host", value: "theseagulllabs.com" }], destination: `${SITE_URL}/:path*`, permanent: true }]);
});
