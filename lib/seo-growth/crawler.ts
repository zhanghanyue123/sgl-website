import type { CrawledPage } from "./types";

export type SeoFetch = (input: string, init?: RequestInit) => Promise<Response>;

const blockedRouteSegments = new Set(["admin", "api", "account", "login", "checkout", "payment"]);
const localeSegments = new Set(["en", "zh", "zh-cn", "ja", "ko", "it"]);
const maxHtmlBytes = 2 * 1024 * 1024;

export function isPublicSeoCrawlUrl(input: string, approvedOrigin: string) {
  const url = new URL(input);
  if (url.origin !== approvedOrigin || url.username || url.password) return false;
  const segments = url.pathname.split("/").filter(Boolean).map((segment) => segment.toLowerCase());
  if (segments[0] && localeSegments.has(segments[0])) segments.shift();
  return !segments[0] || !blockedRouteSegments.has(segments[0]);
}

const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
const text = (html: string, pattern: RegExp) => decode((html.match(pattern)?.[1] || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")) || null;
const attribute = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? null;
const tags = (html: string, name: string) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) || [];

export function normalizeCrawlUrl(input: string, base?: string) {
  const url = new URL(input, base);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

function normalizeFetchUrl(input: string, base?: string) {
  const url = new URL(input, base);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  return url.toString();
}

export function parseHtmlPage(input: { html: string; url: string; statusCode: number; redirectChain?: string[]; responseMs?: number | null; fetchedAt?: string }): CrawledPage {
  const pageUrl = normalizeCrawlUrl(input.url);
  const origin = new URL(pageUrl).origin;
  const linkTags = tags(input.html, "link");
  const canonical = linkTags.find((tag) => /\brel\s*=\s*["'][^"']*canonical/i.test(tag));
  const hreflang: Record<string, string> = {};
  for (const tag of linkTags) {
    const language = attribute(tag, "hreflang"); const href = attribute(tag, "href");
    if (language && href) hreflang[language] = normalizeCrawlUrl(href, pageUrl);
  }
  const internalLinks = [...new Set(tags(input.html, "a").flatMap((tag) => {
    const href = attribute(tag, "href");
    if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) return [];
    try { const resolved = normalizeCrawlUrl(href, pageUrl); return new URL(resolved).origin === origin ? [resolved] : []; } catch { return []; }
  }))];
  const images = tags(input.html, "img").map((tag) => ({ src: attribute(tag, "src") || "", alt: attribute(tag, "alt") }));
  const schemaTypes = [...new Set([...input.html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    try {
      const value = JSON.parse(match[1]); const values = Array.isArray(value) ? value : [value];
      return values.flatMap((item) => typeof item?.["@type"] === "string" ? [item["@type"]] : Array.isArray(item?.["@type"]) ? item["@type"] : []);
    } catch { return ["InvalidJsonLd"]; }
  }))];
  const htmlTag = input.html.match(/<html\b[^>]*>/i)?.[0] || "";
  return {
    url: input.url, normalizedUrl: pageUrl, statusCode: input.statusCode, redirectChain: input.redirectChain || [],
    canonicalUrl: canonical && attribute(canonical, "href") ? normalizeCrawlUrl(attribute(canonical, "href")!, pageUrl) : null,
    locale: attribute(htmlTag, "lang"), title: text(input.html, /<title\b[^>]*>([\s\S]*?)<\/title>/i),
    metaDescription: attribute(tags(input.html, "meta").find((tag) => /\bname\s*=\s*["']description["']/i.test(tag)) || "", "content"),
    headings: { h1: [...input.html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => decode(match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " "))), h2: [...input.html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((match) => decode(match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " "))) },
    hreflang, internalLinks, images, schemaTypes, mobileMetrics: {}, responseMs: input.responseMs ?? null,
    fetchedAt: input.fetchedAt || new Date().toISOString()
  };
}

async function fetchWithRedirects(url: string, fetcher: SeoFetch, maxRedirects: number) {
  const chain: string[] = []; let current = url;
  for (let index = 0; index <= maxRedirects; index++) {
    const started = Date.now();
    const response = await fetcher(current, { redirect: "manual", headers: { "user-agent": "SGL-SEO-Growth-Agent/1.0", accept: "text/html,application/xhtml+xml" }, signal: AbortSignal.timeout(10_000) });
    const responseMs = Date.now() - started;
    if (response.status < 300 || response.status >= 400 || !response.headers.get("location")) return { response, url: current, chain, responseMs };
    chain.push(current); current = normalizeFetchUrl(response.headers.get("location")!, current);
    if (!isPublicSeoCrawlUrl(current, new URL(url).origin)) throw new Error("SEO crawl redirect left the approved public scope");
  }
  throw new Error("SEO crawl redirect limit exceeded");
}

export async function crawlWebsite(input: { baseUrl: string; maxPages?: number; fetcher?: SeoFetch; seedUrls?: string[] }) {
  const base = new URL(input.baseUrl); if (!new Set(["http:", "https:"]).has(base.protocol)) throw new Error("SEO crawl URL must use HTTP or HTTPS");
  const maxPages = Math.min(Math.max(input.maxPages || 50, 1), 100); const fetcher = input.fetcher || fetch;
  const queue = [...(input.seedUrls || [base.toString()])].map((url) => normalizeCrawlUrl(url, base.toString()));
  const visited = new Set<string>(); const pages: CrawledPage[] = [];
  while (queue.length && pages.length < maxPages) {
    const next = queue.shift()!; if (visited.has(next) || !isPublicSeoCrawlUrl(next, base.origin)) continue; visited.add(next);
    const result = await fetchWithRedirects(next, fetcher, 5); const contentType = result.response.headers.get("content-type") || "";
    const declaredSize = Number(result.response.headers.get("content-length") || 0);
    if (declaredSize > maxHtmlBytes) throw new Error("SEO crawl response exceeds the approved size limit");
    const html = contentType.includes("text/html") ? await result.response.text() : "";
    if (Buffer.byteLength(html, "utf8") > maxHtmlBytes) throw new Error("SEO crawl response exceeds the approved size limit");
    const page = parseHtmlPage({ html, url: result.url, statusCode: result.response.status, redirectChain: result.chain, responseMs: result.responseMs }); pages.push(page);
    if (result.response.ok) for (const link of page.internalLinks) if (!visited.has(link)) queue.push(link);
  }
  return { baseUrl: base.origin, pages, discovered: new Set([...visited, ...queue]).size };
}
