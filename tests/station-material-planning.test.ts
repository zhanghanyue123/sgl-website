import test from "node:test";
import assert from "node:assert/strict";
import { planMaterialRequirements } from "../lib/station-intelligence/material-planning";

const completeMaterial = {
  materialId: "beans",
  name: "Coffee beans",
  unit: "kg",
  currentStock: 2,
  reservedStock: 0.5,
  incomingPurchase: 1,
  safetyStock: 1,
  leadTimeDays: 4,
  moq: 5,
  supplier: "Confirmed Coffee Supplier",
};

function plan(overrides: Partial<Parameters<typeof planMaterialRequirements>[0]> = {}) {
  return planMaterialRequirements({
    planningDate: "2026-11-10",
    forecastHorizonDays: 2,
    productDemand: [{ productId: "coffee", forecastQuantity: 20, skuConfirmed: true }],
    boms: [{ productId: "coffee", confirmed: true, components: [{ materialId: "beans", quantityPerProduct: 0.02, unit: "kg" }] }],
    materials: [completeMaterial],
    ...overrides,
  });
}

test("converts demand through confirmed real BOMs and aggregates material quantities", () => {
  const result = plan({
    productDemand: [
      { productId: "coffee", forecastQuantity: 20, skuConfirmed: true },
      { productId: "espresso", forecastQuantity: 10, skuConfirmed: true },
    ],
    boms: [
      { productId: "coffee", confirmed: true, components: [{ materialId: "beans", quantityPerProduct: 0.02, unit: "kg" }] },
      { productId: "espresso", confirmed: true, components: [{ materialId: "beans", quantityPerProduct: 0.01, unit: "kg" }] },
    ],
  });
  assert.equal(result.requirements[0].requiredQuantity, 0.5);
  assert.deepEqual(result.productBlockers, []);
});

test("unconfirmed SKU or BOM is blocked and never converted into inferred materials", () => {
  const result = plan({
    productDemand: [
      { productId: "draft-sku", forecastQuantity: 50, skuConfirmed: false },
      { productId: "coffee", forecastQuantity: 20, skuConfirmed: true },
    ],
    boms: [
      { productId: "draft-sku", confirmed: true, components: [{ materialId: "milk", quantityPerProduct: 1, unit: "L" }] },
      { productId: "coffee", confirmed: false, components: [{ materialId: "beans", quantityPerProduct: 0.02, unit: "kg" }] },
    ],
  });
  assert.equal(result.requirements.length, 0);
  assert.deepEqual(result.productBlockers, [
    { productId: "draft-sku", reason: "sku_not_confirmed" },
    { productId: "coffee", reason: "bom_not_confirmed" },
  ]);
  assert.deepEqual(result.purchaseDrafts, []);
});

test("missing inventory fields remain Not Recorded and block calculations and drafts", () => {
  const result = plan({ materials: [{ materialId: "beans", currentStock: 0, reservedStock: null }] });
  const requirement = result.requirements[0];
  assert.equal(requirement.currentStock, 0);
  assert.equal(requirement.reservedStock, null);
  assert.equal(requirement.status, "not_recorded");
  assert.equal(requirement.shortage, null);
  assert.equal(requirement.reorderPoint, null);
  assert.equal(requirement.suggestedPurchaseQuantity, null);
  assert.equal(requirement.purchaseDraft, null);
  assert.match(requirement.blockers.join("\n"), /reservedStock: Not Recorded/);
  assert.deepEqual(result.purchaseDrafts, []);
});

test("calculates shortage, lead-time reorder point, MOQ quantity and arrival", () => {
  const result = plan({
    forecastHorizonDays: 2,
    productDemand: [{ productId: "coffee", forecastQuantity: 200, skuConfirmed: true }],
  });
  const requirement = result.requirements[0];
  assert.equal(requirement.requiredQuantity, 4);
  assert.equal(requirement.shortage, 2.5);
  assert.equal(requirement.reorderPoint, 9);
  assert.equal(requirement.suggestedPurchaseQuantity, 10);
  assert.equal(requirement.estimatedArrival, "2026-11-14");
  assert.equal(requirement.purchaseDraft?.status, "human_approval_required");
  assert.equal(requirement.purchaseDraft?.createsPurchaseOrder, false);
});

test("purchase draft keys are stable and recommendations never claim execution", () => {
  const input = {
    forecastHorizonDays: 2,
    productDemand: [{ productId: "coffee", forecastQuantity: 200, skuConfirmed: true }],
  };
  const first = plan(input).purchaseDrafts[0];
  const second = plan(input).purchaseDrafts[0];
  assert.equal(first.idempotencyKey, second.idempotencyKey);
  assert.match(first.idempotencyKey, /^station-purchase-draft:[a-f0-9]{32}$/);
  assert.equal(first.status, "human_approval_required");
  assert.equal(first.createsPurchaseOrder, false);
});
