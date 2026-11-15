# SGL PayPal Live Readiness Report

Date: 2026-11-15 (Asia/Shanghai)

## Production baseline

- Website: `https://www.theseagulllabs.com`
- Deployment: `dpl_HfCpY1N5vyF9txGNZLGJU1wKf6Ub`
- Deployed cart repair commit: `da460a01c94245a3d74c2186453ebd2742107393`
- Rollback deployment: `dpl_9LXxkJXisT62Xsyd7EUt63BVqBWr`
- PayPal Live: disabled
- Airwallex code: retained; Production credentials and enablement were not changed

## Credential and account audit

The Website Production project has no PayPal environment variables. The only PayPal credentials found are in the isolated Sandbox ingress project. No Live Client ID, Live Client Secret, or Live Webhook ID was found. No Sandbox credential was copied to Website Production.

PayPal Business verification and Live REST app eligibility cannot be asserted without access to the Live app or a successful OAuth request against `https://api-m.paypal.com`. The existing Sandbox OAuth and webhook results are not Live evidence.

## Live readiness code

The readiness branch adds explicit environment separation:

- Sandbox API: `https://api-m.sandbox.paypal.com`
- Live API: `https://api-m.paypal.com`
- Environment-specific approval URL validation
- Environment-specific webhook certificate-host validation
- A separate `PAYPAL_LIVE_ENABLED` release gate
- Server-side credential presence checks before rendering PayPal
- Server-calculated amount and currency
- Server-side capture with deterministic `PayPal-Request-Id`
- PayPal Order, Capture, and SGL Order association validation
- Official webhook signature verification
- Event ID idempotency through the durable OPS interface
- A bounded payment-event allowlist
- Environment value persisted with order, capture, and webhook updates

Supported webhook events:

- `CHECKOUT.ORDER.APPROVED`
- `CHECKOUT.ORDER.COMPLETED`
- `PAYMENT.CAPTURE.PENDING`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`
- `PAYMENT.CAPTURE.REVERSED`

## Required Live configuration

The following values must be created from one verified PayPal Business Live REST app and stored only in the Website Production server environment:

- `PAYPAL_ENV=live`
- `PAYPAL_LIVE_CLIENT_ID`
- `PAYPAL_LIVE_CLIENT_SECRET`
- `PAYPAL_LIVE_WEBHOOK_ID` from the separate Live webhook
- `PAYPAL_ENABLED=false` during readiness checks
- `PAYPAL_LIVE_ENABLED=false` until final approval

The existing Production order service also needs a dedicated, least-privilege `OPS_STORE_API_URL` and `OPS_STORE_API_TOKEN` that can quote carts and persist PayPal order, capture, and webhook transitions. Sandbox OPS must not be reused.

## Live webhook plan

Create exactly one webhook under the Live REST app. It must not reuse the Sandbox webhook ID. Proposed listener:

`https://www.theseagulllabs.com/api/paypal/webhook`

Subscribe only to the supported payment events listed above. Before creation:

1. Verify Live OAuth against `api-m.paypal.com`.
2. Confirm the webhook management scope.
3. List existing Live webhooks to prevent duplicates.
4. Confirm the endpoint is public to PayPal while remaining protected by signature verification.
5. Keep `PAYPAL_ENABLED=false` until the listener and durable OPS path pass non-transactional checks.

## Final Live acceptance requiring explicit approval

1. Verify the Business account is verified and the Live REST app is enabled.
2. Verify USD receiving capability and settlement settings.
3. Verify Live OAuth and list the separate Live webhook.
4. Confirm the Production order-service schema and idempotency keys.
5. Enable `PAYPAL_ENABLED=true` while keeping `PAYPAL_LIVE_ENABLED=false` for webhook/configuration checks.
6. Confirm invalid signatures and unsupported events are rejected without writes.
7. Set `PAYPAL_LIVE_ENABLED=true` only for the approved acceptance window.
8. Create one controlled low-value Live order, obtain payer approval, and perform exactly one server-side capture.
9. Confirm `PAYMENT.CAPTURE.COMPLETED`, durable ACK, amount/currency match, and one Paid transition.
10. Disable the acceptance window or keep it enabled only after Owner approval.

No Live transaction, Live webhook, credential change, Production data mutation, or provider enablement was performed during this readiness phase.
