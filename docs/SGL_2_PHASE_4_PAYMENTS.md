# SGL 2.0 — Phase 4 Payment Readiness

Status: integration prepared; acceptance is blocked by external merchant configuration.

## Available

- Stripe hosted Checkout route with server-side quote checks, fixed currency and amount reconciliation.
- Signature-verified Stripe webhook route with retry behavior and event idempotency delegated to the durable store endpoint.
- Payment and fulfillment states remain independent, and the browser return page never marks an order paid.
- Card, WeChat Pay and Alipay are not advertised unless enabled by the authorized merchant account.
- Checkout remains disabled by both server and public feature flags.

## Required before acceptance

- Stripe test secret, webhook secret, approved payment methods, Price IDs and shipping-rate configuration.
- Authorized WeChat Pay and Alipay merchant configuration, or confirmed enablement through the approved Stripe account.
- A reachable HTTPS OPS store endpoint and token, or a product decision to replace that integration with the Phase 3 PostgreSQL order core.
- Test transactions for every configured provider, including failure, cancellation, duplicate events and refund reconciliation.

No merchant credentials were available in the repository. No real or test payment was initiated. Phase 4 therefore cannot meet its end-to-end acceptance criterion yet.
