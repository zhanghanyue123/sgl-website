# PayPal Sandbox Preview OPS

Minimal, API-only persistence service for verified PayPal Sandbox webhook events. It accepts only allowlisted events, requires a dedicated bearer token and writes only to Preview Neon.

Required server-only variables: `DEPLOYMENT_ENVIRONMENT=preview`, `PAYPAL_ENV=sandbox`, `DATABASE_URL`, and `PREVIEW_OPS_TOKEN`.

This service must never use Production credentials or Live PayPal configuration.
