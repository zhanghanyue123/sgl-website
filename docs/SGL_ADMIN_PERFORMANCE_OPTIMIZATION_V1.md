# SGL Admin Performance Optimization V1

Date: 2026-11-09

Branch: `perf/admin-performance-v1`

Baseline: `fe8662a30c190cbb8b16f669f27e65ce6988729a`

Optimization commit: `0e03b6f`

## Scope and safety

This optimization changes Admin read performance only. Airwallex, checkout, orders, payments, database ownership, authentication, RBAC, and production data are unchanged. The optimized build was deployed only to a Vercel Preview protected by Vercel Preview Authentication and the existing Preview Owner login.

API responses remain `private, no-store`. The new cache is an internal server-side cache of permission-independent business read models. Sessions, service tokens, and administrator-specific data are not cached.

## Measured baseline

Measurements used authenticated requests to `https://admin.theseagulllabs.com`. Times are end-to-end from the test client.

| Target | Production baseline |
| --- | ---: |
| `/admin` first TTFB | 7.316 s |
| `/admin` warm TTFB | 1.955–2.270 s |
| `/admin/agents` TTFB | 1.490–1.936 s |
| Overview API first TTFB | 5.232 s |
| Overview API warm TTFB | 1.926–1.949 s |
| Agent Operations API TTFB | 1.464–1.843 s |
| Station API first TTFB | 3.561 s |
| Station API warm TTFB | 1.516–2.168 s |
| Admin compressed JavaScript | 654,755 bytes across 10 scripts |

Read-only database timing from the diagnostic client:

| Query group | Time |
| --- | ---: |
| Connect + `SELECT 1` | 3,824.6 ms |
| Session shape lookup | 410.5 ms |
| Station snapshot | 3,576.8 ms |
| Agent snapshots | 701.0 ms |
| Overview parallel query group | 3,800.9 ms |

The connection and database round trips were the dominant source of delay. Existing data-source calls were already mostly parallel, but the same read models were rebuilt for every request and the Admin layout/page could repeat the same session lookup.

## Changes

- Deduplicated Admin session lookup within each React Server Component request.
- Added a 30-second server cache for Unified Overview, Agent Operations, and Station Admin read models.
- Kept Retail, Hello, Station, Website, and Fries source failures isolated; one unavailable source does not fail the complete dashboard.
- Added immediate cache expiration after product, inventory, approval, Station snapshot, Station command, and Agent snapshot changes.
- Added a responsive route-level skeleton for Admin pages.
- Preserved source timestamps, `Stale`, `Error`, and `Not Connected` states.
- Kept API responses private and non-cacheable by browsers or shared proxies.

## Preview results

Preview deployment: `https://sgl-website-csdbmwuym-zhanghanyue123s-projects.vercel.app`

| Target | Optimized Preview | Observed change |
| --- | ---: | ---: |
| `/admin` TTFB | 1.284 s | 39% faster than midpoint of warm baseline |
| `/admin/agents` TTFB | 0.673 s | 61% faster than midpoint of baseline |
| `/admin/station` TTFB | 0.647 s | Preview route validation |
| Overview API first/warm TTFB | 0.844 / 0.666–0.733 s | about 64% faster warm |
| Agent Operations API first/warm TTFB | 0.829 / 0.574 s | about 65% faster warm |
| Station API TTFB | 0.546–0.553 s | Preview has no production Station projection; not a like-for-like payload comparison |
| Admin compressed JavaScript | 654,570 bytes across 10 scripts | effectively unchanged (-0.03%) |

The optimized aggregate APIs meet the requested p95 direction of less than 800 ms in the sampled warm Preview requests. This is a small validation sample, not a production p95 claim.

## Verification

- TypeScript/lint: passed.
- Test suite: 110/110 passed.
- Production build: passed; 52 static pages generated and all Admin/Station dynamic routes registered.
- `git diff --check`: passed before commit.
- Preview authentication and Preview Owner application login: HTTP 200.
- Preview APIs and `/admin`, `/admin/agents`, `/admin/station`: HTTP 200.
- No credentials added to the repository or browser environment.

## Measurement limits

Vercel's CLI output did not expose separate Function execution duration, so end-to-end authenticated TTFB is reported instead. FCP, LCP, and screenshots were not collected: the environment's admin-enforced browser policy blocked both the protected Vercel Preview and localhost. The policy explicitly prohibited alternate browser or CDP workarounds. These checks must be completed manually through the Preview URL before Production promotion.

The current skeleton is route-level. Data-source requests and failures are independent, but individual metric cards are not yet streamed as separate React Suspense boundaries. This can be a second optimization only if real-browser traces show it materially improves perceived loading.

## Production promotion gate

Do not promote automatically. Before Production release:

1. Manually validate desktop and mobile layout through the protected Preview.
2. Capture real-browser FCP and LCP.
3. Confirm source freshness and cache invalidation after a safe Preview write.
4. Observe warm and cold requests for a larger sample.
5. Promote the exact tested commit only after review.
