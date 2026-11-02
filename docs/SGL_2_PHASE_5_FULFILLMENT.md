# SGL 2.0 — Phase 5 Manual Fulfillment

Status: code complete. Production activation requires the database migration and a notification provider.

## Delivered

- Paid, unfulfilled order queue with customer and shipping-address review.
- Required address confirmation before dispatch.
- Free-text carrier and tracking number, plus optional safe HTTPS tracking URL.
- Manual mark-shipped, delivered and parcel-cancelled actions.
- Shipment and fulfillment event history.
- Order timeline and audit-log entries for every shipment mutation.
- Localized notification outbox records. A notification is only marked accepted or delivered after a future provider confirms it.
- Empty, disabled shipping-region configuration so no unsupported destination, fee, tax or estimate is invented.

## Activation

1. Run npm run db:migrate with the production database.
2. Configure real shipping regions and commercial rules in a later settings interface.
3. Connect an approved email provider to notification_outbox and record its accepted/delivered response.

Automated tests cover shipment validation, HTTPS tracking links, address confirmation and the persistence contract. No parcel or customer message was sent.

Next: Phase 6 provides scoped, logged Retail Agent APIs with explicit approval controls for high-impact actions.
