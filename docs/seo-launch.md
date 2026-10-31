# SEO launch and outstanding console steps

## Implemented

- Canonical hostname: `https://www.theseagulllabs.com`.
- Host-specific permanent 308 redirect from `theseagulllabs.com`, preserving path and query. Verified against local production server, not live DNS/TLS.
- `/sitemap.xml`: 10 public information pages and 22 eligible product pages. Hidden products, cart, checkout and API URLs excluded.
- `/robots.txt` advertises the sitemap; cart and checkout pages have noindex metadata.
- 32 unique page titles/descriptions and canonical links; social metadata included.
- 22 Product JSON-LD blocks with matching visible USD prices, images, names, descriptions and seller. Availability, ratings, delivery rates and return windows are deliberately omitted because authoritative values are not provided.
- `/shipping`: English sales/delivery/support information. Shipping destinations, rates, times and return windows require confirmation from SGL before they can be stated as policy.
- `/stockists`: English direct sales, Shanghai station enquiries and wholesale contact. No unverified third-party shops or addresses are listed.

## Vercel / DNS — not yet completed

Admin browser policy blocked access to Vercel. No domain/DNS changes were made.

1. In the existing SGL Vercel project, open Settings → Domains.
2. Confirm BOTH `theseagulllabs.com` and `www.theseagulllabs.com` belong to this project. Do not move them from another project without checking its use.
3. Use the exact DNS records Vercel shows for this project at the domain's DNS provider. Preserve mail, verification and other unrelated records. Do not guess an IP address.
4. Confirm both domains have valid configuration and HTTPS certificates. The code redirect only runs once apex traffic reaches this deployment.
5. Optionally configure the apex domain to redirect permanently to the www domain in Vercel. There must be no reverse redirect from www to apex.
6. Verify HTTP and HTTPS apex links, including a product path and a query string, land on HTTPS www without a loop.

## Google Search Console — not yet submitted

Admin browser policy blocked access to Search Console. No authenticated verification or sitemap submission was performed. A robots.txt sitemap reference is discovery support, not proof of a Search Console submission.

1. Open the existing Search Console property for this site. If using a URL-prefix property, use `https://www.theseagulllabs.com/`.
2. The site contains the user-supplied meta verification value `g3m_seOMh_Q8f8M_fOEnKPfjTPbyJpDPiPnvaIRXKDU`. Check that it matches the token requested under the HTML-tag verification method for that property.
3. If the value was issued for Domain-property DNS verification, add the exact `google-site-verification=...` TXT record at the DNS provider instead. A meta tag does not verify a DNS-only Domain property.
4. Complete verification in the console.
5. Under Sitemaps, submit `https://www.theseagulllabs.com/sitemap.xml` (or `sitemap.xml` when the console prefixes the site URL). Check the fetch status.
6. Inspect the home page and an example product page after deployment, and review indexing / Product enhancement reports as Google processes them. Submission does not guarantee indexing or rich results.

References:
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- https://nextjs.org/docs/app/guides/redirecting
