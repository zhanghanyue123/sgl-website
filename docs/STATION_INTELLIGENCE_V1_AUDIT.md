# Station Intelligence V1 — Production Data Audit and Preview Scope

Audit date: 2026-11-10 (Asia/Shanghai)

## Production authority

- Service: `sgl-station-os.service`
- Runtime: FastAPI/Uvicorn on server-local port 8099
- Source: `/opt/sgl-station-os`
- Website access model: Station connector projection → Website PostgreSQL → authenticated Admin BFF
- Browser access to port 8099: prohibited

No secret values, customer message bodies or payment credentials were read during this audit.

## Verified API and data coverage

| Domain | Existing API | Production evidence | V1 behavior |
|---|---|---:|---|
| Products | `GET /ops/products/list`, `POST /ops/products/upsert` | 1 product | Read projection only |
| Materials | `GET /ops/materials/list`, `POST /ops/materials/upsert` | 3 materials | Read projection only |
| Inventory | `GET /ops/inventory/status`, `GET /ops/inventory/ledger` | 3 materials, 3 ledger rows | Real values; missing remains Not Recorded |
| BOM | `GET /ops/bom/list`, `POST /ops/bom/upsert` | GET currently returns 404 due route order | Blocked; no BOM inference |
| Purchasing | suggestions/list/add endpoints | 1 should-buy suggestion, 0 purchase orders | Recommendation only |
| Suppliers | no independent API | supplier name embedded on materials | Not Connected for MOQ and supplier master data |
| Staff | list/upsert endpoints | 2 staff | Read projection only |
| Scheduling | week read/generate endpoints | 10 shifts for week of 2026-11-09 | Gap display only; generation disabled |
| Availability | week read/submit endpoints | 0 rows for week of 2026-11-09 | Not Recorded |
| Attendance | no independent API | none | Not Available |
| Camera | day summary/briefing endpoints | 2 anonymous summaries on 2026-05-20 | Evidence only; insufficient forecasting history |
| Sales/POS | daily ingest/read endpoints | latest audited daily file 2026-07-31 | Historical evidence; no independent POS CRUD |
| Weather | no Station OS API | none | Server-only Open-Meteo provider, explicit coordinates required |
| WeCom | existing reporting endpoints | existing infrastructure | No new V1 messages or schedules |

## Historical forecasting coverage

The read-only production audit found only three distinct Station sales dates: 2026-05-20 (50 orders), 2026-05-21 (18 orders), and 2026-07-31 (1 order). Anonymous camera history exists for one distinct date, 2026-05-20, with two time-bucket summaries.

This does not meet the minimum evidence threshold for product-by-hour demand forecasting or an accuracy backtest. The Dashboard therefore reports **Insufficient Data** and does not publish a forecast accuracy percentage. The deterministic forecast module requires at least four complete prior observations for the same weekday and hour to produce even a Low Confidence estimate. Weekly accuracy is withheld until at least seven forecast outcomes across four distinct business days exist.

## Privacy boundary

Camera analysis uses only anonymous visitor counts, time buckets and operational flags already held by Station OS. V1 has no face-recognition, identity-track or audio code. A production retention policy and access owner still need to be approved before longer history is collected.

## V1 decision boundary

The Preview dashboard is read-only. It does not publish schedules, change hours, adjust inventory, create purchase orders, contact suppliers, pay suppliers or modify POS transactions. Sparse evidence is never promoted into a forecast.

Workforce forecasting remains blocked until there are at least seven distinct anonymous footfall days aligned with sales history and staff availability. Replenishment purchase drafting remains blocked until reserved stock, inbound purchase quantities, supplier MOQ and BOM data are available.

The demand and preparation extension follows the same boundary:

- Next-business-day, 3-day and 7-day quantities require aligned hourly POS, anonymous footfall, target weather, calendar/events and business hours.
- Preparation uses `forecast + safety buffer - ready stock - in-progress stock`. Missing values remain Not Recorded and never become zero.
- Opening, morning, afternoon and evening batches additionally require shelf life, production loss, minimum batch, capacity, staff, preparation time and food-safety controls.
- Material requirements are calculated only for a confirmed SKU with a confirmed real BOM.
- Purchase recommendations require real current, reserved and inbound stock, safety stock, supplier, MOQ and lead time. A recommendation remains a draft requiring human approval.

## Required API work after Preview review

1. Fix the production `/ops/bom/list` static-route ordering conflict.
2. Add bounded historical footfall and sales aggregation rather than exposing raw camera records.
3. Define a Suppliers read model with MOQ and lead-time provenance.
4. Add reserved and inbound inventory fields or a bounded aggregate.
5. Define Attendance separately from Availability.
6. Add recommendation persistence and manager approval only after its RBAC, idempotency and audit contract is approved.
7. Add bounded product-by-hour POS history and anonymous-footfall aggregates for the next-day, 3-day and 7-day forecast windows.
8. Add store business-hours, holiday and event inputs plus target weather provenance.
9. Add finished-goods ready/in-progress quantities, shelf life, waste, batch, capacity and food-safety constraints.
10. Complete Website SKU initialization before enabling formal material or purchase recommendations.
11. Persist forecast outcomes, actual sales, waste and stockout events only after the outcome/audit retention contract is approved.

No new database or message queue is required for these changes. Existing Station OS data and `integration_outbox` remain authoritative.
