# SGL 2.0 Phase 0 — Repository Audit & Recovery Baseline

Date: 2026-11-02  
Baseline commit: `f3331c6b3142c4da8e9ade65a2f53e0ebe10b6df`  
Local safety tag: `phase-0-baseline-2026-11-02`

## Technical inventory

- Framework: Next.js 14 App Router, React 18, TypeScript 5.6 and Tailwind CSS 3.
- Hosting: production is deployed from GitHub `main` to Vercel. The repository has no Sites or Vercel manifest and no production credentials are stored in Git.
- Database: no database client, schema or migration system exists in this repository.
- Authentication and administration: no authentication, authorization or admin interface exists in this repository.
- Catalogue: `data/products.ts` is the current static source of product and variant data.
- Cart: browser-local cart in `localStorage` under `sgl-cart-v1`; it survives locale changes because every locale uses the same key.
- Checkout: guarded `POST /api/checkout` route creates Stripe Checkout sessions only after receiving an authoritative OPS quote. Checkout is disabled unless both server and public feature flags are enabled.
- Payments: Stripe server SDK, signature-verified webhook, mode matching, idempotency and durable OPS acknowledgement checks are implemented. No live or test merchant connection is present in the repository.
- OPS integration: HTTPS service contract is documented, but the OPS database, authentication, inventory reservation and order service are not connected here.
- China payments: WeChat Pay and Alipay are described as direct/manual arrangements only. No merchant API integration exists.
- Shipping: customer-facing information exists; there is no carrier, rate, tracking or fulfillment backend.
- Localization: English pages are individual App Router pages. All four non-English routes are rendered by one catch-all page with a separate, reduced component tree. This duplicated rendering architecture is the root cause of sections disappearing when languages change.
- Locale selection: country and browser detection, bot bypass, locale-preserving URLs and a persistent footer cookie already exist.
- SEO: canonical URLs, reciprocal language alternates, sitemap, robots and product/station structured data already exist.

## Catalogue baseline

The recovery brief mentions 35 records and 22 public products. The newer production repository currently contains:

- 40 product records.
- 27 publicly listed products.
- 65 variants.
- 0 populated SKU values.
- 6 explicitly hidden records.
- No duplicate slugs or original handles.
- No product record with an empty image array.

Phase 0 treats the current 40/27 set as the authoritative preservation baseline. No record, slug, handle, price, image, variant or active URL will be removed to force the catalogue back to the older counts.

## Current capability status

| Area | Status |
| --- | --- |
| Public catalogue and product details | Working from static data |
| Five locale routes and SEO alternates | Working |
| Five-language content parity | Incomplete; non-English render tree omits approved English sections |
| Language/region selection | Working, with persistent manual override and crawler bypass |
| Cart and variant selection | Working in browser storage |
| Server-side price and quote validation | Implemented behind disabled checkout |
| Stripe Checkout and webhook safeguards | Implemented but not connected to real test infrastructure |
| Inventory reservation and order persistence | Missing; expected from external OPS |
| Database, admin authentication and audit log | Missing |
| WeChat Pay and Alipay merchant integrations | Missing |
| Shipping and fulfillment management | Missing |

## Localization history

- `12e41cd`: introduced the localized catch-all routes for Simplified Chinese, Japanese and Korean.
- `1036139`: added Italian localization and SEO.
- `f3331c6`: latest verified production version for all five routes; restored shop category sections but the remaining non-English public pages still use reduced layouts.

The current baseline is the last known buildable version for every locale. It is route-functional, but it is not the Phase 1 content-integrity target.

## Baseline verification

- `npm run test:store`: 27 tests passed, 0 failed.
- `npm run build`: passed, including TypeScript validation and generation of 48 routes.
- ESLint: no ESLint configuration is present; `next lint` is therefore not an established non-interactive project check.
- Production checkout remains off by default in `.env.example`.

## Phase 1 implementation plan

1. Define a canonical public-page and section manifest with stable identifiers.
2. Move non-English section copy into structured locale records keyed by those identifiers.
3. Render every non-English page with all sections in the English master while preserving the current visual system.
4. Add controlled development fallback logging for missing localized values.
5. Validate locale keys, section parity, routes, SEO records, product descriptions and product business identity in automated tests.
6. Reconfirm country selection, persistent manual override, route preservation and crawler bypass.
7. Keep the phase local and checkpointed; do not deploy automatically.

## External blockers reserved for later phases

- Authoritative OPS host, database schema, authentication model and deployment access.
- Stable SKU assignment for all sellable variants.
- Stripe test account, Price IDs, Shipping Rate IDs and webhook endpoint.
- WeChat Pay and Alipay merchant accounts and approved API capabilities.
- Supported shipping regions, rates, carriers, tax rules and fulfillment operations.
