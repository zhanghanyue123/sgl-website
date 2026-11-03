# SGL 2.0 Phase 7 — Multilingual SEO

Phase 7 preserves the existing public URLs and completes the technical SEO contract for English, Simplified Chinese, Japanese, Korean and Italian.

## Implemented

- Locale-specific URLs, page titles, descriptions, canonical URLs and Open Graph locale codes.
- Reciprocal `hreflang` entries for all five languages plus `x-default`.
- XML sitemap entries for every indexable page and visible product in every locale.
- Correct document `lang` from the routed locale; crawlers remain on canonical English instead of receiving geographic redirects.
- Product structured data using the visible USD price and supplied sold-out state only. Ratings, reviews and unconfirmed stock availability are not fabricated.
- Organization and WebSite structured data using first-party name, URL, logo, launch date and language support.
- Localized Product and BreadcrumbList structured data on product pages.
- LocalBusiness structured data for Seagull Station using the address already published consistently across the site. No unverified hours, phone, coordinates or ratings are emitted.
- Google and Baidu verification metadata already present in the root layout.
- Operational API, admin and checkout routes excluded from crawler queues; cart and checkout pages also carry `noindex` metadata.
- Descriptive alt text for editorial images and locale-aware product titles for product imagery.

## Validation and remaining owner actions

Automated tests verify reciprocal alternates, localized canonicals, indexable sitemap scope, safe JSON-LD serialization, real product prices and the absence of invented ratings.

The owner still needs to supply a Naver Search Advisor verification token before Naver verification can be added. Public search did not provide a reliable independent source for Station hours, phone or exact coordinates, so those fields remain omitted until the owner verifies them. Search-console submission and reindexing must be performed in the corresponding Google, Baidu and Naver accounts after deployment.
