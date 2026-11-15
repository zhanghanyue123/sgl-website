# PayPal Production OPS

This is a schema and service identity inside the existing Website Production database. It is not a second database.

The runtime identity has no direct table privileges. It may execute only four `paypal_ops` functions:

- register a PayPal order association;
- read the capture context for one PayPal order;
- persist one capture transition;
- persist one verified webhook event summary.

The service stores no customer email, address, name, full PayPal payload, access token, or merchant credential. Capture completion calls the existing transactional order-capture routine. Refund administration is not granted.

`PAYPAL_OPS_DATABASE_URL` and `PAYPAL_OPS_TOKEN` are server-only Production secrets. Both PayPal release gates remain disabled during deployment and non-transactional acceptance.

The migration uses its own registry to avoid colliding with pending Website migrations after `0013`. Apply it only after an encrypted Production backup. The rollback refuses to run when any PayPal business record exists.
