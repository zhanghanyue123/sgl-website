import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseStationCommand, parseStationSnapshot, StationAdminInputError } from "../lib/integrations/station-admin";
import { agentScopes } from "../lib/agent/policy";
import { hasPermission } from "../lib/admin/permissions";

const customerId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";

test("Station snapshot is bounded, typed and customer-linked", () => {
  const operations = { daily: null, inventory: {}, inventoryLedger: {}, purchaseSuggestions: {}, staff: {}, availability: {}, schedule: {}, products: {}, materials: {}, bom: {}, purchases: {}, camera: {}, miniCatalog: {}, miniOrders: {}, miniSales: {} };
  const snapshot = parseStationSnapshot({ version: 1, generatedAt: "2026-11-09T01:00:00Z", customers: [{ id: customerId, email: "customer@example.com", name: "Customer", source: "hello_email", lastContactAt: "2026-11-09T00:59:00Z", status: "active" }], tasks: [{ id: taskId, customerId, source: "hello_reception", type: "customer_followup", title: "Follow up", summary: "Reply required", priority: "high", status: "open", createdAt: "2026-11-09T01:00:00Z", dueAt: null, completedAt: null }], operations });
  assert.equal(snapshot.customers.length, 1);
  assert.equal(snapshot.tasks[0].customerId, customerId);
  assert.throws(() => parseStationSnapshot({ ...snapshot, tasks: [{ ...snapshot.tasks[0], customerId: "33333333-3333-4333-8333-333333333333" }] }), StationAdminInputError);
});

test("Station commands permit only bounded customer and task edits", () => {
  assert.deepEqual(parseStationCommand({ type: "station.customer.update", entityId: customerId, idempotencyKey: "customer-update-1", changes: { name: "Updated", status: "prospect" } }).changes, { name: "Updated", status: "prospect" });
  assert.equal(parseStationCommand({ type: "station.task.update", entityId: taskId, idempotencyKey: "task-update-1", changes: { status: "completed", priority: "normal", dueAt: null } }).changes.status, "completed");
  assert.throws(() => parseStationCommand({ type: "station.task.update", entityId: taskId, idempotencyKey: "task-update-2", changes: { summary: "replace customer content" } }), StationAdminInputError);
});

test("Station Admin uses scoped UI and connector permissions", async () => {
  assert.equal(hasPermission("owner", "station:inventory:write"), true);
  assert.equal(hasPermission("support", "station:inventory:write"), false);
  assert.equal(hasPermission("viewer", "station:read"), true);
  assert.ok(agentScopes.includes("station-commands:read"));
  assert.ok(agentScopes.includes("station-commands:ack"));
  assert.ok(agentScopes.includes("station-snapshot:write"));
  const adminRoute = await readFile(new URL("../app/api/admin/station/route.ts", import.meta.url), "utf8");
  const connectorRoute = await readFile(new URL("../app/api/agent/v1/station/commands/route.ts", import.meta.url), "utf8");
  assert.match(adminRoute, /requireAdmin\(request, "station:read"\)/);
  assert.doesNotMatch(adminRoute, /export async function POST/);
  assert.match(connectorRoute, /requireAgent\(request, "station-commands:read"\)/);
  assert.match(connectorRoute, /requireAgent\(request, "station-commands:ack"\)/);
});

test("Station projection reuses integration_outbox without exposing port 8099", async () => {
  const migration = await readFile(new URL("../db/migrations/0013_station_admin_projection.sql", import.meta.url), "utf8");
  const source = await readFile(new URL("../lib/integrations/station-admin.ts", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE station_admin_snapshots/);
  assert.match(migration, /INSERT INTO stores\(id,organization_id,slug,name\)/);
  assert.doesNotMatch(migration, /CREATE TABLE station_admin_commands/);
  assert.match(source, /INSERT INTO integration_outbox/);
  assert.match(source, /station_projection_unavailable/);
  assert.doesNotMatch(source, /8099|SGL_STATION.*TOKEN|fetch\(/);
});

test("Station connector exposes only bounded mini-program sync mirrors", async () => {
  const connector = await readFile(new URL("../integrations/station-os/admin_connector.py", import.meta.url), "utf8");
  assert.match(connector, /SGL_STATION_DATA_DIR/);
  assert.match(connector, /path\.stat\(\)\.st_size > 500_000/);
  for (const mirror of ["products.json", "orders.json", "daily_sales.json"]) assert.match(connector, new RegExp(mirror.replace(".", "\\.")));
  assert.doesNotMatch(connector, /glob\(|rglob\(|os\.walk/);
});

test("Station OS uses the authenticated unified Admin workspace", async () => {
  const page = await readFile(new URL("../app/station-os/page.tsx", import.meta.url), "utf8");
  const adminPage = await readFile(new URL("../app/admin/(dashboard)/station/page.tsx", import.meta.url), "utf8");
  const workspace = await readFile(new URL("../components/station-os/StationOSWorkspace.tsx", import.meta.url), "utf8");
  assert.match(page, /redirect\("\/admin\/station"\)/);
  assert.match(adminPage, /currentAdminWithPermission\("station:read"\)/);
  assert.match(adminPage, /getStationAdminView/);
  assert.match(adminPage, /error=\{view\.error\}/);
  assert.match(adminPage, /writable=\{false\}/);
  assert.match(workspace, /Station OS Admin/);
  for (const section of ["Store Dashboard", "POS & Sales", "Products & Menu", "Inventory", "BOM & Recipes", "Purchasing", "Suppliers", "Staff", "Attendance", "Scheduling", "Reports", "Settings"]) assert.match(workspace, new RegExp(section.replace(/[&]/g, "\\&")));
  for (const state of ["Read Only", "Not Available", "Error", "Not Connected", "Stale", "Connected"]) assert.match(workspace, new RegExp(state));
  assert.match(workspace, /浏览器不接收 Station Token/);
  assert.doesNotMatch(workspace, /StationOperationsEditor/);
});

test("Station module URLs resolve through the Station Admin workspace", async () => {
  const source = await readFile(
    new URL("../app/admin/(dashboard)/station/[section]/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /inventory:\s*"inventory"/);
  assert.match(source, /bom:\s*"bom-recipes"/);
  assert.match(source, /redirect\(`\/admin\/station#/);
  assert.match(source, /notFound\(\)/);
});

test("Unified Admin navigation separates Website Admin and Station OS Admin", async () => {
  const nav = await readFile(new URL("../components/admin/AdminNav.tsx", import.meta.url), "utf8");
  assert.match(nav, /Website Admin/);
  assert.match(nav, /Station OS Admin/);
  assert.match(nav, /Products & SKU/);
  assert.match(nav, /Station Operations/);
  assert.match(nav, /\/admin\/station/);
});
