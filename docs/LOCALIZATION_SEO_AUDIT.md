# SGL Website 2.0 — Five-language localization and SEO audit

Status: implementation complete in the local repository; production deployment intentionally withheld.

## Language coverage

| Language | Locale | Public prefix | Regional default | Editorial coverage | Product and cart coverage |
| --- | --- | --- | --- | --- | --- |
| English | `en` | `/` | All other detected countries | Complete | Complete |
| Simplified Chinese | `zh-CN` | `/zh-CN` | Mainland China | Complete | Complete |
| Japanese | `ja-JP` | `/ja-JP` | Japan | Complete | Complete |
| Korean | `ko-KR` | `/ko-KR` | South Korea | Complete | Complete |
| Italian | `it-IT` | `/it` | Italy | Complete | Complete |

The footer selector preserves the equivalent path and product when the language changes. A manual choice is stored in the `sgl_locale` cookie and takes priority on future visits. Country detection is used only for visitors without a saved choice; browser language is consulted only when country data is unavailable. Recognized search crawlers are not redirected by geography.

## Italian editorial master

Italian copy is implemented for the homepage, About, Shop, product pages, Station, Events, Universe, App, Contact, Stockists, Shipping, Cart and checkout return page. It also covers navigation, footer, buttons, forms, product options, sold-out states, image-gallery controls, accessible labels, event poster captions, character biographies and Station details.

The tone is contemporary Italian for an independent cycling, design and lifestyle brand. Proper names and official product names remain unchanged. The text does not claim an Italian store, Italian stockists, EU fulfillment, EUR pricing, VAT registration, guaranteed international delivery or fixed customs treatment.

Italian search intent is assigned by page rather than repeated everywhere:

- Homepage and About: `brand indipendente di ciclismo`, `design e cultura ciclistica`.
- Shop and product pages: `accessori ciclismo`, `accessori bici urbana`, `borse da manubrio`, `borse per bicicletta`, `abbigliamento ciclismo urbano` where the product genuinely matches.
- Station: `Seagull Station Shanghai`, coffee, cycling community and real events in Shanghai.
- Brand and metadata: `The Seagull Labs` is preserved consistently.

## Technical SEO coverage

- The Italian route renders server-side with `<html lang="it-IT">`.
- Every public route and visible product has an indexable `/it` equivalent.
- Canonicals point to the localized page itself.
- Reciprocal alternates contain `en`, `zh-CN`, `ja-JP`, `ko-KR`, `it-IT` and English `x-default`.
- Italian pages and product URLs are included in `sitemap.xml`.
- Page-specific Italian titles, descriptions and Open Graph fields are generated on the server.
- Product structured data uses the localized name context, Italian description and category, with explicit `USD` offers and sold-out availability where verified.
- Italian image descriptions and product-gallery accessibility labels are present where editorial meaning changes by language.
- Italian routes do not depend on visitor location and remain directly crawlable.

The implementation follows Google Search Central guidance to use separate URLs, self-referencing reciprocal `hreflang` sets and an `x-default` page. It avoids automatic IP redirects for known crawlers.

## Commerce accuracy

Italian product and cart pages state that prices are in US dollars (`USD`). They describe Stripe only as the checkout processor when online checkout is enabled and identify card payment as the currently configured method. The Stripe-hosted interface and its success/cancel destinations preserve the selected language. The pages do not promise EUR settlement, EU shipping, an Italian VAT treatment, delivery costs, delivery times or customs outcomes.

The existing checkout remains closed unless `NEXT_PUBLIC_STORE_CHECKOUT_ENABLED` and the corresponding secure server configuration are enabled. Shipping destinations and rates continue to come from the verified order quote rather than browser-supplied values.

## QA coverage

Automated checks cover:

- the five-locale registry and `/it` prefix mapping;
- Italy and Italian browser-language detection;
- equivalent product-path preservation;
- reciprocal alternates with English `x-default`;
- Italian sitemap entries for every public page and visible product;
- existing product publication, price, checkout, webhook and structured-data safeguards;
- a full optimized Next.js production build with type checking.

Manual release QA should still exercise the footer selector, each responsive page at phone and desktop widths, a complete Stripe test checkout for every enabled destination, and the final generated HTML submitted to Google Search Console.

## Owner confirmation required before commerce launch

1. Which countries are currently enabled as Stripe shipping destinations?
2. Which Stripe payment methods are enabled in the live account for international buyers?
3. Are duties and taxes collected at checkout, paid by the recipient, or confirmed manually per order?
4. Is shipping to Italy currently available, and if so, which carrier, price calculation and dispatch estimate are approved for publication?
5. Is any return window or return address approved for public display?

Until these facts are confirmed, the Italian pages use cautious order-by-order language and make no Italy-specific commercial promise.
