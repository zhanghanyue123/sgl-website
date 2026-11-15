# SGL Cart and PayPal Checkout Final Report

Date: 2026-11-15 (Asia/Shanghai)

Branch: `fix/cart-paypal-checkout-20261115`

Preview deployment: `dpl_8KUrKeeiSvYqiqhRMC7qPyTsvaTr`

Preview URL: `https://sgl-website-ppu97bup7-zhanghanyue123s-projects.vercel.app`

Production deployment: **Not changed**

## 1. Add to Cart fix

The storefront now gives immediate, accessible feedback for product-detail and eligible product-card additions:

- The clicked control enters `Adding…` and is disabled while the operation is pending.
- A synchronous in-flight guard prevents a rapid second click before React renders the disabled state.
- The cart provider also rejects a concurrent operation for the same product and variant.
- Every customer action has a stable operation ID. A failed attempt reuses that ID when retried, while a later intentional add receives a new ID and can increase quantity normally.
- Success displays `Added to cart`, a cart link, and an updated header count badge.
- Storage failures display an error and permit retry.
- Multiple variants require option selection; Quick Add is shown only when exactly one sellable variant is available.
- Cart state is persisted to the existing `sgl-cart-v1` browser record and restored after refresh.
- Quantity changes and removal persist synchronously.

The current storefront has no Cart API. Cart additions are local browser operations; server-side amount, product and currency validation still occurs at checkout. Network retry behavior therefore applies to checkout/payment APIs, while cart-add failure coverage uses storage failure and retry.

## 2. Duplicate-add acceptance

Automated coverage confirms:

- One operation adds one quantity.
- Repeating the same operation ID does not add a second quantity.
- A later intentional operation ID increases quantity.
- Separate variants remain separate cart lines.
- Persisted lines survive normalization and refresh.
- Storage failure does not claim success and a later retry succeeds.
- The cart badge reports total quantity.
- Existing quantity modification, removal, totals and checkout reconciliation tests remain green.

## 3. UI feedback acceptance

The code and automated tests cover Loading, disabled state, success, error, retry, cart count and variant selection. The protected Vercel Preview is Ready and its `/cart` route returned HTTP 200 through the authenticated Vercel deployment request.

Desktop/mobile browser automation could not be completed in this run because the administrator-enforced browser policy blocked both the protected Preview domain and localhost. No protection bypass was attempted. A human Preview pass remains required for visual spacing and touch behavior.

## 4. PayPal Sandbox status

The previously accepted Sandbox implementation remains intact:

- OAuth and Orders API v2
- Server-calculated order amount
- Buyer approval and server-side capture
- `PayPal-Request-Id` idempotency
- Official webhook signature verification
- Durable OPS acknowledgement
- Event-ID replay protection
- Amount, currency and SGL-order binding checks
- Duplicate capture protection

The website PayPal routes now also require the dedicated server-only `PAYPAL_ENABLED=true` switch. The default is `false`; create, capture and webhook routes return 503 when disabled. The PayPal choice is hidden unless the server confirms an enabled Sandbox configuration.

## 5. PayPal Live readiness

Live is **Not Connected** and must not be enabled yet.

Evidence:

- The reviewed client intentionally accepts only `PAYPAL_ENV=sandbox` and allowlists Sandbox API and approval hosts.
- Vercel Production has no confirmed PayPal Live Client ID, Client Secret or Live Webhook ID.
- The available local PayPal API credentials were previously verified as Sandbox credentials; they are not treated as Live credentials.
- Live merchant identity review, settlement account, accepted currencies, refund permission, regional restrictions and Live webhook registration could not be verified from the available server configuration.

Live activation requires all of the following:

1. A verified PayPal Business account with Live Checkout access.
2. Confirmed settlement account, supported USD receipt and refund permissions.
3. A Live REST Client ID and Client Secret stored only in Vercel Production server environment variables.
4. A unique Live Webhook and server-only Live Webhook ID.
5. An explicit, reviewed code change that supports `api-m.paypal.com` and the Live approval host without weakening the Sandbox allowlist.
6. Preview configuration audit, webhook reachability review, regression testing and a separate Production approval.

Required server-only variables at that later stage:

- `PAYPAL_ENV=live`
- `PAYPAL_ENABLED=true`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`

No PayPal secret may use `NEXT_PUBLIC_`.

## 6. Existing card provider / Airwallex regression

No Airwallex file, configuration or flow was changed. The checkout implementation in this branch currently presents the existing **Stripe card** provider. No Airwallex adapter is present in this code baseline, so the requested “Airwallex + PayPal” display cannot be certified from this branch. This mismatch must be resolved by identifying the authoritative Airwallex implementation before any Production payment release; it must not be reconstructed or replaced during this cart fix.

## 7. Validation

- Store test suite: **150/150 passed**
- TypeScript / lint: **passed**
- Next.js Production Build: **passed** (56 static-generation entries completed)
- `git diff --check`: **passed**
- Credential scan of tracked work (excluding environment files and build/vendor directories): **no matches**
- Vercel Preview: **Ready**
- Preview `/cart`: **HTTP 200** through authenticated Vercel request
- PayPal enabled-by-default: **No**
- Production database/order/payment/inventory writes: **None**

## 8. Deployment status and rollback

The changes are deployed only to the Vercel Preview above. Production was not deployed, and no Production environment variable was changed.

Rollback for the Preview is to redeploy the previous Preview commit or remove this Preview deployment. The Production rollback path is unchanged because Production was not touched.

## 9. Remaining blockers

1. Human desktop and mobile visual acceptance under Preview Authentication.
2. Confirmation of the authoritative Airwallex checkout implementation and baseline.
3. PayPal Live Business eligibility and Live credentials.
4. Live webhook creation and reachability validation.
5. A reviewed Live-host implementation and separate Production release approval.

