# PayPal Sandbox Webhook Ingress Implementation Report

Date: 2026-11-14 (Asia/Shanghai)

## Scope

This change adds two isolated Sandbox-only services without changing the SGL Website Preview authentication, Production, Airwallex, or `PAYPAL_ENABLED`:

- `paypal-sandbox-webhook-ingress`: public API-only PayPal webhook receiver with no UI and no database access.
- `paypal-sandbox-ops`: token-protected Preview-only durable event store.

## Security controls

- PayPal environment is hard restricted to `sandbox`.
- PayPal signatures are verified with the official `POST /v1/notifications/verify-webhook-signature` API.
- Certificate URLs are restricted to PayPal Sandbox API hosts.
- Transmission timestamps must be within ten minutes.
- Request bodies are limited to 256 KB.
- Seven event types are allowlisted.
- Valid but unsupported events are acknowledged and ignored without an OPS write.
- Invalid signatures and incomplete PayPal headers are rejected before persistence.
- OPS requires an independent 256-bit bearer token and a matching `Idempotency-Key`.
- The Preview database table uses `event_id` as its primary key and records redelivery count.
- Logs contain only event type, status, latency and a truncated event ID hash. Payloads, tokens, email addresses and credentials are excluded.
- Public ingress has a bounded per-instance rate limiter and fails closed.

## Deployments

### Sandbox ingress

- Stable URL: `https://sgl-paypal-sandbox-ingress.vercel.app`
- Webhook URL: `https://sgl-paypal-sandbox-ingress.vercel.app/api/paypal/webhook`
- Deployment ID: `dpl_A3yBVVMgq9HFT7EchcCmqxAbfeFT`
- Deployment state: Ready
- Vercel Authentication: disabled only for this public API-only Sandbox project
- Anonymous invalid-signature test: HTTP 400

### Sandbox Preview OPS

- Stable URL: `https://sgl-paypal-sandbox-ops.vercel.app`
- Event URL: `https://sgl-paypal-sandbox-ops.vercel.app/api/paypal/events`
- Deployment ID: `dpl_9q6o5WWKeEEvbFsuDBpUupF8T3nJ`
- Deployment state: Ready
- Anonymous request test: HTTP 401
- Database connection: blocked pending explicit authorization to inject the existing Preview Neon `DATABASE_URL` into this isolated project

The SGL Website Preview continues to redirect anonymous requests to the Vercel SSO endpoint and retains `x-robots-tag: noindex`.

## PayPal Sandbox Webhook

- OAuth: HTTP 200
- Initial webhook list: HTTP 200, zero webhooks
- Create webhook: HTTP 201
- Post-create list: HTTP 200
- Registered webhooks: 1
- Matching endpoint: 1
- Registered event types: 7
- Webhook ID storage: `/Users/hanyue/.config/sgl/paypal-sandbox-webhook.env` with directory mode 0700 and file mode 0600

## Tests

- Ingress unit/security tests: 5/5 passed
- OPS unit/security tests: 3/3 passed
- Existing Website store regression tests: 145/145 passed
- JavaScript syntax checks: passed
- Git diff check: passed
- Secret scan: no committed credentials found

## Pending acceptance blockers

1. Preview Neon connection: the automatic approval system rejected transferring the Website Preview `DATABASE_URL` into the isolated OPS project without a more specific user authorization. The migration has not been executed and durable ACK has therefore not been exercised against a real database.
2. Sandbox Buyer: no PayPal Personal Sandbox Buyer credentials are available locally, and the PayPal Developer Dashboard remains unauthorized. A real Buyer approval/capture flow cannot be completed without a Sandbox Personal account email and password stored locally.

No Production configuration, Production data, Live PayPal credentials, Airwallex setting, or Website Preview SSO setting was changed.
