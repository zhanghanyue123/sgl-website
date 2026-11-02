# SGL 2.0 — Phase 2 Product and Inventory Administration

Phase 2 adds a private production administration surface without changing the public catalogue design or slugs. It is database-backed and does not include deployment, order processing, fulfilment, or payment changes.

## Delivered

- PostgreSQL schema and repeatable migration runner for administrators, sessions, categories, products, five localized content records, images, variants, SKU values, inventory, movements, settings, and audit logs.
- Idempotent import of the preserved 40-product catalogue. Existing slugs and original handles are retained. Blank SKU values remain `NULL`; the importer never invents operational identifiers.
- Product creation and editing, including draft, published, unpublished, and archived states; prices; images; localized titles, descriptions and SEO fields; variants and SKU values.
- Inventory views for on-hand, reserved, available, low-stock and sold-out states. Adjustments are atomic, cannot produce negative stock, require a reason, and append a movement plus audit record in the same transaction.
- Twelve-hour secure administrator sessions, password lockout, role-based permissions, same-origin mutation checks, and an audit trail.
- Stable navigation positions for Orders, Shipping, Customers and Payments. They remain inactive until their planned phases.

## Roles

`owner`, `admin`, `editor`, `inventory`, `fulfillment`, `support`, and `viewer` are enforced on the server. Navigation visibility is only a convenience; every API route repeats the permission check.

## Activation

1. Provision PostgreSQL and copy `.env.example` to the deployment environment.
2. Set `DATABASE_URL`, `DATABASE_SSL`, `SITE_URL`, and a long random `ADMIN_AUDIT_SECRET`.
3. Run `npm run db:migrate`.
4. Run `npm run db:seed` once. Re-running it skips existing legacy products.
5. Set temporary `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and `ADMIN_ROLE`, then run `npm run admin:create`. Remove those temporary values afterward.
6. Open `/admin/login` and validate the catalogue before any future release.

There are no default administrator credentials. A real database URL and initial owner credentials are external activation inputs, so the migration and live admin login cannot be exercised in this repository alone.

## Verification

- `npm run test:store`
- `npm run build`
- `git diff --check`

The automated suite checks permission boundaries, the password verifier, same-origin policy, product/localization validation, immutable update slugs, inventory validation, the non-negative inventory SQL contract, movement/audit tables, and preserved catalogue identifiers.
