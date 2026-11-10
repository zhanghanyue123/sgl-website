import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateWeeklyForecastAccuracy,
  forecastDemand,
  recordForecastOutcome,
  type DemandTargetDay,
  type HistoricalDemandDay,
} from "../lib/station-intelligence/demand-forecast";

function datePlus(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function historyDay(date: string, sales = 10, footfall = 20): HistoricalDemandDay {
  return {
    storeId: "station-1",
    date,
    open: "09:00",
    close: "10:00",
    posCoverageComplete: true,
    cameraCoverageComplete: true,
    sales: [{ productId: "coffee", hour: "09:00", quantity: sales }],
    anonymousFootfall: [{ hour: "09:00", count: footfall }],
    weather: { temperatureC: 20, rainfallMm: 0, windKph: 5, alerts: [], sourceRef: `weather:${date}`, observedAt: `${date}T08:00:00Z` },
    calendar: { isHoliday: false, events: [], sourceRef: `calendar:${date}`, updatedAt: `${date}T00:00:00Z` },
  };
}

function targetDay(date: string, projectedFootfall = 24): DemandTargetDay {
  return {
    storeId: "station-1",
    date,
    open: "09:00",
    close: "10:00",
    projectedAnonymousFootfall: [{ hour: "09:00", count: projectedFootfall }],
    weather: { temperatureC: 20, rainfallMm: 0, windKph: 5, alerts: [], sourceRef: `forecast:${date}`, observedAt: "2026-11-10T09:00:00Z" },
    calendar: { isHoliday: false, events: [], sourceRef: `calendar:${date}`, updatedAt: "2026-11-01T00:00:00Z" },
  };
}

test("forecasts next business day, three days, and seven days by store/product/hour", () => {
  const targetStart = "2026-11-11";
  const history = Array.from({ length: 12 }, (_, index) => historyDay(datePlus(targetStart, -7 * (index + 1))));
  const targets = Array.from({ length: 7 }, (_, index) => targetDay(datePlus(targetStart, index)));
  // Each target weekday needs its own history; provide twelve weeks for every weekday.
  for (let offset = 1; offset < 7; offset += 1) {
    history.push(...Array.from({ length: 12 }, (_, index) => historyDay(datePlus(targetStart, offset - 7 * (index + 1)))));
  }
  const result = forecastDemand({ asOfDate: "2026-11-10", updatedAt: "2026-11-10T10:00:00Z", storeIds: ["station-1"], productIds: ["coffee"], history, targets });
  assert.deepEqual(result.forecasts.map((item) => item.horizon), ["next_business_day", "3_days", "7_days"]);
  assert.equal(result.forecasts[0].forecastQuantity, 12);
  assert.equal(result.forecasts[0].confidence, "Moderate Confidence");
  assert.equal(result.forecasts[0].expectedPeakTime, "2026-11-11T09:00");
  assert.equal(result.forecasts[2].forecastQuantity, 84);
  assert.ok(result.forecasts[0].dataSources.some((source) => source.source === "Historical POS"));
  assert.ok(result.forecasts[0].dataSources.some((source) => source.source === "Weather"));
});

test("does not manufacture a forecast from sparse history", () => {
  const target = targetDay("2026-11-11");
  const result = forecastDemand({
    asOfDate: "2026-11-10",
    updatedAt: "2026-11-10T10:00:00Z",
    storeIds: ["station-1"],
    productIds: ["coffee"],
    history: [historyDay("2026-11-04"), historyDay("2026-10-28"), historyDay("2026-10-21")],
    targets: [target],
  });
  const forecast = result.forecasts[0];
  assert.equal(forecast.confidence, "Insufficient Data");
  assert.equal(forecast.forecastQuantity, null);
  assert.match(forecast.periods[0].reason || "", /four complete prior observations/);
});

test("missing target weather is Insufficient Data rather than an assumed value", () => {
  const target = { ...targetDay("2026-11-11"), weather: null };
  const history = Array.from({ length: 5 }, (_, index) => historyDay(datePlus("2026-11-11", -7 * (index + 1))));
  const forecast = forecastDemand({ asOfDate: "2026-11-10", updatedAt: "2026-11-10T10:00:00Z", storeIds: ["station-1"], productIds: ["coffee"], history, targets: [target] }).forecasts[0];
  assert.equal(forecast.forecastQuantity, null);
  assert.equal(forecast.confidence, "Insufficient Data");
  assert.match(forecast.periods[0].reason || "", /weather, calendar\/events, and business hours/);
});

test("historically inferred future footfall is explicitly Low Confidence", () => {
  const target = { ...targetDay("2026-11-11"), projectedAnonymousFootfall: undefined };
  const history = Array.from({ length: 12 }, (_, index) => historyDay(datePlus("2026-11-11", -7 * (index + 1))));
  const forecast = forecastDemand({ asOfDate: "2026-11-10", updatedAt: "2026-11-10T10:00:00Z", storeIds: ["station-1"], productIds: ["coffee"], history, targets: [target] }).forecasts[0];
  assert.equal(forecast.forecastQuantity, 10);
  assert.equal(forecast.confidence, "Low Confidence");
  assert.match(forecast.periods[0].reason || "", /inferred/);
});

test("records forecast versus actual, waste, stockouts, and withholds sparse weekly accuracy", () => {
  const sparse = [recordForecastOutcome({ forecastId: "f-1", horizon: "next_business_day", storeId: "station-1", productId: "coffee", businessDate: "2026-11-09", forecastQuantity: 12, actualSales: 10, wasteQuantity: 1, stockoutEvents: 0, recordedAt: "2026-11-09T22:00:00Z" })];
  assert.equal(sparse[0].forecastError, 2);
  assert.equal(sparse[0].absolutePercentageError, 0.2);
  const sparseWeek = calculateWeeklyForecastAccuracy(sparse)[0];
  assert.equal(sparseWeek.status, "Insufficient Data");
  assert.equal(sparseWeek.accuracy, null);

  const complete = Array.from({ length: 7 }, (_, index) => recordForecastOutcome({
    forecastId: `f-${index}`,
    horizon: "next_business_day",
    storeId: "station-1",
    productId: "coffee",
    businessDate: datePlus("2026-11-09", index % 5),
    forecastQuantity: 12,
    actualSales: 10,
    wasteQuantity: 1,
    stockoutEvents: index === 0 ? 1 : 0,
    recordedAt: "2026-11-15T22:00:00Z",
  }));
  const week = calculateWeeklyForecastAccuracy(complete)[0];
  assert.equal(week.status, "Available");
  assert.equal(week.sampleCount, 7);
  assert.equal(week.accuracy, 0.8);
  assert.equal(week.totalWasteQuantity, 7);
  assert.equal(week.stockoutEvents, 1);
});
