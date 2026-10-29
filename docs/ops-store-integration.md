# SGL store integration status

## Implemented

Branch: feature/ops-store. Product variant selection, quantity selection, browser-persisted cart, removal and subtotal display. Build passed. Payment routes are implemented but default to disabled. See stripe-setup.md for the required OPS contract; the actual OPS backend and administration screens remain unconnected.

## Confirmed requirements

- Accept overseas bank cards.
- Prefer existing Tencent Cloud OPS for store administration and customer support.
- Keep personal file access within /Users/hanyue/Documents/Codex.

## Unresolved dependencies

- Actual Tencent Cloud host and deployment access. 127.0.0.1:8097 is a loopback address, not a deployable server identity.
- Identify the running 8097 application. Local Station OS documentation refers to /opt/sgl-station-os on 8099. Retail Agent docs also allow 8097, so do not assume which service is running.
- Payment merchant/provider, selling currency, current prices, shipping regions and shipping rates.
- Existing authentication and database schema for OPS.

## Integration requirements

OPS is authoritative for products, stable variant IDs, publication status, prices in integer minor units, inventory and orders. The existing static catalog and historical quantities are not authoritative inventory.

Vercel server routes must request live checkout quotes from OPS. Never accept client-supplied prices as authoritative. Reserve inventory atomically with an expiry; use idempotency keys when creating orders and payment sessions. Do not label an order paid based on browser redirects. Verify payment provider webhook signatures and reconcile amount, currency and order identity. Store webhook event IDs for deduplication. Release inventory on expiry and support refund reconciliation.

Keep OPS credentials server-side. Do not publish the OPS admin token in browser code or expose the admin dashboard without its existing authentication. Admin functionality: products and variants, stock adjustments with an audit trail, orders/payment state, shipment tracking and customer support linked to orders.

Before production: verify payment success, cancellation, duplicate webhooks, invalid signatures, declined payment, out-of-stock contention, inventory release, refunds, and OPS downtime using the provider's test environment.
