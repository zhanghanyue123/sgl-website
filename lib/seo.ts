import type { Metadata } from "next";
import type { Product } from "@/data/products";
import { languageAlternates, type Locale } from "@/lib/i18n";

export const SITE_URL = "https://www.theseagulllabs.com";
export const STATION_HERO_IMAGE = "/station/seagull-sunset.webp";
export const STATION_CLUB_HOUSE_IMAGE = "/station/station-club-storefront.png";
export const STATION_BIKE_STUDIO_IMAGE = "/station/shanghai-bike-studio-v2.webp";
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export const openGraphLocales: Record<Locale, string> = {
  en: "en_US", "zh-CN": "zh_CN", "ja-JP": "ja_JP", "ko-KR": "ko_KR", "it-IT": "it_IT"
};

export function pageMetadata(title: string, description: string, path: string, image = STATION_HERO_IMAGE): Metadata {
  const languages = Object.fromEntries(
    Object.entries(languageAlternates(path)).map(([locale, href]) => [locale, absoluteUrl(href)])
  );
  return {
    title, description,
    alternates: { canonical: absoluteUrl(path), languages },
    openGraph: { title, description, url: absoluteUrl(path), siteName: "The Seagull Labs", type: "website", locale: openGraphLocales.en,
      alternateLocale: Object.values(openGraphLocales).filter((locale) => locale !== openGraphLocales.en), images: [{ url: absoluteUrl(image) }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl(image)] }
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "The Seagull Labs",
    alternateName: "SGL",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: absoluteUrl("/apple-icon.png") },
    foundingDate: "2023-06-09"
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "The Seagull Labs",
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: ["en", "zh-CN", "ja-JP", "ko-KR", "it-IT"]
  };
}

export function productBreadcrumbJsonLd(product: Product, path = `/shop/${product.slug}`, shopPath = "/shop", shopName = "Shop") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "The Seagull Labs", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: shopName, item: absoluteUrl(shopPath) },
      { "@type": "ListItem", position: 3, name: product.title, item: absoluteUrl(path) }
    ]
  };
}

export function productDescription(product: Product) {
  const description = /shopify|product archive|replace this copy/i.test(product.description)
    ? `${product.title} from The Seagull Labs ${product.category.toLowerCase()} collection. Contact SGL for available options and product details.`
    : product.description;
  return description.startsWith(product.title) ? description : `${product.title} — ${description}`;
}

export function productJsonLd(product: Product, path = `/shop/${product.slug}`) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(path)}#product`,
    name: product.title,
    description: productDescription(product),
    image: product.images.map(absoluteUrl),
    url: absoluteUrl(path),
    category: product.category,
    brand: { "@type": "Brand", name: "The Seagull Labs" },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(path),
      price: product.price,
      priceCurrency: "USD",
      ...(product.soldOut ? { availability: "https://schema.org/OutOfStock" } : {}),
      seller: { "@type": "Organization", name: "The Seagull Labs", url: SITE_URL }
    }
  };
}

export function stationJsonLd(path = "/station") {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${absoluteUrl(path)}#station`,
    name: "Seagull Station",
    url: absoluteUrl(path),
    image: absoluteUrl(STATION_HERO_IMAGE),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jinyan Road & Dongxiu Road Plaza, L1",
      addressLocality: "Shanghai",
      addressRegion: "Pudong New Area",
      addressCountry: "CN"
    },
    parentOrganization: {
      "@type": "Organization",
      name: "The Seagull Labs",
      url: SITE_URL
    }
  };
}

export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
