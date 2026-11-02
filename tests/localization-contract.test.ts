import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { storefrontProducts } from "../data/products";
import { generateMetadata } from "../app/[locale]/[[...segments]]/page";
import { middleware } from "../middleware";
import {
  localizedLocales,
  missingSectionCopy,
  publicPageRoutes,
  publicPageSections
} from "../lib/content-schema";
import { localizedProduct, pageCopy } from "../lib/localized-copy";
import { localizedSectionCatalog } from "../lib/localized-sections";
import { localePrefixes } from "../lib/i18n";

test("every locale implements the canonical public section contract", () => {
  assert.deepEqual(missingSectionCopy(localizedSectionCatalog), []);
  for (const sections of Object.values(publicPageSections)) {
    assert.equal(new Set(sections).size, sections.length);
  }
  assert.equal(new Set(Object.values(publicPageRoutes)).size, Object.keys(publicPageRoutes).length);
  for (const [locale, pages] of Object.entries(localizedSectionCatalog)) {
    for (const [page, sections] of Object.entries(pages)) {
      for (const [section, copy] of Object.entries(sections)) {
        assert.ok(copy.heading.trim(), `${locale}.${page}.${section}.heading is empty`);
        assert.ok(copy.body.trim(), `${locale}.${page}.${section}.body is empty`);
      }
    }
  }
});

test("localized page copy is complete and non-empty", () => {
  const expectedPages = ["home", "shop", "about", "station", "events", "universe", "app", "contact", "stockists", "shipping", "cart", "success"];
  for (const locale of localizedLocales) {
    assert.deepEqual(Object.keys(pageCopy[locale]).sort(), [...expectedPages].sort());
    for (const [page, copy] of Object.entries(pageCopy[locale])) {
      for (const [field, value] of Object.entries(copy)) {
        assert.ok(String(value).trim(), `${locale}.${page}.${field} is empty`);
      }
    }
  }
});

test("localized products preserve commerce identity and contain no English copy fallback", () => {
  for (const locale of localizedLocales) {
    for (const product of storefrontProducts) {
      const localized = localizedProduct(product, locale);
      assert.equal(localized.slug, product.slug);
      assert.equal(localized.originalHandle, product.originalHandle);
      assert.equal(localized.price, product.price);
      assert.equal(localized.priceLabel, product.priceLabel);
      assert.deepEqual(localized.images, product.images);
      assert.deepEqual(localized.variants, product.variants);
      assert.notEqual(localized.description, product.description, `${locale}.${product.slug} description fell back to English`);
      localized.details.forEach((detail, index) => {
        assert.notEqual(detail, product.details[index], `${locale}.${product.slug} detail ${index} fell back to English`);
      });
    }
  }
});

test("every localized public route emits canonical SEO metadata", () => {
  const metadataPages = Object.entries(publicPageRoutes).filter(([page]) => !["cart", "success"].includes(page));
  for (const locale of localizedLocales) {
    const segment = localePrefixes[locale];
    for (const [page, path] of metadataPages) {
      const segments = path === "/" ? [] : path.slice(1).split("/");
      const metadata = generateMetadata({ params: { locale: segment, segments } });
      assert.ok(metadata.title, `${locale}.${page} title`);
      assert.ok(metadata.description, `${locale}.${page} description`);
      assert.ok(metadata.alternates?.canonical, `${locale}.${page} canonical`);
      assert.ok(metadata.openGraph, `${locale}.${page} open graph`);
      assert.ok(metadata.twitter, `${locale}.${page} twitter`);
    }
    for (const product of storefrontProducts) {
      const metadata = generateMetadata({ params: { locale: segment, segments: ["shop", product.slug] } });
      assert.ok(metadata.title, `${locale}.${product.slug} title`);
      assert.ok(metadata.description, `${locale}.${product.slug} description`);
      assert.ok(metadata.alternates?.canonical, `${locale}.${product.slug} canonical`);
      assert.ok(metadata.openGraph, `${locale}.${product.slug} open graph`);
      assert.ok(metadata.twitter, `${locale}.${product.slug} twitter`);
    }
  }
});

test("manual locale preference wins, while crawlers remain on canonical English", () => {
  const preferred = new NextRequest("https://www.theseagulllabs.com/shop", {
    headers: { cookie: "sgl_locale=ja-JP", "x-vercel-ip-country": "US", "accept-language": "en-US" }
  });
  assert.equal(middleware(preferred).headers.get("location"), "https://www.theseagulllabs.com/ja-JP/shop");

  const regional = new NextRequest("https://www.theseagulllabs.com/about", {
    headers: { "x-vercel-ip-country": "IT", "accept-language": "en-US" }
  });
  assert.equal(middleware(regional).headers.get("location"), "https://www.theseagulllabs.com/it/about");

  const crawler = new NextRequest("https://www.theseagulllabs.com/about", {
    headers: { "user-agent": "Googlebot", "x-vercel-ip-country": "CN", "accept-language": "zh-CN" }
  });
  assert.equal(middleware(crawler).headers.get("location"), null);
});
