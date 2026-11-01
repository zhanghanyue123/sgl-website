import type { MetadataRoute } from "next";
import { storefrontProducts } from "@/data/products";
import { absoluteUrl } from "@/lib/seo";
import { languageAlternates, locales, localizedPath } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/shop", "/station", "/events", "/universe", "/about", "/app", "/contact", "/shipping", "/stockists"];
  const paths = [...pages, ...storefrontProducts.map((product) => `/shop/${product.slug}`)];
  return paths.flatMap((path) => locales.map((locale) => ({
    url: absoluteUrl(localizedPath(path, locale)),
    alternates: {
      languages: Object.fromEntries(
        Object.entries(languageAlternates(path)).map(([language, href]) => [language, absoluteUrl(href)])
      )
    }
  })));
}
