import { storefrontProducts } from "../data/products";
import { locales, localizedPath, type Locale } from "../lib/i18n";
import { SITE_URL } from "../lib/seo";

const base = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3107").replace(/\/$/, "");
const pages = ["/", "/shop", "/station", "/events", "/universe", "/about", "/app", "/contact", "/shipping", "/stockists"];
const paths = [...pages, ...storefrontProducts.map((product) => `/shop/${product.slug}`)];

async function check(path: string, locale: Locale) {
  const localized = localizedPath(path, locale); const url = `${base}${localized}`;
  const response = await fetch(url, { redirect: "manual", headers: { "user-agent": "SGL-Regression-Smoke/1.0", "accept-language": "en" } });
  if (response.status !== 200) throw new Error(`${response.status} ${url}`);
  const html = await response.text();
  if (!html.includes(`<html lang="${locale}"`)) throw new Error(`Incorrect lang on ${url}`);
  if (!/<title>[^<]+<\/title>/.test(html)) throw new Error(`Missing title on ${url}`);
  const canonical = `${SITE_URL}${localized === "/" ? "" : localized}`;
  if (!html.includes(`rel="canonical" href="${canonical}"`)) throw new Error(`Missing canonical ${canonical}`);
  if (/>undefined<|null product|replace this copy/i.test(html)) throw new Error(`Placeholder content on ${url}`);
}

async function main() {
  let checked = 0;
  for (const locale of locales) for (const path of paths) { await check(path, locale); checked += 1; }
  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    const response = await fetch(`${base}${path}`); if (!response.ok) throw new Error(`${response.status} ${path}`); checked += 1;
  }
  console.log(`Smoke checked ${checked} public URLs across ${locales.length} locales.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
