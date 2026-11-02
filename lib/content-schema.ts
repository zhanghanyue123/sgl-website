import { locales, type Locale } from "./i18n";

export const publicPageSections = {
  home: ["hero", "shop", "station", "events"],
  about: ["hero", "history", "principles", "brand-structure", "media", "directions", "cta"],
  shop: ["hero", "bikes-frames", "bags-carry", "wear-ride", "coffee-refuel", "accessories"],
  product: ["product-detail"],
  station: ["hero-image", "hero", "station-life", "offerings", "station-logic", "mini-program", "station-stories"],
  events: ["film", "hero", "calendar", "exhibitions", "community", "formats", "event-list", "development", "cta"],
  universe: ["hero-image", "hero", "characters", "world-system", "world-points", "cta"],
  app: ["hero", "screens", "next-chapter"],
  contact: ["hero", "contact-methods", "fast-order", "collaboration", "cta"],
  stockists: ["hero", "channels", "partnership"],
  shipping: ["information"],
  cart: ["cart"],
  success: ["status"],
  footer: ["footer"]
} as const;

export type PublicPage = keyof typeof publicPageSections;
export type LocalizedLocale = Exclude<Locale, "en">;

export const publicPageRoutes: Record<Exclude<PublicPage, "product" | "footer">, string> = {
  home: "/",
  about: "/about",
  shop: "/shop",
  station: "/station",
  events: "/events",
  universe: "/universe",
  app: "/app",
  contact: "/contact",
  stockists: "/stockists",
  shipping: "/shipping",
  cart: "/cart",
  success: "/checkout/success"
};

export const localizedLocales = locales.filter((locale): locale is LocalizedLocale => locale !== "en");

export function sectionMarker<P extends PublicPage>(page: P, section: (typeof publicPageSections)[P][number]) {
  return { "data-content-section": `${page}.${section}` } as const;
}

export function missingSectionCopy(
  catalog: Record<string, Record<string, unknown>>
): string[] {
  const missing: string[] = [];
  for (const locale of localizedLocales) {
    for (const [page, sections] of Object.entries(publicPageSections)) {
      const pageCopy = catalog[locale]?.[page];
      if (!pageCopy || typeof pageCopy !== "object") {
        missing.push(`${locale}.${page}`);
        continue;
      }
      for (const section of sections) {
        if (!(section in pageCopy)) missing.push(`${locale}.${page}.${section}`);
      }
    }
  }
  return missing;
}
