import type { Metadata } from "next";
import type { Product } from "@/data/products";
import { languageAlternates } from "@/lib/i18n";

export const SITE_URL = "https://www.theseagulllabs.com";
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export function pageMetadata(title: string, description: string, path: string, image = "/station/seagull-sunset.webp"): Metadata {
  const languages = Object.fromEntries(
    Object.entries(languageAlternates(path)).map(([locale, href]) => [locale, absoluteUrl(href)])
  );
  return {
    title, description,
    alternates: { canonical: absoluteUrl(path), languages },
    openGraph: { title, description, url: absoluteUrl(path), siteName: "The Seagull Labs", type: "website", images: [{ url: absoluteUrl(image) }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl(image)] }
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
    image: absoluteUrl("/station/seagull-sunset.webp"),
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
