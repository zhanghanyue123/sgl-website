# SGL 2.0 Phase 1 — Localization recovery

Date: 2026-11-02

## Outcome

The English and localized storefronts now use one canonical public-section contract. Simplified Chinese, Japanese, Korean and Italian expose the same page sections as English across Home, About, Shop, Product, Station, Events, Universe, App, Contact, Stockists, Shipping, Cart, Checkout Return and the shared Footer.

## Implementation

- Added `lib/content-schema.ts` as the canonical page/section and route contract.
- Added `lib/localized-sections.ts` for structured translated section copy.
- Expanded the shared localized route renderer so each supported language includes every required public section.
- Added stable `data-content-section="page.section"` markers to English and localized render trees.
- Kept product slugs, original handles, prices, images and variants unchanged across languages.
- Added development-only missing-copy logging. Missing copy is skipped rather than rendered as a public placeholder, while automated tests prevent missing keys from shipping.

## Automated coverage

- Every locale implements every canonical section ID.
- Page and route keys are unique and complete.
- Localized page metadata fields are non-empty.
- Every localized product description and detail is translated rather than falling back to English.
- Product identity, commercial fields, images and variants remain identical across locales.
- Every localized public page and product emits canonical, Open Graph and Twitter metadata.
- Manual language preference overrides automatic detection.
- Regional detection redirects supported countries correctly.
- Crawlers remain on canonical English URLs.

## Validation

- `git diff --check`: passed.
- `npm run test:store`: 32 tests passed.
- `npm run build`: passed; 48 routes generated.
- Production deployment: intentionally not performed in Phase 1.

## Data and schema changes

No database, product catalog, pricing, inventory, payment or order schema was changed. This phase only adds content contracts, localized copy, stable rendering markers and tests.

## Remaining work

Phase 2 begins the durable backend data model and migration plan. The current repository still has no database client, migrations or admin authentication.
