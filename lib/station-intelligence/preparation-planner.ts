export const PREPARATION_PERIODS = ["opening", "morning", "afternoon", "evening"] as const;

export type PreparationPeriod = (typeof PREPARATION_PERIODS)[number];

export type PreparationEvidence = {
  source: string;
  sourceRef: string;
  observedAt: string;
};

export type PreparationWindowInput = {
  period: PreparationPeriod;
  start: string;
  end: string;
  forecastQuantity: number | null;
  availableStaff: number | null;
  maxProductionCapacity: number | null;
  evidence: PreparationEvidence[];
};

export type PreparationPlannerInput = {
  productId: string;
  productName: string;
  forecastQuantity: number | null;
  safetyBuffer: number | null;
  readyStock: number | null;
  inProgressStock: number | null;
  wasteRate: number | null;
  shelfLifeMinutes: number | null;
  readyStockRemainingShelfLifeMinutes: number | null;
  minimumBatchSize: number | null;
  maximumDailyCapacity: number | null;
  requiredStaffPerBatch: number | null;
  preparationMinutesPerBatch: number | null;
  foodSafety: {
    approvedForPreparation: boolean | null;
    maximumHoldMinutes: number | null;
    controls: string[];
  };
  windows: PreparationWindowInput[];
  evidence: PreparationEvidence[];
};

export type PreparationBatch = {
  period: PreparationPeriod;
  start: string;
  end: string;
  forecastQuantity: number;
  requestedGrossQuantity: number;
  suggestedQuantity: number;
  expectedSellableQuantity: number;
  expectedWasteQuantity: number;
  preparationMinutes: number;
  preparationStart: string;
  readyAt: string;
  capacity: number;
  availableStaff: number;
  evidence: PreparationEvidence[];
};

export type PreparationPlan = {
  productId: string;
  productName: string;
  status: "recommendation" | "blocked";
  approvalState: "manager_review_required" | "blocked";
  executionAllowed: false;
  formula: "forecast + safety buffer - ready stock - in-progress stock";
  forecastQuantity: number | null;
  safetyBuffer: number | null;
  readyStock: number | null;
  inProgressStock: number | null;
  netPreparationRequirement: number | null;
  suggestedGrossPreparation: number | null;
  expectedSellablePreparation: number | null;
  expectedRemainingQuantity: number | null;
  expectedWasteQuantity: number | null;
  expectedStockoutAt: string | null;
  wasteRisk: "not_assessed" | "low" | "medium" | "high";
  batches: PreparationBatch[];
  blockers: string[];
  evidence: PreparationEvidence[];
};

function finiteNonNegative(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}

function finitePositive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

function validEvidence(item: PreparationEvidence): boolean {
  return Boolean(item.source.trim() && item.sourceRef.trim() && item.observedAt.trim() && Number.isFinite(Date.parse(item.observedAt)));
}

