import test from "node:test";
import assert from "node:assert/strict";
import sitemap from "../app/sitemap";
import { SITE_URL } from "../lib/seo";
import {
  browserLocale,
  languageAlternates,
  locales,
  localizedPath,
  localeFromPath,
  regionLocale,
  stripLocale
} from "../lib/i18n";
import { storefrontProducts } from "../data/products";
import { generateMetadata } from "../app/[locale]/[[...segments]]/page";

test("Italian is the fifth locale and uses the canonical /it prefix", () => {
  assert.deepEqual(locales, ["en", "zh-CN", "ja-JP", "ko-KR", "it-IT"]);
  assert.equal(localizedPath("/about", "it-IT"), "/it/about");
  assert.equal(localizedPath("/it/shop/seat-bag", "ja-JP"), "/ja-JP/shop/seat-bag");
  assert.equal(localeFromPath("/it/universe"), "it-IT");
  assert.equal(stripLocale("/it/shop/seat-bag"), "/shop/seat-bag");
});

test("Italian regional and browser fallbacks resolve without affecting other regions", () => {
  assert.equal(regionLocale("IT"), "it-IT");
  assert.equal(regionLocale("US"), "en");
  assert.equal(browserLocale("it-IT,it;q=0.9,en;q=0.8"), "it-IT");
  assert.equal(browserLocale("fr-FR,fr;q=0.9"), "en");
});

test("every language alternate is reciprocal and keeps English as x-default", () => {
  const alternates = languageAlternates("/shop/seat-bag");
  assert.deepEqual(alternates, {
    en: "/shop/seat-bag",
    "zh-CN": "/zh-CN/shop/seat-bag",
    "ja-JP": "/ja-JP/shop/seat-bag",
    "ko-KR": "/ko-KR/shop/seat-bag",
    "it-IT": "/it/shop/seat-bag",
    "x-default": "/shop/seat-bag"
  });
});

test("sitemap exposes Italian pages and every visible Italian product", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);
  for (const path of ["/it", "/it/about", "/it/shop", "/it/station", "/it/events", "/it/universe", "/it/app", "/it/contact", "/it/stockists", "/it/shipping"]) {
    assert.ok(urls.includes(`${SITE_URL}${path}`), `missing ${path}`);
  }
  for (const product of storefrontProducts) {
    assert.ok(urls.includes(`${SITE_URL}/it/shop/${product.slug}`));
  }
  for (const entry of entries) {
    const languages = entry.alternates?.languages;
    assert.ok(languages);
    for (const locale of ["en", "zh-CN", "ja-JP", "ko-KR", "it-IT", "x-default"]) {
      assert.ok(languages && Object.prototype.hasOwnProperty.call(languages, locale), `${entry.url} is missing ${locale}`);
    }
  }
});

test("Italian pages and products emit localized canonical and social metadata", async () => {
  const about = await generateMetadata({ params: Promise.resolve({ locale: "it", segments: ["about"] }) });
  assert.equal(about.title, "Chi siamo | The Seagull Labs, design e cultura ciclistica");
  assert.equal(about.alternates?.canonical, `${SITE_URL}/it/about`);
  assert.equal(about.alternates?.languages?.["it-IT"], `${SITE_URL}/it/about`);
  assert.equal(about.alternates?.languages?.["x-default"], `${SITE_URL}/about`);
  assert.equal(about.openGraph?.locale, "it-IT");

  const product = await generateMetadata({ params: Promise.resolve({ locale: "it", segments: ["shop", "seat-bag"] }) });
  assert.match(String(product.title), /The Seagull Labs/);
  assert.match(String(product.description), /Borsa sottosella/);
  assert.equal(product.alternates?.canonical, `${SITE_URL}/it/shop/seat-bag`);
});
