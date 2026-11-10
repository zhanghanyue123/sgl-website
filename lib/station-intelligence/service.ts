import { createHash } from "node:crypto";
import type { StationSnapshot } from "@/lib/integrations/station-admin";
import type {
  EvidenceRef,
  HourlyDemand,
  IntelligenceStatus,
  ReplenishmentRecommendation,
  StationIntelligenceView,
  WeatherSnapshot,
} from "./types";
import { forecastDemand } from "./demand-forecast";
import { planPreparation } from "./preparation-planner";

type Row = Record<string, unknown>;
type Fetcher = typeof fetch;

function record(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
}

function rows(value: unknown, key: string): Row[] {
  const candidate = record(value)[key];
  return Array.isArray(candidate) ? candidate.filter((item): item is Row => Boolean(item && typeof item === "object" && !Array.isArray(item))) : [];
}

function finite(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function evidence(sourceRef: string, observedAt: string | null, status: IntelligenceStatus = "available"): EvidenceRef {
  return { source: "Tencent Cloud Station OS", sourceRef, observedAt, status };
}

function safeHour(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const match = raw.match(/(?:T|\s)?(\d{1,2}):\d{2}/);
  if (!match) return null;
  const hour = Number(match[1]);
  return hour >= 0 && hour <= 23 ? `${String(hour).padStart(2, "0")}:00` : null;
}

function staffByHour(shifts: Row[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const shift of shifts) {
    const start = Number(text(shift.start)?.split(":")[0]);
    const end = Number(text(shift.end)?.split(":")[0]);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 24 || start >= end) continue;
    for (let hour = start; hour < end; hour += 1) {
      const key = `${String(hour).padStart(2, "0")}:00`;
      result.set(key, (result.get(key) || 0) + (text(shift.status) === "uncovered" ? 0 : 1));
    }
  }
  return result;
}

function actualFootfallByHour(camera: Row[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const item of camera) {
    const hour = safeHour(item.time || item.createdAt);
    const visitors = finite(item.estimatedVisitors);
    if (hour && visitors !== null) result.set(hour, (result.get(hour) || 0) + visitors);
  }
  return result;
}

function buildHourly(snapshot: StationSnapshot | null, sourceAt: string | null): HourlyDemand[] {
  if (!snapshot) return [];
  const shifts = rows(snapshot.operations.schedule, "shifts");
  const camera = rows(snapshot.operations.camera, "records");
  const scheduled = staffByHour(shifts);
  const actual = actualFootfallByHour(camera);
  const hours = [...new Set([...scheduled.keys(), ...actual.keys()])].sort();
  return hours.map((hour) => {
    const actualValue = actual.get(hour) ?? null;
    const scheduledValue = scheduled.has(hour) ? scheduled.get(hour)! : null;
    // A single day or a sparse camera summary is evidence, not a defensible forecast.
    return {
      hour,
      actualFootfall: actualValue,
      forecastFootfall: null,
      scheduledStaff: scheduledValue,
      recommendedStaff: null,
      gap: null,
      status: actualValue === null ? "not_recorded" : "blocked",
      evidence: [
        evidence("/ops/camera/day/{date}", sourceAt, actualValue === null ? "not_recorded" : "available"),
        evidence("/ops/schedule/week/{week_start}", sourceAt, scheduledValue === null ? "not_recorded" : "available"),
      ],
    };
  });
}

function matchingSuggestion(materialId: string, operations: StationSnapshot["operations"]): Row | null {
  const purchase = record(operations.purchaseSuggestions);
  for (const key of ["mustBuy", "shouldBuy", "watch", "doNotBuy"]) {
    const match = rows(purchase, key).find((item) => text(item.materialId) === materialId);
    if (match) return match;
  }
  const embedded = rows(operations.inventory, "purchaseSuggestions");
  return embedded.find((item) => text(item.materialId) === materialId || text(item.name) === materialId) || null;
}