function validDate(value: string): boolean {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function roundUp(value: number, increment: number): number {
  if (value <= 0) return 0;
  return Math.ceil((value - Number.EPSILON) / increment) * increment;
}

function addMissing(blockers: string[], missing: boolean, message: string): void {
  if (missing) blockers.push(message);
}

function estimateStockoutAt(windows: PreparationWindowInput[], availableQuantity: number): string | null {
  let remaining = availableQuantity;
  for (const window of windows) {
    const demand = window.forecastQuantity;
    if (!finiteNonNegative(demand) || demand === 0) continue;
    if (remaining >= demand) {
      remaining -= demand;
      continue;
    }
    const start = Date.parse(window.start);
    const end = Date.parse(window.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    const fractionCovered = Math.max(0, remaining) / demand;
    return new Date(start + (end - start) * fractionCovered).toISOString();
  }
  return null;
}

function estimateQuantityConsumedAt(windows: PreparationWindowInput[], quantity: number): number | null {
  if (windows.length === 0 || !validDate(windows[0].start)) return null;
  let remaining = quantity;
  for (const window of windows) {
    const demand = window.forecastQuantity;
    const start = Date.parse(window.start);
    const end = Date.parse(window.end);
    if (!finiteNonNegative(demand) || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    if (demand === 0) continue;
    if (remaining <= demand) return start + (end - start) * (remaining / demand);
    remaining -= demand;
  }
  return Date.parse(windows[windows.length - 1].end);
}

/**
 * Produces a recommendation only. The net preparation formula is deliberately
 * explicit: forecast + safety buffer - ready stock - in-progress stock.
 * Waste is applied afterwards to calculate the gross quantity that must be
 * produced; it never changes or conceals the demand forecast itself.
 */
export function planPreparation(input: PreparationPlannerInput): PreparationPlan {
  const blockers: string[] = [];
  const numericFields: Array<[number | null, string, "positive" | "non-negative"]> = [
    [input.forecastQuantity, "Forecast quantity is Not Recorded", "non-negative"],
    [input.safetyBuffer, "Safety buffer is Not Recorded", "non-negative"],
    [input.readyStock, "Ready stock is Not Recorded", "non-negative"],
    [input.inProgressStock, "In-progress stock is Not Recorded", "non-negative"],
    [input.wasteRate, "Production waste rate is Not Recorded", "non-negative"],
    [input.shelfLifeMinutes, "Shelf life is Not Recorded", "positive"],
    [input.readyStockRemainingShelfLifeMinutes, "Remaining shelf life of ready stock is Not Recorded", "non-negative"],
    [input.minimumBatchSize, "Minimum batch size is Not Recorded", "positive"],
    [input.maximumDailyCapacity, "Maximum daily production capacity is Not Recorded", "non-negative"],
    [input.requiredStaffPerBatch, "Required staff per batch is Not Recorded", "positive"],
    [input.preparationMinutesPerBatch, "Preparation time per batch is Not Recorded", "positive"],
    [input.foodSafety.maximumHoldMinutes, "Food-safety maximum hold time is Not Recorded", "positive"],
  ];
  for (const [value, message, kind] of numericFields) {
    addMissing(blockers, kind === "positive" ? !finitePositive(value) : !finiteNonNegative(value), message);
  }
  addMissing(blockers, !input.productId.trim(), "Product ID is not recorded");
  addMissing(blockers, !input.productName.trim(), "Product name is not recorded");
  addMissing(blockers, input.wasteRate !== null && input.wasteRate >= 1, "Production waste rate must be below 100%");
  addMissing(blockers, input.foodSafety.approvedForPreparation !== true, "Food-safety preparation approval is not confirmed");
  addMissing(blockers, input.foodSafety.controls.length === 0 || input.foodSafety.controls.some((item) => !item.trim()), "Food-safety controls are not recorded");
  addMissing(blockers, input.evidence.length === 0 || input.evidence.some((item) => !validEvidence(item)), "Product preparation evidence is incomplete");

  const byPeriod = new Map(input.windows.map((window) => [window.period, window]));
  addMissing(blockers, input.windows.length !== PREPARATION_PERIODS.length || byPeriod.size !== PREPARATION_PERIODS.length, "Exactly one opening, morning, afternoon and evening window is required");
  for (const period of PREPARATION_PERIODS) {
    const window = byPeriod.get(period);
    if (!window) continue;
    addMissing(blockers, !validDate(window.start) || !validDate(window.end) || Date.parse(window.end) <= Date.parse(window.start), `${period} preparation window is invalid`);
    addMissing(blockers, !finiteNonNegative(window.forecastQuantity), `${period} forecast quantity is Not Recorded`);
    addMissing(blockers, !finiteNonNegative(window.availableStaff), `${period} staff availability is Not Recorded`);
    addMissing(blockers, !finiteNonNegative(window.maxProductionCapacity), `${period} production capacity is Not Recorded`);
    addMissing(blockers, window.evidence.length === 0 || window.evidence.some((item) => !validEvidence(item)), `${period} forecast evidence is incomplete`);
  }

  const orderedWindows = PREPARATION_PERIODS.map((period) => byPeriod.get(period)).filter((item): item is PreparationWindowInput => Boolean(item));
  if (orderedWindows.length === PREPARATION_PERIODS.length && orderedWindows.every((window) => finiteNonNegative(window.forecastQuantity)) && finiteNonNegative(input.forecastQuantity)) {
    const windowForecast = orderedWindows.reduce((sum, window) => sum + window.forecastQuantity!, 0);
    addMissing(blockers, Math.abs(windowForecast - input.forecastQuantity) > 1e-6, "Window forecasts do not equal the product forecast quantity");
  }

  if (blockers.length > 0) {
    const knownStock = finiteNonNegative(input.readyStock) && finiteNonNegative(input.inProgressStock)
      ? input.readyStock + input.inProgressStock
      : null;
    return {
      productId: input.productId,
      productName: input.productName,
      status: "blocked",
      approvalState: "blocked",
      executionAllowed: false,
      formula: "forecast + safety buffer - ready stock - in-progress stock",
      forecastQuantity: input.forecastQuantity,
      safetyBuffer: input.safetyBuffer,
      readyStock: input.readyStock,
      inProgressStock: input.inProgressStock,
      netPreparationRequirement: null,
      suggestedGrossPreparation: null,
      expectedSellablePreparation: null,
      expectedRemainingQuantity: null,
      expectedWasteQuantity: null,
      expectedStockoutAt: knownStock === null ? null : estimateStockoutAt(orderedWindows, knownStock),
      wasteRisk: "not_assessed",
      batches: [],
      blockers: [...new Set(blockers)],
      evidence: input.evidence.filter(validEvidence),
    };
  }

  // All guarded values are known beyond this point. Null is never coerced to zero.
  const forecast = input.forecastQuantity!;
  const safety = input.safetyBuffer!;
  const ready = input.readyStock!;
  const inProgress = input.inProgressStock!;
  const wasteRate = input.wasteRate!;
  const minBatch = input.minimumBatchSize!;
  const prepMinutes = input.preparationMinutesPerBatch!;
  const requiredStaff = input.requiredStaffPerBatch!;
  const effectiveHoldMinutes = Math.min(input.shelfLifeMinutes!, input.foodSafety.maximumHoldMinutes!);
  const netRequirement = Math.max(0, forecast + safety - ready - inProgress);
  let availableSellable = ready + inProgress;
  let safetyRemaining = safety;
  let dailyGross = 0;
  let sellableProduced = 0;
  const batches: PreparationBatch[] = [];

  if (ready > 0) {
    const consumedAt = estimateQuantityConsumedAt(orderedWindows, ready);
    const horizonStart = Date.parse(orderedWindows[0].start);
    if (consumedAt === null || consumedAt - horizonStart > input.readyStockRemainingShelfLifeMinutes! * 60_000) {
      blockers.push("Ready stock may expire before it is consumed and cannot be treated as available for the full plan");
    }
  }

  for (const window of orderedWindows) {
    const durationMinutes = (Date.parse(window.end) - Date.parse(window.start)) / 60_000;
    if (window.forecastQuantity! > 0 && effectiveHoldMinutes < durationMinutes) {
      blockers.push(`${window.period} demand requires a shorter sub-batch interval than the recorded shelf-life or food-safety hold time`);
      continue;
    }

    const safetyShare = forecast > 0
      ? safety * (window.forecastQuantity! / forecast)
      : window.period === "opening" ? safety : 0;
    const target = window.forecastQuantity! + Math.min(safetyRemaining, safetyShare);
    safetyRemaining = Math.max(0, safetyRemaining - safetyShare);
    const sellableShortfall = Math.max(0, target - availableSellable);
    // The last period closes any remaining whole-day requirement so rounding
    // and earlier stock coverage cannot silently remove the safety buffer.
    const periodSellableNeed = window.period === "evening"
      ? Math.max(sellableShortfall, netRequirement - sellableProduced)
      : sellableShortfall;
    const grossNeeded = periodSellableNeed === 0 ? 0 : periodSellableNeed / (1 - wasteRate);
    const suggestedQuantity = roundUp(grossNeeded, minBatch);
    const staffingRuns = Math.floor((durationMinutes * window.availableStaff!) / (prepMinutes * requiredStaff));
    const laborCapacity = staffingRuns * minBatch;
    const capacity = Math.min(window.maxProductionCapacity!, laborCapacity);
    if (suggestedQuantity > capacity) blockers.push(`${window.period} preparation exceeds recorded staff or production capacity`);
    if (dailyGross + suggestedQuantity > input.maximumDailyCapacity!) blockers.push("Suggested preparation exceeds maximum daily production capacity");
    if (suggestedQuantity === 0) {
      availableSellable = Math.max(0, availableSellable - window.forecastQuantity!);
      continue;
    }
    const expectedSellable = suggestedQuantity * (1 - wasteRate);
    sellableProduced += expectedSellable;
    const productionMinutes = Math.ceil(suggestedQuantity / minBatch) * prepMinutes;
    const readyAtMs = Date.parse(window.start);
    batches.push({
      period: window.period,
      start: window.start,
      end: window.end,
      forecastQuantity: window.forecastQuantity!,
      requestedGrossQuantity: grossNeeded,
      suggestedQuantity,
      expectedSellableQuantity: expectedSellable,
      expectedWasteQuantity: suggestedQuantity - expectedSellable,
      preparationMinutes: productionMinutes,
      preparationStart: new Date(readyAtMs - productionMinutes * 60_000).toISOString(),
      readyAt: new Date(readyAtMs).toISOString(),
      capacity,
      availableStaff: window.availableStaff!,
      evidence: window.evidence,
    });
    dailyGross += suggestedQuantity;
    availableSellable = Math.max(0, availableSellable + expectedSellable - window.forecastQuantity!);
  }

  if (blockers.length > 0) {
    return {
      productId: input.productId,
      productName: input.productName,
      status: "blocked",
      approvalState: "blocked",
      executionAllowed: false,
      formula: "forecast + safety buffer - ready stock - in-progress stock",
      forecastQuantity: forecast,
      safetyBuffer: safety,
      readyStock: ready,
      inProgressStock: inProgress,
      netPreparationRequirement: netRequirement,
      suggestedGrossPreparation: null,
      expectedSellablePreparation: null,
      expectedRemainingQuantity: null,
      expectedWasteQuantity: null,
      expectedStockoutAt: estimateStockoutAt(orderedWindows, ready + inProgress),
      wasteRisk: "not_assessed",
      batches: [],
      blockers: [...new Set(blockers)],
      evidence: input.evidence,
    };
  }

  const expectedSellablePreparation = batches.reduce((sum, batch) => sum + batch.expectedSellableQuantity, 0);
  const expectedWasteQuantity = batches.reduce((sum, batch) => sum + batch.expectedWasteQuantity, 0);
  const expectedRemainingQuantity = Math.max(0, ready + inProgress + expectedSellablePreparation - forecast);
  const excessRatio = forecast > 0 ? expectedRemainingQuantity / forecast : expectedRemainingQuantity > 0 ? 1 : 0;
  const wasteRisk = excessRatio > 0.2 || wasteRate > 0.15 ? "high" : excessRatio > 0.1 || wasteRate > 0.08 ? "medium" : "low";

  return {
    productId: input.productId,
    productName: input.productName,
    status: "recommendation",
    approvalState: "manager_review_required",
    executionAllowed: false,
    formula: "forecast + safety buffer - ready stock - in-progress stock",
    forecastQuantity: forecast,
    safetyBuffer: safety,
    readyStock: ready,
    inProgressStock: inProgress,
    netPreparationRequirement: netRequirement,
    suggestedGrossPreparation: dailyGross,
    expectedSellablePreparation,
    expectedRemainingQuantity,
    expectedWasteQuantity,
    expectedStockoutAt: null,
    wasteRisk,
    batches,
    blockers: [],
    evidence: input.evidence,
  };
}
