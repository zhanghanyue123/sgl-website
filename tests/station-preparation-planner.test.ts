import test from "node:test";
import assert from "node:assert/strict";
import {
  planPreparation,
  type PreparationPlannerInput,
  type PreparationWindowInput,
} from "../lib/station-intelligence/preparation-planner";

const observedAt = "2026-11-10T08:00:00.000Z";
const evidence = [{ source: "Station OS", sourceRef: "/ops/sales/history", observedAt }];

function window(
  period: PreparationWindowInput["period"],
  start: string,
  end: string,
  forecastQuantity: number | null,
): PreparationWindowInput {
  return { period, start, end, forecastQuantity, availableStaff: 2, maxProductionCapacity: 100, evidence };
}

function completeInput(overrides: Partial<PreparationPlannerInput> = {}): PreparationPlannerInput {
  return {
    productId: "coffee",
    productName: "Coffee",
    forecastQuantity: 100,
    safetyBuffer: 10,
    readyStock: 20,
    inProgressStock: 10,
    wasteRate: 0.1,
    shelfLifeMinutes: 240,
    readyStockRemainingShelfLifeMinutes: 240,
    minimumBatchSize: 10,
    maximumDailyCapacity: 200,
    requiredStaffPerBatch: 1,
    preparationMinutesPerBatch: 10,
    foodSafety: { approvedForPreparation: true, maximumHoldMinutes: 240, controls: ["Temperature log"] },
    windows: [
      window("opening", "2026-11-11T00:00:00.000Z", "2026-11-11T01:00:00.000Z", 20),
      window("morning", "2026-11-11T01:00:00.000Z", "2026-11-11T03:00:00.000Z", 30),
      window("afternoon", "2026-11-11T03:00:00.000Z", "2026-11-11T05:00:00.000Z", 35),
      window("evening", "2026-11-11T05:00:00.000Z", "2026-11-11T07:00:00.000Z", 15),
    ],
    evidence,
    ...overrides,
  };
}

test("uses the explicit net requirement formula and phases production", () => {
  const plan = planPreparation(completeInput());

  assert.equal(plan.status, "recommendation");
  assert.equal(plan.approvalState, "manager_review_required");
  assert.equal(plan.executionAllowed, false);
  assert.equal(plan.formula, "forecast + safety buffer - ready stock - in-progress stock");
  assert.equal(plan.netPreparationRequirement, 80);
  assert.ok(plan.batches.length >= 2);
  assert.ok(plan.batches.every((batch) => batch.suggestedQuantity % 10 === 0));
  assert.equal(plan.suggestedGrossPreparation, plan.batches.reduce((sum, batch) => sum + batch.suggestedQuantity, 0));
  assert.ok((plan.expectedSellablePreparation || 0) >= 80);
  assert.ok((plan.expectedRemainingQuantity || 0) >= 10);
  assert.equal(plan.expectedStockoutAt, null);
});

test("does not treat Not Recorded inventory as zero", () => {
  const plan = planPreparation(completeInput({ readyStock: null }));

  assert.equal(plan.status, "blocked");
  assert.equal(plan.approvalState, "blocked");
  assert.equal(plan.netPreparationRequirement, null);
  assert.equal(plan.suggestedGrossPreparation, null);
  assert.deepEqual(plan.batches, []);
  assert.ok(plan.blockers.includes("Ready stock is Not Recorded"));
});

test("blocks a formal plan when any period forecast or evidence is missing", () => {
  const windows = completeInput().windows.map((item) => item.period === "afternoon" ? { ...item, forecastQuantity: null, evidence: [] } : item);
  const plan = planPreparation(completeInput({ windows }));

  assert.equal(plan.status, "blocked");
  assert.equal(plan.suggestedGrossPreparation, null);
  assert.ok(plan.blockers.includes("afternoon forecast quantity is Not Recorded"));
  assert.ok(plan.blockers.includes("afternoon forecast evidence is incomplete"));
});

test("enforces staff and production capacity without returning an executable quantity", () => {
  const windows = completeInput().windows.map((item) => item.period === "opening"
    ? { ...item, availableStaff: 0, forecastQuantity: 80 }
    : { ...item, forecastQuantity: item.period === "morning" ? 10 : item.period === "afternoon" ? 5 : 5 });
  const plan = planPreparation(completeInput({ readyStock: 0, inProgressStock: 0, windows }));

  assert.equal(plan.status, "blocked");
  assert.equal(plan.suggestedGrossPreparation, null);
  assert.equal(plan.executionAllowed, false);
  assert.deepEqual(plan.batches, []);
  assert.ok(plan.blockers.some((item) => item.includes("opening preparation exceeds")));
  assert.ok(plan.expectedStockoutAt);
});

test("blocks batches that would outlive shelf-life or food-safety hold limits", () => {
  const plan = planPreparation(completeInput({
    shelfLifeMinutes: 45,
    foodSafety: { approvedForPreparation: true, maximumHoldMinutes: 30, controls: ["Cold holding log"] },
  }));

  assert.equal(plan.status, "blocked");
  assert.equal(plan.wasteRisk, "not_assessed");
  assert.ok(plan.blockers.some((item) => item.includes("shorter sub-batch interval")));
});

test("requires confirmed food-safety controls and manager approval", () => {
  const plan = planPreparation(completeInput({
    foodSafety: { approvedForPreparation: false, maximumHoldMinutes: 240, controls: [] },
  }));

  assert.equal(plan.status, "blocked");
  assert.equal(plan.executionAllowed, false);
  assert.ok(plan.blockers.includes("Food-safety preparation approval is not confirmed"));
  assert.ok(plan.blockers.includes("Food-safety controls are not recorded"));
});
