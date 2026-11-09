# SGL Unified Architecture Audit — 2026-11-09

## Executive findings

- Production Website and Fries are at `786dec39f0c96be3265665a328e4097c740c53c7`.
- The complete Admin/Agent/Station work exists in the `phase2f/fries-agent` worktree, but that tree contains many unrelated uncommitted changes and must not be deployed as a unit.
- `/station-os` returns 404 in Production because the route and its BFF were never included in the current Production source tree.
- Station OS is healthy on Tencent Cloud at `127.0.0.1:8099`, while public access remains separately blocked. Its operational data is primarily JSON files; `agent_ops.sqlite3` contains only Hello customers, tasks, integration events and audit records.
- The Station Admin connector is installed and scheduled every five minutes, but currently fails with an HTTP error because the Website Station agent endpoints are not present in Production.
- Retail has Tavily and mailbox configuration, but `ENABLE_SENDING=true` was observed. This conflicts with the approved human-review-only policy and is a P0 production configuration finding.
- Hello mailbox synchronization succeeds every five minutes and its Station connector is enabled.
- Fries UI and API are deployed, but Production chat is not operational because shared Redis rate limiting and a server-side LLM provider are not configured.
- The employee mini program is a real native WeChat project. It has employee identity binding, tasks, scheduling and attendance code, but still requires an AppID, CloudBase environment, cloud-function deployment and staging acceptance.

## Data ownership

| Domain | System of record | Admin access pattern |
| --- | --- | --- |
| Website products, SKU, orders, payments, refunds | Website PostgreSQL | Website Admin directly through server modules |
| Station products/menu, materials, inventory, BOM, purchases, staff, attendance, schedules | Station OS files/APIs pending database normalization | Station connector projection + BFF; writes return through bounded outbox commands |
| Retail shops, research and outreach drafts | Retail Agent | Read-only Agent Operations BFF; existing approval flow for drafts |
| Hello messages | Hello mailbox database | Redacted projection and Station customer/task IDs |
| Fries conversations, tickets and leads | Website PostgreSQL | Customer Service/Agent Operations BFF |
| Agent notifications | Existing WeCom infrastructure | Event-driven messages and weekly summaries; no second queue |

## Station OS capability matrix

| Capability | Storage | Read API | Write API | Production state |
| --- | --- | --- | --- | --- |
| Daily/POS sales summary | dated JSON | `/ops/daily/{date}` | ingest endpoints | Active, file-backed |
| Products/menu | `ops_products.json` | `/ops/products/list` | `/ops/products/upsert` | Implemented |
| Materials | `ops_materials.json` | `/ops/materials/list` | `/ops/materials/upsert` | Implemented |
| Inventory | materials + ledger JSON | status/ledger | consume endpoints | Implemented, high-risk writes |
| BOM/recipes | `ops_bom.json` | list/by product | upsert | Implemented |
| Purchasing | ledger JSON | list/suggestions | add | Implemented |
| Suppliers | embedded material fields | no dedicated API | no dedicated API | Missing normalized model/API |
| Staff | `ops_staff.json` | list | upsert | Implemented, duplicated route definitions in `main.py` |
| Availability | weekly JSON | weekly read | submit | Implemented, duplicated route definitions |
| Scheduling | weekly JSON | weekly read | generate | Implemented, duplicated route definitions |
| Attendance | no Station API found | none | none | Missing; mini program has separate CloudBase implementation |
| Customers/tasks | `agent_ops.sqlite3` | scoped Hello lookup | scoped task PATCH | Active for Hello only |
| Camera analytics | dated JSON | summary/briefing | summary ingest | Implemented; no camera feed connected |
| WeCom | webhook-based | none | multiple send endpoints | Implemented; requires notification-noise consolidation |

## Current Admin problems

1. Production only has the older commerce navigation and lacks Agent Operations and Station routes.
2. The Sprint worktree contains richer pages but mixes Website, Fries, Station and payment changes.
3. Station exists as both `/admin/station` and a standalone `/station-os` visual workspace, creating duplicate navigation.
4. Existing Station editing is limited to Hello customer/task projection; operational resources are shown read-only.
5. The connector intentionally exposes a bounded snapshot, but it currently cannot deliver it.
6. Existing roles do not exactly match the requested Owner/Admin/Operations/Sales/Content/Customer Support/Viewer/Employee model.

## Target navigation

- Overview
- Commerce
  - Products & SKU
  - Inventory (website sellable stock)
  - Orders
  - Shipping & Returns
  - Payments
- Station Operations
  - Dashboard
  - POS & Sales
  - Products & Menu
  - Inventory
  - BOM & Recipes
  - Purchasing
  - Suppliers
  - Staff
  - Attendance
  - Scheduling
  - Reports
  - Settings
- Agent Operations
  - Retail
  - Hello
  - Fries
  - Activity
  - Approvals
  - Errors
- Customers & CRM
- Content & Marketing
- Reports
- System
  - Settings
  - Audit

## Implementation order

1. Restore the Station route, scoped read BFF, connector endpoints and accurate Not Connected/Stale/Error states.
2. Repair connector delivery before enabling any write control.
3. Add resource-specific Station permissions and audited write commands one domain at a time.
4. Normalize suppliers and attendance behind reviewed Station APIs.
5. Consolidate Agent/CRM views using stable IDs without moving source records.
6. Validate and package the existing native employee mini program in a test CloudBase environment.

## Release boundary

This audit is implemented on `release/unified-admin-20261109`, based on the current Production commit. No Production database, Station service, DNS, Airwallex configuration or customer record is changed by this phase.
