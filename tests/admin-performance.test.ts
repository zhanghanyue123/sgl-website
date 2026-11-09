import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { hasPermission } from "../lib/admin/permissions";
import { adminSourceTimeoutMs } from "../lib/admin/performance";
import { safeOrigin } from "../lib/admin/security";
import { loadUnifiedOverviewUncached, normalizeOverviewProjection } from "../lib/admin/unified-overview";

test("Admin read caches are bounded, scoped, and invalidated after relevant writes", async () => {
  const overview = await readFile(new URL("../lib/admin/unified-overview.ts", import.meta.url), "utf8");
  const agents = await readFile(new URL("../lib/admin/agent-operations.ts", import.meta.url), "utf8");
  const station = await readFile(new URL("../lib/integrations/station-admin.ts", import.meta.url), "utf8");
  const writes = await Promise.all([
    readFile(new URL("../app/api/admin/products/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/products/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/inventory/adjust/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/agent-actions/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/agent/v1/operations/snapshot/route.ts", import.meta.url), "utf8")
  ]);
  assert.match(overview, /revalidate:\s*30/);
  assert.match(overview, /tags:\s*\["admin-overview"\]/);
  assert.match(agents, /revalidate:\s*30/);
  assert.match(agents, /tags:\s*\["admin-agent-operations"\]/);
  assert.match(station, /\(organizationId: string, storeId: string\)/);
  assert.match(station, /revalidate:\s*30/);
  assert.ok(writes.some((source) => source.includes('revalidateTag("admin-overview", { expire: 0 })')));
  assert.ok(writes.some((source) => source.includes('revalidateTag("admin-agent-operations", { expire: 0 })')));
});

test("RBAC is evaluated before cached business read models and roles stay isolated", async () => {
  const overviewRoute = await readFile(new URL("../app/api/admin/unified/overview/route.ts", import.meta.url), "utf8");
  const agentsRoute = await readFile(new URL("../app/api/admin/unified/agents/route.ts", import.meta.url), "utf8");
  const stationRoute = await readFile(new URL("../app/api/admin/station/route.ts", import.meta.url), "utf8");
  assert.ok(overviewRoute.indexOf('requireAdmin(request, "dashboard:read")') < overviewRoute.indexOf("getUnifiedOverview()"));
  assert.ok(agentsRoute.indexOf('requireAdmin(request, "agents:read")') < agentsRoute.indexOf("getAgentOperations()"));
  assert.ok(stationRoute.indexOf('requireAdmin(request, "station:read")') < stationRoute.indexOf("getStationAdminView(scope)"));
  assert.equal(hasPermission("owner", "agents:read"), true);
  assert.equal(hasPermission("admin", "agents:read"), true);
  assert.equal(hasPermission("inventory", "agents:read"), false);
  assert.equal(hasPermission("viewer", "agents:read"), false);
  assert.equal(hasPermission("inventory", "station:read"), true);
  assert.equal(hasPermission("viewer", "station:read"), true);
});

test("session lookup is request-memoized without caching session data in shared read models", async () => {
  const current = await readFile(new URL("../lib/admin/current.ts", import.meta.url), "utf8");
  const overview = await readFile(new URL("../lib/admin/unified-overview.ts", import.meta.url), "utf8");
  const agents = await readFile(new URL("../lib/admin/agent-operations.ts", import.meta.url), "utf8");
  assert.match(current, /currentAdminSession = cache\(/);
  assert.doesNotMatch(overview, /ADMIN_COOKIE|currentAdminSession|password_hash|token_hash/);
  assert.doesNotMatch(agents, /ADMIN_COOKIE|currentAdminSession|password_hash|token_hash/);
});

test("Station, Retail, and Hello failures remain independently represented", async () => {
  const previousFetch = globalThis.fetch;
  const previous = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith("SGL_") || key === "DATABASE_URL"));
  delete process.env.DATABASE_URL;
  process.env.SGL_STATION_OVERVIEW_URL = "https://station.test/overview";
  process.env.SGL_STATION_OVERVIEW_TOKEN = "station-test-token";
  process.env.SGL_RETAIL_OVERVIEW_URL = "https://retail.test/overview";
  process.env.SGL_RETAIL_OVERVIEW_TOKEN = "retail-test-token";
  process.env.SGL_HELLO_OVERVIEW_URL = "https://hello.test/overview";
  process.env.SGL_HELLO_OVERVIEW_TOKEN = "hello-test-token";
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("station.test")) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      const error = new Error("timed out"); error.name = "TimeoutError"; throw error;
    }
    if (url.includes("retail.test")) return new Response(null, { status: 503 });
    return Response.json({ schemaVersion: "sgl.admin.overview.v1", source: "hello", status: "ok", updatedAt: new Date().toISOString(), counts: { customers: 2 } });
  };
  try {
    const result = await loadUnifiedOverviewUncached();
    const bySource = Object.fromEntries(result.agents.map((source) => [source.source, source]));
    assert.equal(bySource.station.status, "error");
    assert.match(bySource.station.detail, /timed out/);
    assert.equal(bySource.retail.status, "error");
    assert.match(bySource.retail.detail, /HTTP 503/);
    assert.equal(bySource.hello.status, "ok");
  } finally {
    globalThis.fetch = previousFetch;
    for (const key of Object.keys(process.env).filter((key) => key.startsWith("SGL_") || key === "DATABASE_URL")) delete process.env[key];
    Object.assign(process.env, previous);
  }
});

test("stale source timestamps are explicit", () => {
  const projection = normalizeOverviewProjection("hello", "Hello Reception", {
    schemaVersion: "sgl.admin.overview.v1", source: "hello", status: "ok",
    updatedAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(), counts: { customers: 1 }
  });
  assert.equal(projection.health.status, "stale");
  assert.match(projection.health.detail, /older than 15 minutes/);
});

test("external source fallback is bounded for cold-cache isolation", () => {
  assert.equal(adminSourceTimeoutMs(undefined), 750);
  assert.equal(adminSourceTimeoutMs("100"), 250);
  assert.equal(adminSourceTimeoutMs("9000"), 3000);
  assert.equal(adminSourceTimeoutMs("invalid"), 750);
});

test("Preview accepts only its own origin in addition to the configured production origin", () => {
  const oldSite = process.env.SITE_URL; const oldVercel = process.env.VERCEL_ENV;
  process.env.SITE_URL = "https://admin.example.com";
  process.env.VERCEL_ENV = "preview";
  assert.equal(safeOrigin(new Request("https://preview.example.com/api/admin", { headers: { origin: "https://preview.example.com" } })), true);
  assert.equal(safeOrigin(new Request("https://preview.example.com/api/admin", { headers: { origin: "https://evil.example.com" } })), false);
  process.env.VERCEL_ENV = "production";
  assert.equal(safeOrigin(new Request("https://preview.example.com/api/admin", { headers: { origin: "https://preview.example.com" } })), false);
  if (oldSite === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = oldSite;
  if (oldVercel === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = oldVercel;
});
