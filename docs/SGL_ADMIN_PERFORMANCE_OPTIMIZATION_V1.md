# SGL Admin Performance Optimization V1

Date: 2026-11-09

Branch: `perf/admin-performance-v1`

Baseline: `fe8662a30c190cbb8b16f669f27e65ce6988729a`

Optimization commit: `0e03b6f`

Final acceptance commit: `3405555`

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

Final Preview deployment: `https://sgl-website-9udqrajhq-zhanghanyue123s-projects.vercel.app`

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
- Test suite: 116/116 passed.
- Production build: passed; 52 static pages generated and all Admin/Station dynamic routes registered.
- `git diff --check`: passed before commit.
- Preview authentication and Preview Owner application login: HTTP 200.
- Preview APIs and `/admin`, `/admin/agents`, `/admin/station`: HTTP 200.
- No credentials added to the repository or browser environment.

## Final Preview acceptance

### Cache lifecycle

- A cache hit retained the same `generatedAt` value inside the 30-second window.
- Expiry uses Next.js stale-while-revalidate semantics: the first request after expiry may receive the previous snapshot while one refresh runs; the next request received the new snapshot.
- Eight concurrent requests after expiry produced one old snapshot response and seven responses with the same new snapshot timestamp. The test did not produce eight independent refresh results.
- A temporary Preview-only Agent approval was rejected through the real authenticated API. The write returned HTTP 200 and immediately changed both Overview and Agent Operations `generatedAt` values, confirming tag invalidation. The temporary fixture and accounts were removed after testing.

### RBAC and data isolation

Temporary Preview-only accounts were created and removed after the test. The application roles are `owner`, `admin`, `inventory`, and `viewer`; there is no literal `operations` role, so `inventory` was tested as the operations-equivalent role.

| Role | Overview | Agent Operations | Station |
| --- | ---: | ---: | ---: |
| Owner | 200 | 200 | 200 |
| Admin | 200 | 200 | 200 |
| Inventory / operations-equivalent | 200 | 403 | 200 |
| Viewer | 200 | 403 | 200 |

Authorized roles received the same permission-independent business data. Differences were limited to generation timestamps. Unauthorized Agent Operations responses contained only an error object. Cached read models contain no session, role, password hash, token hash, authorization header, raw MIME, or full email-body fields. Station cache keys include organization and store identifiers. Overview and Agent Operations are single-organization aggregate caches and are protected by RBAC before cache access.

### Session and source failure handling

- React request memoization wraps the Admin session lookup, so layout and page permission checks share one lookup within a render request.
- Automated tests independently simulated Station timeout, Retail HTTP 503, and a healthy Hello projection. The resulting source states were `error`, `error`, and `ok`; the dashboard loader did not throw.
- A projection older than 15 minutes was verified to return `stale` with an explicit age message.
- API response headers remain `private, no-store` for Overview and Agent Operations and `no-store` for Station. No response set an additional session cookie.

### Same-environment comparison

The pre-optimization commit `fe8662a` and final acceptance commit were deployed as separate protected Previews using the same Preview database, Owner authentication, test client, and five-request matrix. Values below are median TTFB.

| Target | Baseline Preview | Optimized Preview | Change |
| --- | ---: | ---: | ---: |
| Overview API | 0.697 s | 0.552 s | 20.8% faster |
| Agent Operations API | 0.553 s | 0.581 s | 5.1% slower / test noise |
| Station API | 0.592 s | 0.542 s | 8.6% faster |
| `/admin` | 0.715 s | 0.686 s | 4.2% faster |
| `/admin/agents` | 0.668 s | 0.660 s | 1.1% faster |
| `/admin/station` | 0.685 s | 0.675 s | 1.4% faster |

First-request measurements were mixed because serverless placement and connection setup dominate this small sample. The optimization does not establish a universal cold-start improvement. Warm Overview improved materially; the already-light Agent Operations Preview path stayed within the noise range.

### Delivered size

| Asset | Baseline Preview | Optimized Preview | Change |
| --- | ---: | ---: | ---: |
| Admin JavaScript | 654,570 bytes / 10 scripts | 654,570 bytes / 10 scripts | unchanged |
| `/admin` HTML | 44,672 bytes | 50,407 bytes | +5,735 bytes |
| `/admin/agents` HTML | 63,011 bytes | 70,617 bytes | +7,606 bytes |
| `/admin/station` HTML | 74,804 bytes | 81,978 bytes | +7,174 bytes |

JavaScript did not grow. HTML grew because the responsive loading skeleton is included in the streamed server response. This is a measured tradeoff for earlier visual feedback and should be evaluated with real-browser LCP before Production promotion.

### Preview blocker discovered

The Preview database does not contain `station_admin_snapshots`, indicating migration 0013 is not applied to this Preview database. Station handles the query failure and returns a truthful disconnected/error projection, but live Station cache-write testing cannot run until the Preview migration is reviewed and applied. No migration was executed in this performance acceptance task.

## Measurement limits

Vercel's CLI output did not expose separate Function execution duration, so end-to-end authenticated TTFB is reported instead. FCP, LCP, and desktop/mobile screenshots were not collected: the environment's admin-enforced browser policy blocked both the protected Vercel Preview and localhost. The policy explicitly prohibited alternate browser or CDP workarounds. These checks must be completed manually through the Preview URL before Production promotion.

The current skeleton is route-level. Data-source requests and failures are independent, but individual metric cards are not yet streamed as separate React Suspense boundaries. This can be a second optimization only if real-browser traces show it materially improves perceived loading.

## Production promotion gate

Do not promote automatically. Before Production release:

1. Manually validate desktop and mobile layout through the protected Preview.
2. Capture real-browser FCP and LCP.
3. Review and apply migration 0013 to the isolated Preview database, then validate Station snapshot writes.
4. Observe warm and cold requests for a larger sample.
5. Promote the exact tested commit only after review.
