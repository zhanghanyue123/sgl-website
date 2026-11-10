export type ForecastHorizon = "next_business_day" | "3_days" | "7_days";
export type ForecastConfidence = "Insufficient Data" | "Low Confidence" | "Moderate Confidence";

export type HourlyProductSales = {
  productId: string;
  hour: string;
  quantity: number;
};

export type HourlyAnonymousFootfall = {
  hour: string;
  count: number;
};

export type ForecastWeather = {
  temperatureC: number;
  rainfallMm: number;
  windKph: number;
  alerts: string[];
  sourceRef: string;
  observedAt: string;
};

export type ForecastCalendar = {
  isHoliday: boolean;
  events: string[];
  sourceRef: string;
  updatedAt: string;
};

export type HistoricalDemandDay = {
  storeId: string;
  date: string;
  open: string;
  close: string;
  posCoverageComplete: boolean;
  cameraCoverageComplete: boolean;
  sales: HourlyProductSales[];
  anonymousFootfall: HourlyAnonymousFootfall[];
  weather: ForecastWeather | null;
  calendar: ForecastCalendar | null;
};

export type DemandTargetDay = {
  storeId: string;
  date: string;
  open: string;
  close: string;
  weather: ForecastWeather | null;
  calendar: ForecastCalendar | null;
  /** Optional upstream anonymous-footfall projection. Historical camera data is used when absent. */
  projectedAnonymousFootfall?: HourlyAnonymousFootfall[];
};

export type ForecastEvidence = {
  source: "Historical POS" | "Anonymous Camera Footfall" | "Weather" | "Calendar" | "Events" | "Business Hours";
  sourceRef: string;
  observedAt: string | null;
  sampleCount: number;
};

export type DemandForecastPeriod = {
  date: string;
  hour: string;
  forecastQuantity: number | null;
  confidenceRange: { low: number; high: number } | null;
  confidence: ForecastConfidence;
  sampleDays: number;
  reason: string | null;
};

export type ProductDemandForecast = {
  id: string;
  horizon: ForecastHorizon;
  storeId: string;
  productId: string;
  forecastQuantity: number | null;
  confidenceRange: { low: number; high: number } | null;
  confidence: ForecastConfidence;
  expectedPeakTime: string | null;
  periods: DemandForecastPeriod[];
  dataSources: ForecastEvidence[];
  updatedAt: string;
};

export type DemandForecastResult = {
  forecasts: ProductDemandForecast[];
  updatedAt: string;
};

export type ForecastOutcomeInput = {
  forecastId: string;
  horizon: ForecastHorizon;
  storeId: string;
  productId: string;
  businessDate: string;
  forecastQuantity: number;
  actualSales: number;
  wasteQuantity: number | null;
  stockoutEvents: number | null;
  recordedAt: string;
};

export type ForecastOutcome = ForecastOutcomeInput & {
  forecastError: number;
  absoluteError: number;
  absolutePercentageError: number | null;
};

export type WeeklyForecastAccuracy = {
  weekStart: string;
  status: "Available" | "Insufficient Data";
  sampleCount: number;
  distinctDays: number;
  accuracy: number | null;
  meanAbsoluteError: number | null;
  meanAbsolutePercentageError: number | null;
  totalWasteQuantity: number | null;
  stockoutEvents: number | null;
};

const HORIZONS: Array<{ horizon: ForecastHorizon; days: number }> = [
  { horizon: "next_business_day", days: 1 },
  { horizon: "3_days", days: 3 },
  { horizon: "7_days", days: 7 },
];

function assertDate(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new TypeError(`${field} must be an ISO calendar date`);
  }
}

function hourNumber(value: string): number | null {
  const match = /^(\d{2}):00$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  return hour >= 0 && hour <= 23 ? hour : null;
}

function operatingHours(open: string, close: string): string[] {
  const start = hourNumber(open);
  const end = hourNumber(close);
  if (start === null || end === null || start >= end) return [];
  return Array.from({ length: end - start }, (_, index) => `${String(start + index).padStart(2, "0")}:00`);
}

function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function nonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function rounded(value: number): number {
  return Math.round(value * 10) / 10;
}

