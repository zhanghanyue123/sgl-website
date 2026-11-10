import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildStationIntelligence, getStationWeather } from "../lib/station-intelligence/service";
import type { StationSnapshot } from "../lib/integrations/station-admin";

function snapshot(overrides: Partial<StationSnapshot["operations"]> = {}): StationSnapshot {
  return {
    version: 1,
    generatedAt: "2026-11-10T08:00:00.000Z",
    customers: [],
    tasks: [],
    operations: {
      daily: null,
      inventory: { materials: [
        { materialId: "beans", name: "Coffee beans", currentStock: 0, safetyStock: 2, avgDailyUsage: 1, unit: "kg", supplier: "Recorded supplier", leadTimeDays: 4, updatedAt: "2026-11-10T07:00:00.000Z" },
        { materialId: "milk", name: "Milk", safetyStock: 5, avgDailyUsage: 2, unit: "L" },
      ] },
      inventoryLedger: { ledger: [] },
      purchaseSuggestions: { mustBuy: [{ materialId: "beans", suggestedPurchaseQty: 8, daysRemaining: 0 }], shouldBuy: [], watch: [], doNotBuy: [] },
      staff: { staff: [{ staffId: "staff-1", active: true }] },
      availability: { availability: [] },
      schedule: { summary: { uncoveredCount: 1 }, shifts: [{ date: "2026-11-11", start: "09:00", end: "11:00", status: "assigned", staffId: "staff-1" }] },
      products: { products: [] },
      materials: { materials: [] },
      bom: null,
      purchases: { purchases: [] },
      camera: { date: "2026-11-10", records: [{ date: "2026-11-10", time: "09:15", estimatedVisitors: 12 }] },
      miniCatalog: null,
      miniOrders: null,
      miniSales: null,
      ...overrides,
    },
  };
}

test("Station Intelligence distinguishes zero stock from missing stock", async () => {
  const view = await buildStationIntelligence({
    connected: true,
    stale: false,
    generatedAt: "2026-11-10T08:00:00.000Z",
    receivedAt: "2026-11-10T08:01:00.000Z",
    snapshot: snapshot(),
    weather: { status: "not_connected", location: "Shanghai Station", temperatureC: null, precipitationMm: null, windKph: null, alert: null, observedAt: null, source: "test" },
  });
  const beans = view.replenishment.recommendations.find((item) => item.materialId === "beans")!;
  const milk = view.replenishment.recommendations.find((item) => item.materialId === "milk")!;
  assert.equal(beans.currentStock, 0);
  assert.equal(beans.suggestedQuantity, 8);
  assert.equal(milk.currentStock, null);
  assert.ok(milk.blockers.includes("Current stock is not recorded"));
  assert.equal(view.overview.inventoryRisks, 1);
});

test("sparse anonymous camera data is not promoted to a forecast", async () => {
  const view = await buildStationIntelligence({
    connected: true,
    stale: false,
    generatedAt: "2026-11-10T08:00:00.000Z",
    receivedAt: "2026-11-10T08:01:00.000Z",
    snapshot: snapshot(),
    weather: { status: "available", location: "Shanghai", temperatureC: 20, precipitationMm: 0, windKph: 8, alert: null, observedAt: "2026-11-10T08:00:00", source: "Open-Meteo" },
  });
  assert.equal(view.overview.forecastFootfall, null);
  assert.equal(view.workforce.hourly[0].actualFootfall, 12);
  assert.equal(view.workforce.hourly[0].forecastFootfall, null);
  assert.equal(view.workforce.backtest.status, "blocked");
  assert.equal(view.workforce.draftScheduleAllowed, false);
  assert.equal(view.demand.status, "blocked");
  assert.ok(view.demand.forecasts.every((item) => item.forecastQuantity === null && item.confidence === "Insufficient Data"));
  assert.equal(view.forecastAccuracy.status, "Insufficient Data");
  assert.equal(view.forecastAccuracy.weeks.length, 0);
});

test("preparation and material planning do not coerce missing operational data to zero", async () => {
  const view = await buildStationIntelligence({
    connected: true,
    stale: false,
    generatedAt: "2026-11-10T08:00:00.000Z",
    receivedAt: "2026-11-10T08:01:00.000Z",
    snapshot: snapshot({ products: { products: [{ productId: "coffee", name: "Coffee" }] } }),
    weather: { status: "not_connected", location: "Station", temperatureC: null, precipitationMm: null, windKph: null, alert: null, observedAt: null, source: "test" },
  });
  assert.equal(view.preparation.status, "blocked");
  assert.equal(view.preparation.plans.length, 1);
  assert.equal(view.preparation.plans[0].executionAllowed, false);
  assert.equal(view.preparation.plans[0].netPreparationRequirement, null);
  assert.equal(view.materialRequirements.plan, null);
  assert.deepEqual(view.materialRequirements.blockedProducts, [{ productId: "coffee", reason: "Forecast quantity, confirmed SKU and confirmed BOM are required" }]);
  assert.ok(view.dailyBriefing.every((item) => item.status !== "available" || item.label === "Staffing"));
});

test("purchase drafting stays blocked without MOQ, reserved and inbound stock", async () => {
  const view = await buildStationIntelligence({ connected: true, stale: false, generatedAt: null, receivedAt: null, snapshot: snapshot(), weather: { status: "not_connected", location: "Station", temperatureC: null, precipitationMm: null, windKph: null, alert: null, observedAt: null, source: "test" } });
  assert.equal(view.replenishment.purchaseDraftAllowed, false);
  assert.ok(view.replenishment.recommendations.every((item) => item.approvalState === "blocked"));
  assert.ok(view.replenishment.recommendations[0].blockers.some((item) => item.includes("MOQ")));
});

test("weather provider requires explicit server-side coordinates", async () => {
  let called = false;
  const fetcher = (async () => { called = true; throw new Error("should not run"); }) as typeof fetch;
  const weather = await getStationWeather(fetcher, {} as NodeJS.ProcessEnv);
  assert.equal(weather.status, "not_connected");
  assert.equal(called, false);
});

test("weather provider maps verified Open-Meteo values and alerts", async () => {
  const fetcher = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "api.open-meteo.com");
    return new Response(JSON.stringify({ current: { time: "2026-11-10T09:00", temperature_2m: 18.5, precipitation: 12, wind_speed_10m: 20 } }), { status: 200 });
  }) as typeof fetch;
  const weather = await getStationWeather(fetcher, { SGL_STATION_WEATHER_LATITUDE: "31.2", SGL_STATION_WEATHER_LONGITUDE: "121.5", SGL_STATION_WEATHER_LABEL: "Configured Station" } as unknown as NodeJS.ProcessEnv);
  assert.equal(weather.status, "available");
  assert.equal(weather.temperatureC, 18.5);
  assert.match(weather.alert || "", /rainfall/i);
});

test("Station Intelligence page and BFF use existing station RBAC and are read-only", async () => {
  const [page, route, nav] = await Promise.all([
    readFile(new URL("../app/admin/(dashboard)/station/intelligence/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/station/intelligence/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/AdminNav.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /currentAdminWithPermission\("station:read"\)/);
  assert.match(route, /requireAdmin\(request, "station:read"\)/);
  assert.doesNotMatch(route, /export async function (POST|PATCH|PUT|DELETE)/);
  assert.match(route, /private, no-store/);
  assert.match(nav, /\/admin\/station\/intelligence/);
});
