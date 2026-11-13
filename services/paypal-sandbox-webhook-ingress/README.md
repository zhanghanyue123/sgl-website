# PayPal Sandbox Webhook Ingress

Public, API-only ingress for PayPal Sandbox webhook delivery. It has no UI and no database access. It verifies PayPal signatures through the official Sandbox API before forwarding allowlisted events to the token-protected Preview OPS service.

Required server-only variables: `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PREVIEW_OPS_URL`, and `PREVIEW_OPS_TOKEN`.

The ingress must never receive Live credentials or Production OPS/database credentials.