function buildReplenishment(snapshot: StationSnapshot | null, sourceAt: string | null): ReplenishmentRecommendation[] {
  if (!snapshot) return [];
  return rows(snapshot.operations.inventory, "materials").map((item, index) => {
    const materialId = text(item.materialId) || `unidentified-${index}`;
    const suggestion = matchingSuggestion(materialId, snapshot.operations) || {};
    const currentStock = finite(item.currentStock);
    const safetyStock = finite(item.safetyStock);
    const averageDailyUsage = finite(item.avgDailyUsage);
    const leadTimeDays = finite(item.leadTimeDays);
    const suggestedQuantity = finite(suggestion.suggestedPurchaseQty);
    const daysRemaining = finite(suggestion.daysRemaining) ?? (currentStock !== null && averageDailyUsage && averageDailyUsage > 0 ? currentStock / averageDailyUsage : null);
    const blockers = [
      "Reserved stock is not recorded by Station OS",
      "Inbound purchase quantity is not recorded by Station OS",
      "Supplier MOQ is not available from a Suppliers API",
    ];
    if (currentStock === null) blockers.unshift("Current stock is not recorded");
    if (averageDailyUsage === null) blockers.unshift("Historical consumption is not recorded");
    if (leadTimeDays === null) blockers.push("Supplier lead time is not recorded");
    return {
      materialId,
      name: text(item.name) || materialId,
      unit: text(item.unit),
      currentStock,
      safetyStock,
      averageDailyUsage,
      reservedStock: null,
      inboundStock: null,
      daysRemaining,
      suggestedQuantity,
      supplier: text(item.supplier),
      leadTimeDays,
      moq: null,
      estimatedArrival: null,
      approvalState: "blocked",
      blockers,
      evidence: [
        evidence("/ops/inventory/status", text(item.updatedAt) || sourceAt, currentStock === null ? "not_recorded" : "available"),
        evidence("/ops/purchase/suggestions", sourceAt, suggestedQuantity === null ? "not_recorded" : "available"),
        evidence("Suppliers API", null, "not_connected"),
      ],
    };
  });
}

function buildPlanningExtensions(snapshot: StationSnapshot | null, generatedAt: string) {
  const productRows = snapshot ? rows(snapshot.operations.products, "products") : [];
  const productIds = productRows.map((item) => text(item.productId)).filter((value): value is string => Boolean(value));
  const salesDate = text(record(snapshot?.operations.daily).date);
  const cameraDate = text(record(snapshot?.operations.camera).date);
  const salesDays = salesDate ? 1 : 0;
  const footfallDays = cameraDate ? 1 : 0;
  const asOfDate = generatedAt.slice(0, 10);
  const demand = forecastDemand({
    asOfDate,
    updatedAt: generatedAt,
    storeIds: ["shanghai-station"],
    productIds,
    history: [],
    targets: [],
  });
  const preparation = productRows.map((item, index) => {
    const productId = text(item.productId) || `unidentified-${index}`;
    return planPreparation({
      productId,
      productName: text(item.name) || productId,
      forecastQuantity: null,
      safetyBuffer: null,
      readyStock: null,
      inProgressStock: null,
      wasteRate: null,
      shelfLifeMinutes: null,
      readyStockRemainingShelfLifeMinutes: null,
      minimumBatchSize: null,
      maximumDailyCapacity: null,
      requiredStaffPerBatch: null,
      preparationMinutesPerBatch: null,
      foodSafety: { approvedForPreparation: null, maximumHoldMinutes: null, controls: [] },
      windows: [],
      evidence: [],
    });
  });
  return {
    demand: {
      status: "blocked" as const,
      forecasts: demand.forecasts,
      coverage: { salesDays, footfallDays, productRows: productRows.length },
      message: "Insufficient Data: the current projection does not contain aligned hourly POS, anonymous footfall, future weather, calendar/events and business-hours history.",
    },
    preparation: {
      status: "blocked" as const,
      plans: preparation,
      message: "Preparation quantities remain blocked until a verified demand forecast, ready/in-progress stock, shelf life, batch, capacity, staffing and food-safety controls are recorded.",
    },
    materialRequirements: {
      status: "blocked" as const,
      plan: null,
      blockedProducts: productIds.map((productId) => ({ productId, reason: "Forecast quantity, confirmed SKU and confirmed BOM are required" })),
      message: "No BOM conversion was attempted. Station /ops/bom/list is unavailable and Website SKU initialization is not confirmed.",
    },
    forecastAccuracy: {
      status: "Insufficient Data" as const,
      weeks: [],
      message: "Weekly accuracy requires at least 7 forecast outcomes across 4 distinct business days; the production audit found only 3 sales dates and 1 anonymous-footfall date.",
    },
  };
}

