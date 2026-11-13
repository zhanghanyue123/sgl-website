# PayPal Sandbox checkout

The PayPal option uses the existing SGL cart and authoritative OPS quote. It never accepts browser prices. The website creates and captures a PayPal Orders API v2 order on the server; OPS remains responsible for the durable SGL order, inventory reservation, idempotency and payment state.

## Server-only configuration

Configure `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` and `PAYPAL_WEBHOOK_ID` only in the Vercel Preview server environment. None may use a `NEXT_PUBLIC_` prefix. Live credentials are rejected because only the sandbox API base URL is implemented.

PayPal webhook URL: `https://PREVIEW_HOST/api/paypal/webhook`.

## OPS contract extensions

All calls retain the existing service Bearer token and `Idempotency-Key` rules.

- `POST /checkout/paypal/orders`: durably bind `{orderId,paypalOrderId,amountTotal,currency,cartHash,environment}` to the reserved quote. Return `{persisted:true,orderId}`.
- `POST /checkout/paypal/capture-context`: return the server-owned `{orderId,paypalOrderId,amountTotal,currency}`. Never derive this from browser data.
- `POST /payments/paypal/captures`: accept a server-retrieved/captured PayPal order, reconcile provider order ID, internal order ID, amount and currency transactionally, and return `{persisted:true,orderId}`. Duplicate capture IDs must return the existing result.
- `POST /payments/paypal/events`: persist the already signature-verified sandbox event transactionally, deduplicate by event ID and return `{persisted:true,eventId}`.

Only verified `PAYMENT.CAPTURE.COMPLETED`, pending/denied/refunded/reversed events may transition payments. Out-of-order terminal events require reconciliation and must not silently downgrade a paid order.

## Acceptance

Use a Preview database and PayPal Sandbox personal buyer. Verify approval/capture, cancellation, failed or pending capture, real webhook delivery/signature, duplicate capture/webhook idempotency, amount mismatch rejection, OPS outage retry, and the unchanged Stripe/Airwallex paths. A browser redirect never marks an order paid.
