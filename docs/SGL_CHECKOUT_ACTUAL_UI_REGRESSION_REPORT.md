# SGL Checkout Actual UI Regression Report

Date: 2026-11-15 (Asia/Shanghai)

## Deployment identification

### Production

- Domain: `https://www.theseagulllabs.com`
- Deployment: `dpl_9LXxkJXisT62Xsyd7EUt63BVqBWr`
- State: Ready
- Created: 2026-11-13 22:38:07 Asia/Shanghai
- Git source: not recorded by Vercel (`gitSource=null`, `meta=null`)
- Commit `62d8062`: **not running in Production**
- Payment build outputs: `/api/checkout` and `/api/stripe/webhook`; no PayPal or Airwallex routes

Because this deployment was produced by a local Vercel CLI upload without Git metadata, an exact Production commit cannot be asserted. Its route manifest proves it is not `62d8062`.

### Previous cart Preview

- Deployment: `dpl_8KUrKeeiSvYqiqhRMC7qPyTsvaTr`
- URL: `https://sgl-website-ppu97bup7-zhanghanyue123s-projects.vercel.app`
- Source branch commit: `62d8062`
- Scope: initial cart feedback and PayPal Sandbox gate

### Repaired Preview

- Deployment: `dpl_2kxH594mfcL3YTeeCHhiu7uLPWZi`
- URL: `https://sgl-website-5eubxep4h-zhanghanyue123s-projects.vercel.app`
- State: Ready, Preview Authentication enabled
- Production aliases: none
- Build outputs include Cart, Airwallex checkout/status/webhook and PayPal create/capture/webhook routes.

## Actual cart component repair

The real public routes were traced to these components:

- `/shop/[slug]` → `ProductPurchase`
- localized product detail route → `ProductPurchase`
- product grids → `ProductGrid` → `ProductCard`
- both write through the shared `CartProvider`
- Header reads the same provider for its quantity badge

The earlier Loading state lasted only a browser frame and could be visually missed. The repaired implementation now provides:

- a minimum 250ms visible Loading state;
- synchronous in-flight protection before React rerenders;
- a second same-product/variant guard in `CartProvider`;
- a stable operation ID reused after failure;
- a high-contrast fixed `Added to cart` notification;
- a direct `View cart` link;
- an updated Header quantity badge;
- persistent cart state across refresh;
- separate lines for different variants;
- normal quantity increases for later intentional clicks;
- storage failure feedback and retry.

There is no Cart API in this storefront. Cart additions are browser-local and checkout performs the authoritative product, price, SKU, inventory and payment validation. No fictitious Cart API was added.

## Payment provider repair

The Production build currently uses Stripe. It is not Airwallex and must not be described as Airwallex.

The historical Airwallex implementation was found at commit `f8da7c7`. It is an Airwallex **Sandbox** adapter with:

- server-side authentication;
- PaymentIntent creation;
- request idempotency;
- amount and currency validation;
- webhook HMAC verification;
- durable inbox processing;
- checkout security rate limiting;
- signed status polling;
- stable-SKU enforcement.

The recovered implementation was forward-integrated into the repaired Preview without importing the old branch wholesale. Existing Admin, SEO, Station, Inventory and PayPal work remains in place.

The checkout UI no longer offers Stripe as an Airwallex substitute. It displays only providers that pass server-side configuration checks:

- `Airwallex Sandbox`, only when the dedicated Airwallex gate, Sandbox environment, local commerce backend and provider selection are all configured;
- `PayPal Sandbox`, only when the dedicated PayPal gate and Sandbox environment are configured.

PayPal Live remains hidden and disabled.

## Current provider availability

### Production

- Airwallex environment variables: absent
- PayPal environment variables: absent
- `PAYPAL_ENABLED`: absent/off
- Airwallex Live readiness: not verified
- PayPal Live readiness: not verified
- Current deployed checkout route: Stripe baseline

### Preview

- Airwallex environment variables: absent
- PayPal environment variables: absent
- Checkout feature flags exist, but no provider is allowed to appear without its complete configuration.
- Provider UI therefore remains unavailable instead of presenting a button that cannot complete payment.

The recovered Airwallex flow also requires migrations 0007 and 0008 plus approved stable SKUs and real inventory. The catalogue previously reported zero assigned SKUs and zero inventory records, so Airwallex cannot be declared operational or enabled merely by setting environment variables.

## Automated acceptance

- Store suite: 168/168 passed
- Airwallex authentication, amount, signature, replay and status-token tests: passed
- PayPal Sandbox create/capture/webhook tests: passed
- Cart duplicate-action and variant isolation tests: passed
- Loading/toast/badge and actual route wiring checks: passed
- TypeScript: passed
- Next.js Production Build: passed
- Credential scan: no real credentials found; one explicit unit-test fixture was identified
- Production database/order/inventory/payment writes: none

## Browser acceptance and screenshots

The administrator-enforced browser policy blocked automated access to both the Vercel Preview and `www.theseagulllabs.com`. It also blocked localhost. The restriction explicitly prohibited alternate browser surfaces or workarounds, so no compliant desktop/mobile screenshots could be captured in this run.

The following visual checks remain manual under Preview Authentication:

1. Product detail Add to Cart Loading and fixed success notification.
2. Quick Add on a single-variant product.
3. Rapid double click adds once.
4. A later deliberate click increases quantity.
5. Header badge and refresh persistence.
6. Quantity update and removal.
7. Mobile toast position and touch target.
8. Provider list after dedicated Sandbox configuration is supplied.
9. Cancellation and error presentation.

No HTTP 200 response is being used as evidence of interaction success.

## Safety and remaining blockers

- Production was not deployed or reconfigured.
- No historical order, inventory or payment was modified.
- No real payment was attempted.
- Airwallex merchant credentials were not modified.
- `PAYPAL_ENABLED` remains off.
- Airwallex Sandbox cannot be enabled until Preview migrations, approved SKUs, inventory and credentials are independently verified.
- Neither Airwallex nor PayPal has verified Live credentials in Vercel Production.
- Human desktop/mobile Preview acceptance remains required because browser automation is administratively blocked.