function valueAtHour(rows: HourlyAnonymousFootfall[], hour: string): number {
  return rows.filter((row) => row.hour === hour && nonNegative(row.count)).reduce((sum, row) => sum + row.count, 0);
}

function salesAtHour(rows: HourlyProductSales[], productId: string, hour: string): number {
  return rows
    .filter((row) => row.productId === productId && row.hour === hour && nonNegative(row.quantity))
    .reduce((sum, row) => sum + row.quantity, 0);
}

function contextWeight(history: HistoricalDemandDay, target: DemandTargetDay): number {
  if (!history.weather || !history.calendar || !target.weather || !target.calendar) return 0;
  const holidayWeight = history.calendar.isHoliday === target.calendar.isHoliday ? 1 : 0.55;
  const historyEvents = new Set(history.calendar.events.map((event) => event.trim().toLowerCase()).filter(Boolean));
  const targetEvents = target.calendar.events.map((event) => event.trim().toLowerCase()).filter(Boolean);
  const eventWeight = targetEvents.length === 0
    ? (historyEvents.size === 0 ? 1 : 0.75)
    : (targetEvents.some((event) => historyEvents.has(event)) ? 1 : 0.65);
  const weatherDistance = Math.abs(history.weather.temperatureC - target.weather.temperatureC) / 10
    + Math.abs(history.weather.rainfallMm - target.weather.rainfallMm) / 10
    + Math.abs(history.weather.windKph - target.weather.windKph) / 30
    + (history.weather.alerts.length === target.weather.alerts.length ? 0 : 0.25);
  return holidayWeight * eventWeight / (1 + weatherDistance);
}

function forecastPeriod(input: {
  storeId: string;
  productId: string;
  target: DemandTargetDay;
  hour: string;
  history: HistoricalDemandDay[];
}): DemandForecastPeriod {
  const candidates = input.history.filter((day) =>
    day.storeId === input.storeId
    && day.date < input.target.date
    && weekday(day.date) === weekday(input.target.date)
    && day.posCoverageComplete
    && day.cameraCoverageComplete
    && day.weather !== null
    && day.calendar !== null
    && operatingHours(day.open, day.close).includes(input.hour)
  );
  const missingTargetContext = !input.target.weather || !input.target.calendar || !operatingHours(input.target.open, input.target.close).includes(input.hour);
  if (missingTargetContext || candidates.length < 4) {
    return {
      date: input.target.date,
      hour: input.hour,
      forecastQuantity: null,
      confidenceRange: null,
      confidence: "Insufficient Data",
      sampleDays: candidates.length,
      reason: missingTargetContext
        ? "Target weather, calendar/events, and business hours must all be recorded"
        : "At least four complete prior observations for the same weekday and hour are required",
    };
  }

  const observations = candidates.map((day) => ({
    weight: contextWeight(day, input.target),
    sales: salesAtHour(day.sales, input.productId, input.hour),
    footfall: valueAtHour(day.anonymousFootfall, input.hour),
  })).filter((item) => item.weight > 0);
  const totalWeight = observations.reduce((sum, item) => sum + item.weight, 0);
  const footfallWeight = observations.filter((item) => item.footfall > 0).reduce((sum, item) => sum + item.weight, 0);
  if (observations.length < 4 || totalWeight === 0 || footfallWeight === 0) {
    return {
      date: input.target.date,
      hour: input.hour,
      forecastQuantity: null,
      confidenceRange: null,
      confidence: "Insufficient Data",
      sampleDays: observations.length,
      reason: "Anonymous footfall and POS history do not contain enough aligned observations",
    };
  }

  const weightedConversion = observations
    .filter((item) => item.footfall > 0)
    .reduce((sum, item) => sum + item.weight * (item.sales / item.footfall), 0) / footfallWeight;
  const explicitProjection = input.target.projectedAnonymousFootfall;
  const projectedFootfall = explicitProjection
    ? valueAtHour(explicitProjection, input.hour)
    : observations.reduce((sum, item) => sum + item.weight * item.footfall, 0) / totalWeight;
  const estimate = Math.max(0, weightedConversion * projectedFootfall);
  const weightedVariance = observations.reduce((sum, item) => sum + item.weight * ((item.sales - estimate) ** 2), 0) / totalWeight;
  const empiricalWidth = 1.96 * Math.sqrt(weightedVariance) / Math.sqrt(observations.length);
  const width = Math.max(0.5, empiricalWidth, estimate * (explicitProjection ? 0.1 : 0.2));
  const confidence: ForecastConfidence = observations.length >= 12 && explicitProjection ? "Moderate Confidence" : "Low Confidence";
  return {
    date: input.target.date,
    hour: input.hour,
    forecastQuantity: rounded(estimate),
    confidenceRange: { low: rounded(Math.max(0, estimate - width)), high: rounded(estimate + width) },
    confidence,
    sampleDays: observations.length,
    reason: explicitProjection ? null : "Future footfall is inferred from aligned anonymous historical counts",
  };
}

