# SGL Fries Phase 6 Preview Report

## Scope

Fries now reads the Website commerce database through server-only BFF code. The browser never receives a database credential or Agent token. Only published products and active variants are returned.

## API and tool mapping

| Tool | Source | Authorization | Public result |
| --- | --- | --- | --- |
| `commerce_search_products` | `products`, localizations, variants, images, inventory | Same-origin + shared rate limit | Published catalogue, public price/link and availability label |
| `commerce_get_product` | Same catalogue tables | Same-origin + shared rate limit | One published product |
| `commerce_get_variant_stock` | `product_variants`, `inventory_levels` | Same-origin + shared rate limit | `Available`, `Out of Stock`, `Not Recorded` or `Stale`; no quantity |
| `commerce_get_shipping_options` | `shipping_regions` | Same-origin + shared rate limit | Configured region support; missing methods/cost/time remain `not_recorded` |
| `commerce_get_order_status` | `orders` | Verified customer session | Only the session customer's matching order |
| `commerce_get_tracking` | `orders`, `fulfillment_shipments` | Verified customer session | Only the session customer's shipment |
| `commerce_get_customer_addresses` | `customer_addresses` | Verified customer session | Only the session customer's masked address fields |
| `commerce_recommend_products` | Published catalogue + inventory | Same-origin + shared rate limit | Maximum four products; unavailable, stale and unrecorded stock is excluded |

Public entry: `POST /api/support/commerce`. Fries chat also automatically injects live recommendations, verified order/tracking/address results and configured shipping evidence into the bounded LLM context. Customer text remains untrusted and PII redaction remains active.

## Admin integration

`/admin/fries-commerce` is protected by the existing Admin session and `agents:read`. It shows tool, audience, outcome, entity reference and time. Raw queries, messages, email addresses and postal addresses are not stored in the activity table.

## Preview verification

- Preview deployment: `https://sgl-website-r462umk7e-zhanghanyue123s-projects.vercel.app`
- Deployment protection: Vercel Authentication enabled.
- Preview database: independent Neon `neondb`.
- Migrations applied: `0016_fries_contact_retry.sql`, `0017_fries_commerce_intelligence.sql`.
- Encrypted pre-migration backup: `/Users/hanyue/Documents/Codex/backups/fries-preview-pre-0016-20261113.dump.enc`.
- Backup SHA-256: `a95c4a4082f3fff3e7456b7aba78f3b40d36ef07a73ecd17e84b9dcb7a2e5b25`.
- Recovery key: `/Users/hanyue/.config/sgl/fries-preview-backup.key` with mode `0600`.
- Tests: TypeScript passed; 119/119 Node tests passed; webpack Production Build passed.

Preview started with zero products, variants, inventory and orders. A bounded synthetic fixture verified search, stock-state separation, recommendation filtering, verified-customer order/tracking access, cross-customer isolation, masked addresses and shipping unknown-state behavior. All synthetic product, customer and order rows were then removed and verified absent.

## Production release prerequisites

1. Verify Production migration registry includes the existing customer membership migration `0015_customer_membership_accounts.sql` with its original checksum.
2. Create and verify an encrypted Production database backup.
3. Apply only forward migrations `0016` and `0017` in one reviewed transaction.
4. Deploy the exact reviewed Fries release; do not change Airwallex, checkout, orders or payment behavior.
5. Verify published catalogue counts, inventory state mapping and customer-session ownership with read-only checks.
6. Verify Admin `agents:read` and denial for roles without it.
7. Keep email, Station and WeCom connectors marked unconfigured until their independent production credentials and endpoints pass acceptance.

Code rollback uses the previous Vercel Production deployment. Database rollback is forward-safe: the added retry columns and activity table may remain unused; no destructive down migration is required. If migration execution fails, the transaction rolls back in full and the existing deployment remains active.
