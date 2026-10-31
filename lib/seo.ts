import type { Metadata } from "next";
import type { Product } from "@/data/products";

export const SITE_URL = "https://www.theseagulllabs.com";
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export function pageMetadata(title: string, description: string, path: string, image = "/station/seagull-sunset.webp"): Metadata {
  return {
    title, description,
    alternates: { canonical: absoluteUrl(path) },
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

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(`/shop/${product.slug}`)}#product`,
    name: product.title,
    description: productDescription(product),
    image: product.images.map(absoluteUrl),
    url: absoluteUrl(`/shop/${product.slug}`),
    category: product.category,
    brand: { "@type": "Brand", name: "The Seagull Labs" },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/shop/${product.slug}`),
      price: product.price,
      priceCurrency: "USD",
      seller: { "@type": "Organization", name: "The Seagull Labs", url: SITE_URL }
    }
  };
}

export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