export async function getStationWeather(fetcher: Fetcher = fetch, environment: NodeJS.ProcessEnv = process.env): Promise<WeatherSnapshot> {
  const latitude = environment.SGL_STATION_WEATHER_LATITUDE?.trim();
  const longitude = environment.SGL_STATION_WEATHER_LONGITUDE?.trim();
  const location = environment.SGL_STATION_WEATHER_LABEL?.trim() || "Shanghai Station";
  if (!latitude || !longitude || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return { status: "not_connected", location, temperatureC: null, precipitationMm: null, windKph: null, alert: null, observedAt: null, source: "Open-Meteo (not configured)" };
  }
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("current", "temperature_2m,precipitation,wind_speed_10m");
  url.searchParams.set("timezone", "Asia/Shanghai");
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(4_000), next: { revalidate: 900 } });
    if (!response.ok) throw new Error("weather_http_error");
    const payload = record(await response.json());
    const current = record(payload.current);
    const temperatureC = finite(current.temperature_2m);
    const precipitationMm = finite(current.precipitation);
    const windKph = finite(current.wind_speed_10m);
    const alert = precipitationMm !== null && precipitationMm >= 10 ? "Heavy rainfall may affect demand and travel" : windKph !== null && windKph >= 50 ? "Strong wind may affect travel" : null;
    return { status: "available", location, temperatureC, precipitationMm, windKph, alert, observedAt: text(current.time), source: "Open-Meteo" };
  } catch {
    return { status: "not_connected", location, temperatureC: null, precipitationMm: null, windKph: null, alert: null, observedAt: null, source: "Open-Meteo unavailable" };
  }
}

