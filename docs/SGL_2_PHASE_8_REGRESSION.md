# SGL 2.0 Phase 8 — Regression and launch evidence

## Automated coverage

- All public core pages and every visible product are requested from a production build in all five languages. Each response must be HTTP 200 and contain the routed `lang`, a title and its localized canonical URL.
- Product records, category order, approved primary images, prices and sold-out overrides are contract-tested.
- Every image referenced by a visible product must exist in `public`.
- Cart lines validate product, variant, sold-out state and quantity. The locale-independent storage key preserves the same cart while switching language routes.
- Checkout rejects browser prices, malformed carts, duplicate variants, cross-origin requests and missing feature configuration.
- Order tests cover deterministic request hashes, idempotency, separate order/payment/fulfillment states, atomic reservations, payment capture and reservation expiry.
- Stripe webhook tests cover signature verification, durable acknowledgement and retry behavior. The browser return page cannot mark an order paid.
- Admin inventory and shipping mutations require explicit permissions. Agent routes remain proposal-only.
- Fulfillment requires address confirmation, validates tracking data, records shipment history and creates a pending notification outbox record without claiming provider delivery.
- SEO tests cover all locale alternates, canonicals, sitemap scope, product/organization schema and safe JSON-LD.
- TypeScript and a Next.js production build validate all application routes.

Run:

```bash
npm run test:store
npm run lint
npx next build --webpack
npm start -- -p 3107
SMOKE_BASE_URL=http://127.0.0.1:3107 npm run test:smoke
```

## External blockers

The following acceptance scenarios require owner-controlled services and cannot be truthfully marked complete from the repository alone:

- Stripe, WeChat Pay and Alipay end-to-end test transactions, including failure, cancellation and refund reconciliation.
- Applying migrations `0001`–`0004` to the production database and exercising order, inventory, fulfillment and agent workflows against that database.
- Delivery confirmation from a configured email or notification provider.
- Real carrier dispatch or tracking callbacks.
- Production shipping regions, fees, taxes, customs rules and delivery restrictions.
- Naver Search Advisor verification and search-console submission.
- Final screenshot-based desktop and mobile review. The available browser automation was blocked from both localhost and the production domain by an admin-enforced browser security policy; responsive CSS still compiled and every routed page passed HTTP smoke checks.

No live payment, refund, shipment or customer notification was initiated during regression testing.
