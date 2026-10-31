import type { MetadataRoute } from "next";
import { storefrontProducts } from "@/data/products";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/shop", "/station", "/events", "/universe", "/about", "/app", "/contact", "/shipping", "/stockists"];
  return [...pages, ...storefrontProducts.map(product => `/shop/${product.slug}`)].map(path => ({ url: absoluteUrl(path) }));
}
