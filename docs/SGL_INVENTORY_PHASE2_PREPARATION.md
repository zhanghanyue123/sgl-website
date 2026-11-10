# SGL Inventory Phase 2 — SKU Standardization & Stock Initialization Preparation

Date: 2026-11-10
Source commit: `bd2eb05932dda6dad6ae3b685c2465592e4e010b`
Production access: authenticated read-only Website Admin BFF only

## Verified production state

- Catalogue products: **44**
- Storefront-visible products: **31**
- Product/variant rows: **79**
- Assigned SKUs: **0**
- Inventory records: **0**
- Stock movements: **0**
- Product/variant database IDs exposed by BFF: **0 / 0**
- Inventory updated at: **Not recorded**

All 79 rows currently come from the Website code catalogue. They are not yet backed by `products` / `product_variants` records in the Production database. Existing Product IDs therefore do not exist to change. The preserved identifiers are the product slug and `catalogue:<slug>:<variant-index>` key.

## SKU rule

`SGL-{CATEGORY}-{FIXED_PRODUCT_CODE}-V{HISTORICAL_VARIANT_NUMBER}`

- Category codes: `BAG`, `WEA`, `BIK`, `ACC`, `STN`.
- Product codes are fixed once in the mapping; they are not regenerated from mutable titles.
- `Vxx` is derived from the existing zero-based catalogue variant key plus one.
- Every colour/size/style row has its own SKU.
- Price, availability, and public status are excluded from SKU identity.
- All 79 proposed SKUs are uppercase, format-valid, and unique.
- Deterministic product and variant UUIDs are shown as **planned**, not existing or written IDs. They match the existing catalogue import algorithm and require explicit approval before creation.

Complete mapping: `docs/SGL_INVENTORY_PHASE2_SKU_MAPPING.csv`

## Warehouse mapping

The schema defines one logical warehouse:

- ID: `00000000-0000-4000-8000-000000000003`
- Code: `ONLINE`
- Name: `Online Fulfillment`
- Logical store: `SGL Online`
- Schema owner: `The Seagull Labs` organization
- Physical address and physical stock owner: not recorded by the current BFF
- Production existence: cannot be confirmed through the current read-only Inventory BFF because there are no inventory rows and no warehouse-list endpoint

Do not create another warehouse. Verify this ID in Production through a narrowly scoped warehouse read endpoint or DBA read-only query before initialization.

Warehouse file: `docs/SGL_INVENTORY_PHASE2_WAREHOUSE_MAPPING.csv`

## Stocktake template

The template contains all 79 proposed SKU rows and leaves every warehouse and quantity field blank. Small Bags `2500` is not entered anywhere as inventory.

Template: `docs/SGL_INVENTORY_PHASE2_STOCKTAKE_TEMPLATE.csv`

Validation required for each row:

1. `Physical Quantity >= 0`
2. `Damaged Quantity >= 0`
3. `Damaged Quantity <= Physical Quantity`
4. `Available Quantity = Physical Quantity - Damaged Quantity` after the business definition is approved
5. Count date and verifier are mandatory
6. Warehouse must match a verified existing warehouse

## Items requiring human confirmation

1. Approve all 79 proposed SKUs.
2. Approve the deterministic Product/Variant IDs because Production currently has no catalogue database IDs.
3. Confirm whether archived products should receive database records and opening balances.
4. Confirm treatment of the 13 catalogue products that are not currently storefront-visible.
5. Review 5 zero-price rows; no inventory activation should occur until their sale status is clear.
6. Review the malformed/ambiguous `Chrissy Ti` legacy option row `catalogue:chrissy1:6`.
7. Normalize generic `Option:` labels without changing the historical row key.
8. Verify the existing warehouse ID, physical location, and physical stock ownership.
9. Confirm treatment of damaged stock. The current `inventory_levels` model has no damaged bucket and calculates `available = on_hand - reserved`.
10. Supply physical counts, damaged counts, count dates, and verifier identities.
11. Approve a separate Production write window and backup before any catalogue or inventory write.

Zero-price rows: bike-cover-l, copy-of-overshoes-oversocks, toiletry-bag, tote-bag-1, shoe-sack-fot-travel.
Archived mapping rows: 12.

## Controlled initialization plan

### Gate A — catalogue identity approval

- Review and sign off the CSV mapping.
- Use a catalogue-only importer that creates `products`, localizations, images, and `product_variants` with the approved SKU and deterministic IDs.
- Do **not** run `scripts/db-seed-catalog.ts` as currently written: it also creates zero inventory records and `seed` movements, which would incorrectly turn `Not Recorded` into recorded zero stock.
- Keep public prices and slugs unchanged.
- Re-read all 44 products and 79 variants and compare IDs/SKUs with the approved manifest.

### Gate B — physical count approval

- Validate the completed stocktake template offline.
- Reject unknown SKUs, duplicate SKUs, duplicate warehouse/SKU pairs, negative quantities, damaged quantities above physical quantities, missing count dates, and missing verifiers.
- Resolve damaged-stock storage before writes. Recommended minimal forward model: record damaged quantity with the stocktake/audit evidence while initializing sellable `on_hand` from approved available quantity. Any schema change requires separate migration review.

### Gate C — Production initialization (separate approval)

- Create an encrypted database backup and verify restore metadata.
- Use one transaction per approved stocktake batch with a stable batch id.
- Lock each variant/warehouse pair.
- Create the inventory level only when absent; abort if an existing level conflicts with the approved opening state.
- Record movement type `seed`, `reference_type='opening_balance'`, and stable `reference_id='<batch-id>:<sku>'`.
- Use the existing unique movement reference constraint for idempotency.
- Write `inventory_stocktakes` and `audit_logs` with operator, count time, source manifest hash, and reason.
- Enforce non-negative stock and `on_hand >= reserved`.
- Re-read every row after commit and reconcile totals against the signed template.
- Invalidate Admin Inventory caches only after a successful commit.

### Rollback

Before any orders reserve the newly initialized stock, rollback can reverse the approved batch in a new audited transaction using the same manifest evidence. Once an SKU has reservations or sales, do not delete history or inventory rows; use audited correction movements and preserve the original opening balance.

## No Production changes

This preparation made no Product, SKU, warehouse, inventory, movement, order, payment, or Airwallex write.
