# SGL Station OS Admin Release

## Boundaries

Website Admin is the authenticated UI and command queue. Station OS FastAPI on Tencent remains the store operations system of record. Browsers never reach port 8099 and never receive a Station credential.

Flow: Admin RBAC → `/api/admin/station` → `integration_outbox` → store-scoped connector → `127.0.0.1:8099` → read-back verification → ACK.

## Real APIs reused

- Products/Menu: list and upsert
- Materials/Inventory: list, status and upsert
- BOM/Recipes: list and upsert
- Purchasing: list and add
- Staff: list and upsert
- Availability: weekly read and submit
- Scheduling: weekly read and generate
- Reports: daily projection
- Customer and follow-up task updates through the existing Station SQLite model

Purchases and schedule generation require `station:critical`, a confirmation checkbox and audit/outbox evidence. A queued command is not displayed as saved until the connector reads the entity back from Station and ACKs it.

## Confirmed API gaps

- POS transaction/refund mutation
- independent Supplier CRUD
- FastAPI attendance API (attendance currently belongs to CloudBase operations)
- store announcements
- settings CRUD
- complete wage calculation API

The UI labels these as unavailable or derived. It does not create fake records or active controls.

## Preview

The Vercel Preview is protected by Vercel Authentication. Station writes remain disabled until migration 0012 is applied to the isolated Preview database and a store-scoped test connector is configured. Production Station credentials must not be injected into Preview.

## Production sequence

1. Encrypted backup of the production Website database and Station connector files.
2. Apply and verify migration `0012_station_admin_projection.sql` to the Website production database.
3. Create an Agent client scoped to the SGL organization and Shanghai Station store with only `station-snapshot:write`, `station-commands:read`, `station-commands:ack`.
4. Create `/etc/sgl-station-admin-connector.env` from the example, owner root and mode 0600.
5. Install connector files and systemd units without changing 8099 firewall rules.
6. Run one connector one-shot, verify snapshot, then enqueue one low-risk product/staff test change and confirm read-back + ACK.
7. Enable the timer only after browser CRUD acceptance.
8. Promote the clean release deployment only after user approval.

## Rollback

Disable the connector timer, stop the connector one-shot, restore connector files from backup, and promote the previous Vercel deployment. Migration 0012 adds projection/lease metadata and can remain unused; do not drop it during an incident. No Station JSON or SQLite data is replaced by the Website deployment.