function buildEvidence(days: DemandTargetDay[], history: HistoricalDemandDay[], periods: DemandForecastPeriod[]): ForecastEvidence[] {
  const sampleCount = periods.length ? Math.min(...periods.map((period) => period.sampleDays)) : 0;
  const weatherRefs = [...new Set(days.flatMap((day) => day.weather ? [day.weather.sourceRef] : []))];
  const calendarRefs = [...new Set(days.flatMap((day) => day.calendar ? [day.calendar.sourceRef] : []))];
  const latestWeather = days.flatMap((day) => day.weather ? [day.weather.observedAt] : []).sort().at(-1) || null;
  const latestCalendar = days.flatMap((day) => day.calendar ? [day.calendar.updatedAt] : []).sort().at(-1) || null;
  return [
    { source: "Historical POS", sourceRef: "Station OS POS completed operating days", observedAt: null, sampleCount },
    { source: "Anonymous Camera Footfall", sourceRef: days.some((day) => day.projectedAnonymousFootfall) ? "Target projection plus anonymous history" : "Anonymous historical hourly counts", observedAt: null, sampleCount },
    { source: "Weather", sourceRef: weatherRefs.join(", ") || "Not recorded", observedAt: latestWeather, sampleCount: days.filter((day) => day.weather).length },
    { source: "Calendar", sourceRef: calendarRefs.join(", ") || "Not recorded", observedAt: latestCalendar, sampleCount: days.filter((day) => day.calendar).length },
    { source: "Events", sourceRef: "Recorded calendar events only", observedAt: latestCalendar, sampleCount: days.filter((day) => day.calendar).length },
    { source: "Business Hours", sourceRef: "Station OS operating hours", observedAt: null, sampleCount: history.filter((day) => operatingHours(day.open, day.close).length > 0).length },
  ];
}

/**
 * Produces deterministic recommendations from explicitly supplied Station data.
 * It performs no I/O and never substitutes zero for missing source coverage.
 */
export function forecastDemand(input: {
  asOfDate: string;
  updatedAt: string;
  storeIds: string[];
  productIds: string[];
  history: HistoricalDemandDay[];
  targets: DemandTargetDay[];
}): DemandForecastResult {
  assertDate(input.asOfDate, "asOfDate");
  const forecasts: ProductDemandForecast[] = [];
  for (const storeId of [...new Set(input.storeIds)]) {
    const future = input.targets
      .filter((target) => target.storeId === storeId && target.date > input.asOfDate && operatingHours(target.open, target.close).length > 0)
      .sort((left, right) => left.date.localeCompare(right.date));
    for (const productId of [...new Set(input.productIds)]) {
      for (const definition of HORIZONS) {
        const days = future.slice(0, definition.days);
        const periods = days.flatMap((target) => operatingHours(target.open, target.close).map((hour) => forecastPeriod({ storeId, productId, target, hour, history: input.history })));
        const complete = days.length === definition.days && periods.length > 0 && periods.every((period) => period.forecastQuantity !== null && period.confidenceRange !== null);
        const quantity = complete ? periods.reduce((sum, period) => sum + (period.forecastQuantity || 0), 0) : null;
        const low = complete ? periods.reduce((sum, period) => sum + (period.confidenceRange?.low || 0), 0) : null;
        const high = complete ? periods.reduce((sum, period) => sum + (period.confidenceRange?.high || 0), 0) : null;
        const peak = complete
          ? periods.reduce((best, period) => (period.forecastQuantity || 0) > (best.forecastQuantity || 0) ? period : best, periods[0])
          : null;
        const confidence: ForecastConfidence = !complete
          ? "Insufficient Data"
          : periods.every((period) => period.confidence === "Moderate Confidence") ? "Moderate Confidence" : "Low Confidence";
        forecasts.push({
          id: `${storeId}:${productId}:${definition.horizon}:${input.asOfDate}`,
          horizon: definition.horizon,
          storeId,
          productId,
          forecastQuantity: quantity === null ? null : rounded(quantity),
          confidenceRange: low === null || high === null ? null : { low: rounded(low), high: rounded(high) },
          confidence,
          expectedPeakTime: peak ? `${peak.date}T${peak.hour}` : null,
          periods,
          dataSources: buildEvidence(days, input.history.filter((day) => day.storeId === storeId), periods),
          updatedAt: input.updatedAt,
        });
      }
    }
  }
  return { forecasts, updatedAt: input.updatedAt };
}