export async function buildStationIntelligence(input: {
  connected: boolean;
  stale: boolean;
  generatedAt: string | null;
  receivedAt: string | null;
  snapshot: StationSnapshot | null;
  weather?: WeatherSnapshot;
}): Promise<StationIntelligenceView> {
  const generatedAt = new Date().toISOString();
  const planning = buildPlanningExtensions(input.snapshot, generatedAt);
  const weather = input.weather || await getStationWeather();
  const hourly = buildHourly(input.snapshot, input.generatedAt);
  const replenishment = buildReplenishment(input.snapshot, input.generatedAt);
  const schedule = record(input.snapshot?.operations.schedule);
  const scheduleSummary = record(schedule.summary);
  const uncovered = finite(scheduleSummary.uncoveredCount) ?? rows(schedule, "shifts").filter((shift) => text(shift.status) === "uncovered").length;
  const availabilityRows = input.snapshot ? rows(input.snapshot.operations.availability, "availability").length : 0;
  const cameraRows = input.snapshot ? rows(input.snapshot.operations.camera, "records") : [];
  const cameraDays = new Set(cameraRows.map((item) => text(item.date)).filter(Boolean)).size;
  const latestDaily = record(input.snapshot?.operations.daily);
  const expectedSales = null; // One dated report is not a sales forecast.
  const inventoryRisks = replenishment.filter((item) => item.currentStock !== null && item.safetyStock !== null && item.currentStock <= item.safetyStock).length;
  const sourceStatus: IntelligenceStatus = !input.connected ? "not_connected" : input.stale ? "stale" : "available";
  const missingCapabilities = [
    ...(weather.status === "not_connected" ? ["Weather coordinates/provider are not configured"] : []),
    ...(cameraDays < 7 ? ["At least 7 distinct days of anonymous camera footfall are required for forecasting"] : []),
    ...(availabilityRows === 0 ? ["Staff availability is not recorded for the projected week"] : []),
    ...(Object.keys(latestDaily).length === 0 ? ["Current sales history is not available in the Station projection"] : []),
    "Attendance API is not available",
    "Suppliers/MOQ API is not available",
    "Reserved and inbound inventory are not available",
    "BOM list is unavailable until the Station route conflict is fixed",
  ];
  const activity = [
    {
      id: createHash("sha256").update(`workforce:${input.generatedAt || generatedAt}`).digest("hex").slice(0, 16),
      type: "workforce" as const,
      result: cameraDays < 7 ? "Forecast blocked: insufficient anonymous footfall history" : "Workforce evidence collected",
      approvalState: "blocked" as const,
      createdAt: generatedAt,
      evidence: [evidence("/ops/camera/day/{date}", input.generatedAt, cameraDays ? "available" : "not_recorded"), evidence("/ops/schedule/week/{week_start}", input.generatedAt, sourceStatus)],
    },
    {
      id: createHash("sha256").update(`replenishment:${input.generatedAt || generatedAt}`).digest("hex").slice(0, 16),
      type: "replenishment" as const,
      result: replenishment.length ? `${replenishment.length} material records evaluated; purchase drafting remains blocked` : "Inventory is not recorded",
      approvalState: "blocked" as const,
      createdAt: generatedAt,
      evidence: [evidence("/ops/inventory/status", input.generatedAt, replenishment.length ? sourceStatus : "not_recorded")],
    },
    {
      id: createHash("sha256").update(`weather:${weather.observedAt || generatedAt}`).digest("hex").slice(0, 16),
      type: "weather" as const,
      result: weather.status === "available" ? "Current weather read successfully" : "Weather source is not connected",
      approvalState: "not_required" as const,
      createdAt: generatedAt,
      evidence: [{ source: weather.source, sourceRef: weather.location, observedAt: weather.observedAt, status: weather.status }],
    },
  ];
  return {
    generatedAt,
    sourceGeneratedAt: input.generatedAt,
    sourceReceivedAt: input.receivedAt,
    connected: input.connected,
    stale: input.stale,
    weather,
    overview: {
      forecastFootfall: null,
      expectedSales,
      staffingDemand: null,
      inventoryRisks,
      pendingApprovals: 0,
    },
    workforce: {
      status: cameraDays >= 7 && availabilityRows > 0 ? sourceStatus : "blocked",
      hourly,
      shiftGaps: uncovered,
      availabilityRows,
      recommendation: uncovered > 0 ? `${uncovered} uncovered shift(s) require manager review; no schedule was published.` : "No uncovered shift is reported; demand-based staffing remains unavailable until footfall history is sufficient.",
      draftScheduleAllowed: false,
      backtest: { status: cameraDays >= 7 ? "available" : "blocked", sampleDays: cameraDays, message: cameraDays >= 7 ? "Backtest can run when aligned daily sales history is also present." : "Insufficient distinct camera days for a defensible backtest." },
    },
    demand: planning.demand,
    preparation: planning.preparation,
    materialRequirements: planning.materialRequirements,
    forecastAccuracy: planning.forecastAccuracy,
    dailyBriefing: [
      { label: "Tomorrow footfall", value: "Insufficient Data", status: "blocked", source: "Anonymous camera history" },
      { label: "Tomorrow sales", value: "Insufficient Data", status: "blocked", source: "Historical POS" },
      { label: "Product preparation", value: "Not Recorded", status: "not_recorded", source: "Demand forecast + finished stock" },
      { label: "Batch plan", value: "Not Recorded", status: "not_recorded", source: "Preparation constraints" },
      { label: "Material shortage", value: "Blocked", status: "blocked", source: "Confirmed BOM + inventory" },
      { label: "Purchase advice", value: "Manager approval required", status: "blocked", source: "Inventory + supplier terms" },
      { label: "Staffing", value: uncovered > 0 ? `${uncovered} reported gap(s)` : "Demand forecast unavailable", status: uncovered > 0 ? "available" : "blocked", source: "Station schedule" },
    ],
    replenishment: {
      status: replenishment.length ? "blocked" : sourceStatus === "available" ? "not_recorded" : sourceStatus,
      recommendations: replenishment,
      purchaseDraftAllowed: false,
      message: replenishment.length ? "Risk indicators are visible, but purchase drafts are blocked until reserved stock, inbound orders, MOQ and BOM are available." : "Inventory is not recorded; no quantity was inferred.",
    },
    activity,
    missingCapabilities,
  };
}
