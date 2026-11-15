# PayPal Production OPS

This is a schema and service identity inside the existing Website Production database. It is not a second database.

The runtime identity has no direct table privileges. It may execute only the reviewed `paypal_ops` functions for:

- register a PayPal order association;
- read the capture context for one PayPal order;
- persist one capture transition with monotonic state advancement;
- persist one verified webhook event summary;
- apply verified refund and reversal events through the webhook dispatcher.

The service stores no customer email, address, name, full PayPal payload, access token, or merchant credential. Capture completion calls the existing transactional order-capture routine. If payment is confirmed after the inventory reservation expires, the payment is preserved, the order enters `payment_review`, and the existing reconciliation/outbox path receives a deduplicated issue. The runtime cannot initiate a refund; it can only record PayPal-signed refund and reversal events.

`PAYPAL_OPS_DATABASE_URL` and `PAYPAL_OPS_TOKEN` are server-only Production secrets. Both PayPal release gates remain disabled during deployment and non-transactional acceptance.

The migrations use their own registry to avoid colliding with pending Website migrations after `0013`. `0001` remains immutable; `0002_paypal_payment_reliability.sql` is a forward-only reliability migration. Apply it in Preview with `apply-reliability-preview-migration.js`, which requires an explicit Preview target and database-name match. Production execution is outside this phase and requires a separate encrypted backup and approval.