export function recordForecastOutcome(input: ForecastOutcomeInput): ForecastOutcome {
  for (const [field, value] of Object.entries({
    forecastQuantity: input.forecastQuantity,
    actualSales: input.actualSales,
    ...(input.wasteQuantity === null ? {} : { wasteQuantity: input.wasteQuantity }),
    ...(input.stockoutEvents === null ? {} : { stockoutEvents: input.stockoutEvents }),
  })) {
    if (!nonNegative(value)) throw new RangeError(`${field} must be a non-negative finite number`);
  }
  assertDate(input.businessDate, "businessDate");
  const forecastError = input.forecastQuantity - input.actualSales;
  const absoluteError = Math.abs(forecastError);
  return {
    ...input,
    forecastError: rounded(forecastError),
    absoluteError: rounded(absoluteError),
    absolutePercentageError: input.actualSales === 0 ? null : rounded(absoluteError / input.actualSales),
  };
}

function mondayOf(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value.toISOString().slice(0, 10);
}

/** Weekly accuracy is withheld until at least seven outcomes from four distinct days exist. */
export function calculateWeeklyForecastAccuracy(outcomes: ForecastOutcome[], minimumSamples = 7): WeeklyForecastAccuracy[] {
  const grouped = new Map<string, ForecastOutcome[]>();
  for (const outcome of outcomes) {
    assertDate(outcome.businessDate, "businessDate");
    const key = mondayOf(outcome.businessDate);
    grouped.set(key, [...(grouped.get(key) || []), outcome]);
  }
  return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([weekStart, rows]) => {
    const distinctDays = new Set(rows.map((row) => row.businessDate)).size;
    const actual = rows.reduce((sum, row) => sum + row.actualSales, 0);
    const available = rows.length >= minimumSamples && distinctDays >= 4 && actual > 0;
    const percentageErrors = rows.map((row) => row.absolutePercentageError).filter((value): value is number => value !== null);
    return {
      weekStart,
      status: available ? "Available" : "Insufficient Data",
      sampleCount: rows.length,
      distinctDays,
      accuracy: available ? rounded(Math.max(0, 1 - rows.reduce((sum, row) => sum + row.absoluteError, 0) / actual)) : null,
      meanAbsoluteError: available ? rounded(rows.reduce((sum, row) => sum + row.absoluteError, 0) / rows.length) : null,
      meanAbsolutePercentageError: available && percentageErrors.length ? rounded(percentageErrors.reduce((sum, value) => sum + value, 0) / percentageErrors.length) : null,
      totalWasteQuantity: rows.some((row) => row.wasteQuantity === null) ? null : rounded(rows.reduce((sum, row) => sum + (row.wasteQuantity || 0), 0)),
      stockoutEvents: rows.some((row) => row.stockoutEvents === null) ? null : rows.reduce((sum, row) => sum + (row.stockoutEvents || 0), 0),
    };
  });
}
