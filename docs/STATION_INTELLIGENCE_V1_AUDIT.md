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

## Privacy boundary

Camera analysis uses only anonymous visitor counts, time buckets and operational flags already held by Station OS. V1 has no face-recognition, identity-track or audio code. A production retention policy and access owner still need to be approved before longer history is collected.

## V1 decision boundary

The Preview dashboard is read-only. It does not publish schedules, change hours, adjust inventory, create purchase orders, contact suppliers, pay suppliers or modify POS transactions. Sparse evidence is never promoted into a forecast.

Workforce forecasting remains blocked until there are at least seven distinct anonymous footfall days aligned with sales history and staff availability. Replenishment purchase drafting remains blocked until reserved stock, inbound purchase quantities, supplier MOQ and BOM data are available.

## Required API work after Preview review

1. Fix the production `/ops/bom/list` static-route ordering conflict.
2. Add bounded historical footfall and sales aggregation rather than exposing raw camera records.
3. Define a Suppliers read model with MOQ and lead-time provenance.
4. Add reserved and inbound inventory fields or a bounded aggregate.
5. Define Attendance separately from Availability.
6. Add recommendation persistence and manager approval only after its RBAC, idempotency and audit contract is approved.

No new database or message queue is required for these changes. Existing Station OS data and `integration_outbox` remain authoritative.
