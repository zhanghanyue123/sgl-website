# SGL 2.0 — Phase 3 Order Core

Status: code complete. Production activation requires the database migration and a scheduled expiry job.

## Delivered

- Persistent browser cart with variant, quantity, removal and localized totals.
- Server-owned product and variant lookup. Prices, product state and currency are read from PostgreSQL when an order is created; browser totals are never trusted.
- Order, customer, address, line-item and immutable event records.
- Independent order, payment and fulfillment states.
- Unique order numbers, request hashes and idempotency keys.
- Atomic stock reservation, payment capture and reservation release functions.
- A concurrency-safe expiry worker using row locks and skip-locked processing.
- Admin order list, order detail/timeline, customer list and dashboard queues.

## Inventory lifecycle

1. A draft order snapshots its sellable variants and server-side prices.
2. The reserve-order function locks the order, reserves every line in one transaction and moves it to pending payment.
3. Only a verified server-side payment handler may call the capture function. It converts reserved stock to sold stock once.
4. Cancellation and expiry call the release function, returning the reservation without changing on-hand stock.
5. Repeated capture, release or expiry requests are handled idempotently and cannot deduct the same order twice.

The checkout return page is informational. It never changes payment state.

## Activation

1. Configure DATABASE_URL and run npm run db:migrate.
2. Schedule npm run orders:expire at least every five minutes.
3. Keep STORE_CHECKOUT_ENABLED=false until Phase 4 payment-provider webhooks and test transactions pass.

The repository does not include live database or payment credentials, so no production migration or real order was created during this phase.

## Verification

- Order contract and inventory lifecycle tests are in tests/orders.test.ts.
- TypeScript and the production Next.js build must pass before deployment.

Next: Phase 4 connects payment attempts and verified Stripe, WeChat Pay and Alipay callbacks to this order core.
