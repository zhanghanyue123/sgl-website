import test from "node:test";
import assert from "node:assert/strict";
import { storefrontProducts, products } from "../data/products";
import { organizationJsonLd, productBreadcrumbJsonLd, productJsonLd, serializeJsonLd, SITE_URL, websiteJsonLd } from "../lib/seo";
import sitemap from "../app/sitemap";
import robots from "../app/robots";

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
    if (product.soldOut) assert.equal(schema.offers.availability, "https://schema.org/OutOfStock");
    else assert.ok(!("availability" in schema.offers));
  }
});

test("JSON-LD safely escapes script-closing content", () => {
  const value = { name: '</script><script>alert("x")</script>' };
  const result = serializeJsonLd(value);
  assert.ok(!result.includes("<"));
  assert.deepEqual(JSON.parse(result), value);
});

test("organization and website schemas use only verified first-party facts", () => {
  const organization = organizationJsonLd();
  const website = websiteJsonLd();
  assert.equal(organization.url, SITE_URL);
  assert.equal(organization.foundingDate, "2023-06-09");
  assert.ok(!("telephone" in organization));
  assert.ok(!("sameAs" in organization));
  assert.deepEqual(website.inLanguage, ["en", "zh-CN", "ja-JP", "ko-KR", "it-IT"]);
});

test("product breadcrumbs preserve localized canonical paths", () => {
  const product = storefrontProducts[0];
  const schema = productBreadcrumbJsonLd(product, `/it/shop/${product.slug}`, "/it/shop", "Negozio");
  assert.equal(schema.itemListElement[1].item, `${SITE_URL}/it/shop`);
  assert.equal(schema.itemListElement[1].name, "Negozio");
  assert.equal(schema.itemListElement[2].item, `${SITE_URL}/it/shop/${product.slug}`);
});

test("robots keeps operational routes out of crawl queues", () => {
  const config = robots(); const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
  assert.deepEqual(rules?.disallow, ["/api/", "/admin/", "/checkout/"]);
  assert.equal(config.host, SITE_URL);
});

test("only the apex host permanently redirects to canonical www", async () => {
  const configPath = "../next.config.mjs";
  const { default: config } = await import(configPath);
  const rules = await config.redirects();
  assert.deepEqual(rules, [{ source: "/:path*", has: [{ type: "host", value: "theseagulllabs.com" }], destination: `${SITE_URL}/:path*`, permanent: true }]);
});
