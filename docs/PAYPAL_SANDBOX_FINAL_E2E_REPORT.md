# PayPal Sandbox Final E2E Report

Date: 2026-11-15 (Asia/Shanghai)

Scope: isolated Preview + PayPal Sandbox only

Payment feature flag: `PAYPAL_ENABLED=false`

## Result

The single USD 1.00 Sandbox order completed the full authorization, capture, verified webhook, durable acknowledgement, and Preview order-state projection flow. No Live PayPal API, Production database, Airwallex flow, or real order was accessed or changed.

The Preview projection stores the terminal payment state as `captured`; this is the test-order equivalent of **Paid**. The PayPal order, Capture, and SGL test-order associations were verified before and after the webhook flow.

## Acceptance summary

### Passed

- Buyer approval changed the PayPal Order from `PAYER_ACTION_REQUIRED` to `APPROVED`.
- Exactly one server-side Capture completed for USD 1.00.
- A later capture-runner invocation was read-only and returned `captureCalled=false`.
- One real `PAYMENT.CAPTURE.COMPLETED` event reached the public ingress, passed PayPal's official signature verification, received a durable OPS acknowledgement, and projected the SGL test order to `captured`.
- The persistence-layer replay of that same verified event returned `duplicate`, increased only the delivery count, and did not create another business record or change the payment state.
- Amount mismatch was retained as an audit event but rejected for payment projection (`captureApplied=false`).
- Pending, Denied, and Cancelled/refunded projections behaved as specified.
- PayPal Order, Capture, and SGL test-order associations matched.
- All isolated Preview test-order and event records were removed and a full-table zero-count check passed.

### Failed

- None.

### Unable to verify

- PayPal accepted one official resend request with HTTP 202, but no second public-ingress delivery was observed during the available log window. No second resend was requested. The current Vercel Hobby log retention no longer covers that event window, and PayPal's event-list response does not expose a durable per-delivery status. This item is therefore **unverified**, not reported as passed.

## Environment and deployments

| Component | Environment | Deployment | Result |
| --- | --- | --- | --- |
| PayPal API | Sandbox | `api-m.sandbox.paypal.com` | Connected |
| Webhook ingress | isolated API-only Vercel service | `dpl_A3yBVVMgq9HFT7EchcCmqxAbfeFT` | Healthy |
| Preview OPS | isolated API-only Vercel service | `dpl_6Vo85MPeQvHZcgJ7ZNzzzoXVeViD` | Healthy |
| Database | isolated Preview PostgreSQL | scoped runtime role | Connected |
| Website payment enablement | Preview code | `PAYPAL_ENABLED=false` | Disabled |

The unique Sandbox webhook remained the only registered webhook. The website Preview Vercel Authentication configuration was not changed.

## E2E acceptance evidence

| Step | Real response/evidence | Status |
| --- | --- | --- |
| Buyer credential preflight | File existed with mode `0600`; both required variables were non-empty; values were never printed | Pass |
| Initial PayPal order query | HTTP 200; state changed from `PAYER_ACTION_REQUIRED` to `APPROVED` after Buyer approval | Pass |
| Server capture | One capture request was made with a stable `PayPal-Request-Id`; response body reported `COMPLETED`, USD 1.00 | Pass |
| Capture replay protection | A later runner execution queried HTTP 200, saw order `COMPLETED`, and returned `captureCalled=false` | Pass |
| Real PayPal webhook | Public ingress received `PAYMENT.CAPTURE.COMPLETED` at `2026-11-15T10:26:31.111Z`; request completed HTTP 200 | Pass |
| Official signature | Ingress only forwarded after PayPal `verify-webhook-signature` returned success; invalid-signature regression returned HTTP 400 | Pass |
| Durable ACK | OPS returned a durable created acknowledgement and persisted the event before the ingress returned success | Pass |
| Order synchronization | Preview test order became `captured`; USD 1.00 and Capture association matched | Pass |
| Duplicate event | Persistence-layer replay using the original verified PayPal Event ID and stored digest; OPS HTTP 200, acknowledgement `duplicate`, delivery count 1 → 2 | Pass |
| Duplicate accounting | Order remained `captured`; Capture association was unchanged; no second payment or balance application occurred | Pass |
| Amount mismatch | OPS HTTP 200 retained the audit event but projected `amount_mismatch`; `captureApplied=false` | Pass |
| Pending | Isolated projection returned `pending` | Pass |
| Denied | Isolated projection returned `denied` | Pass |
| Cancel/refund | Isolated projection returned `cancelled` | Pass |

PayPal accepted one official webhook resend request with HTTP 202, but that asynchronous resend was not observed at the ingress during the available log window. To test persistence idempotency deterministically without another payment or resend, the test fetched the same real Capture event from the PayPal Sandbox API and replayed it once through the token-protected OPS persistence boundary using the original Event ID and stored digest. This was explicitly a **persistence-layer replay**, not a new signed public webhook. The first delivery exercised the complete PayPal signature-verification ingress.

## Least-privilege persistence

The Preview runtime role is limited to:

- `SELECT`, `INSERT`, and `UPDATE` on `paypal_sandbox_events`.
- `EXECUTE` on the bounded `apply_paypal_sandbox_event(...)` projection.
- No direct access to `paypal_sandbox_test_orders`.
- No schema creation, migration, delete, or general Website database permissions.

Applied isolated Preview migrations:

- `0001_paypal_sandbox_events.sql` — SHA-256 `ca71b458e8e7c9b630e00e1afecffbc203f6ce7f5cc18874769b1a3c9061cfff`
- `0002_paypal_sandbox_test_orders.sql` — SHA-256 `216611fa60af567737652a2a98c704caecdec0144d1a8eae11124cf7ce6c7eda`

No Production migration was executed.

## Automated regression

- Webhook ingress: 5/5 passed.
- Preview OPS and least-privilege persistence: 5/5 passed.
- Website store/payment regression: 145/145 passed.
- TypeScript: passed.
- Next.js production build: passed in webpack mode (56 pages).
- Turbopack could not bind its local helper port in the execution sandbox; the same source completed the supported webpack production build.

## Cleanup

Cleanup ran in a database transaction and was restricted to the saved SGL test-order, PayPal Order, and Capture identifiers.

- Preview event rows removed: 3.
- Preview test-order rows removed: 1.
- Remaining rows in `paypal_sandbox_events`: 0.
- Remaining rows in `paypal_sandbox_test_orders`: 0.
- Temporary local E2E state file: removed.

The PayPal Sandbox transaction remains in PayPal's provider-side Sandbox history because captured provider transactions are immutable. It is not a real charge and has no Production or Airwallex effect.

## Security and release status

- No Buyer password, access token, API secret, webhook secret, database URL, or Capture identifier is included in this report or committed to Git.
- Sandbox and Live remain separated.
- `PAYPAL_ENABLED` remains false.
- Airwallex was not changed.
- Production code, Production database, and real orders were not changed.
- This acceptance does not authorize or enable PayPal Live payments.
