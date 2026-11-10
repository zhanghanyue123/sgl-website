import { createHash } from "node:crypto";

export type ProductDemand = {
  productId: string;
  forecastQuantity: number;
  skuConfirmed: boolean;
};

export type BomComponent = {
  materialId: string;
  quantityPerProduct: number;
  unit: string;
};

export type ConfirmedBom = {
  productId: string;
  confirmed: boolean;
  components: BomComponent[];
};

export type MaterialPlanningInput = {
  materialId: string;
  name?: string | null;
  unit?: string | null;
  currentStock?: number | null;
  reservedStock?: number | null;
  incomingPurchase?: number | null;
  safetyStock?: number | null;
  leadTimeDays?: number | null;
  moq?: number | null;
  supplier?: string | null;
};

export type PurchaseDraftRecommendation = {
  idempotencyKey: string;
  materialId: string;
  supplier: string;
  quantity: number;
  estimatedArrival: string;
  status: "human_approval_required";
  createsPurchaseOrder: false;
};

export type MaterialRequirement = {
  materialId: string;
  name: string | null;
  unit: string | null;
  requiredQuantity: number;
  currentStock: number | null;
  reservedStock: number | null;
  incomingPurchase: number | null;
  safetyStock: number | null;
  leadTimeDays: number | null;
  moq: number | null;
  supplier: string | null;
  shortage: number | null;
  reorderPoint: number | null;
  suggestedPurchaseQuantity: number | null;
  estimatedArrival: string | null;
  status: "ready" | "not_recorded";
  blockers: string[];
  purchaseDraft: PurchaseDraftRecommendation | null;
};

export type MaterialPlanningResult = {
  planningDate: string;
  forecastHorizonDays: number;
  requirements: MaterialRequirement[];
  productBlockers: Array<{ productId: string; reason: "sku_not_confirmed" | "bom_not_confirmed" }>;
  purchaseDrafts: PurchaseDraftRecommendation[];
  requiresHumanApproval: true;
};

const REQUIRED_FIELDS = [
  "currentStock",
  "reservedStock",
  "incomingPurchase",
  "safetyStock",
  "leadTimeDays",
  "moq",
] as const;

function nonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function positive(value: unknown): value is number {
  return nonNegative(value) && value > 0;
}

function roundQuantity(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + Math.ceil(days));
  return parsed.toISOString().slice(0, 10);
}

function draftKey(input: {
  planningDate: string;
  forecastHorizonDays: number;
  materialId: string;
  supplier: string;
  quantity: number;
  estimatedArrival: string;
}): string {
  const canonical = [
    input.planningDate,
    input.forecastHorizonDays,
    input.materialId,
    input.supplier,
    input.quantity,
    input.estimatedArrival,
  ].join("|");
  return `station-purchase-draft:${createHash("sha256").update(canonical).digest("hex").slice(0, 32)}`;
}

/**
 * Produces recommendations only. It neither persists a draft nor places an order.
 * Product demand is converted only when both the SKU and its real BOM are confirmed.
 */
export function planMaterialRequirements(input: {
  planningDate: string;
  forecastHorizonDays: number;
  productDemand: ProductDemand[];
  boms: ConfirmedBom[];
  materials: MaterialPlanningInput[];
}): MaterialPlanningResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.planningDate) || Number.isNaN(Date.parse(`${input.planningDate}T00:00:00.000Z`))) {
    throw new TypeError("planningDate must be a valid YYYY-MM-DD date");
  }
  if (!positive(input.forecastHorizonDays)) throw new TypeError("forecastHorizonDays must be greater than zero");

  const confirmedBoms = new Map(
    input.boms.filter((bom) => bom.confirmed === true).map((bom) => [bom.productId, bom]),
  );
  const required = new Map<string, { quantity: number; unit: string }>();
  const productBlockers: MaterialPlanningResult["productBlockers"] = [];

  for (const demand of input.productDemand) {
    if (!nonNegative(demand.forecastQuantity)) throw new TypeError(`Invalid forecast quantity for ${demand.productId}`);
    if (demand.skuConfirmed !== true) {
      productBlockers.push({ productId: demand.productId, reason: "sku_not_confirmed" });
      continue;
    }
    const bom = confirmedBoms.get(demand.productId);
    if (!bom) {
      productBlockers.push({ productId: demand.productId, reason: "bom_not_confirmed" });
      continue;
    }
    for (const component of bom.components) {
      if (!positive(component.quantityPerProduct)) throw new TypeError(`Invalid BOM quantity for ${demand.productId}/${component.materialId}`);
      const existing = required.get(component.materialId);
      if (existing && existing.unit !== component.unit) throw new TypeError(`Conflicting BOM units for ${component.materialId}`);
      required.set(component.materialId, {
        quantity: (existing?.quantity || 0) + demand.forecastQuantity * component.quantityPerProduct,
        unit: component.unit,
      });
    }
  }

  const materialInputs = new Map(input.materials.map((material) => [material.materialId, material]));
  const requirements = [...required.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([materialId, demand]) => {
    const material = materialInputs.get(materialId);
    const blockers: string[] = [];
    if (!material) blockers.push("Material inventory record: Not Recorded");
    for (const field of REQUIRED_FIELDS) {
      const value = material?.[field];
      const valid = field === "moq" ? positive(value) : nonNegative(value);
      if (!valid) blockers.push(`${field}: Not Recorded`);
    }
    const supplier = material?.supplier?.trim() || null;
    if (!supplier) blockers.push("supplier: Not Recorded");
    if (material?.unit && material.unit !== demand.unit) blockers.push("material unit does not match confirmed BOM");

    const complete = blockers.length === 0;
    const currentStock = nonNegative(material?.currentStock) ? material.currentStock : null;
    const reservedStock = nonNegative(material?.reservedStock) ? material.reservedStock : null;
    const incomingPurchase = nonNegative(material?.incomingPurchase) ? material.incomingPurchase : null;
    const safetyStock = nonNegative(material?.safetyStock) ? material.safetyStock : null;
    const leadTimeDays = nonNegative(material?.leadTimeDays) ? material.leadTimeDays : null;
    const moq = positive(material?.moq) ? material.moq : null;
    const requiredQuantity = roundQuantity(demand.quantity);
    let shortage: number | null = null;
    let reorderPoint: number | null = null;
    let suggestedPurchaseQuantity: number | null = null;
    let estimatedArrival: string | null = null;
    let purchaseDraft: PurchaseDraftRecommendation | null = null;

    if (complete && currentStock !== null && reservedStock !== null && incomingPurchase !== null && safetyStock !== null && leadTimeDays !== null && moq !== null && supplier) {
      const netAvailable = currentStock - reservedStock + incomingPurchase;
      shortage = roundQuantity(Math.max(0, requiredQuantity + safetyStock - netAvailable));
      const dailyRequirement = requiredQuantity / input.forecastHorizonDays;
      reorderPoint = roundQuantity(dailyRequirement * leadTimeDays + safetyStock);
      const reorderGap = Math.max(0, reorderPoint - netAvailable);
      suggestedPurchaseQuantity = reorderGap === 0 ? 0 : roundQuantity(Math.ceil(reorderGap / moq) * moq);
      estimatedArrival = addDays(input.planningDate, leadTimeDays);
      if (suggestedPurchaseQuantity > 0) {
        purchaseDraft = {
          idempotencyKey: draftKey({ planningDate: input.planningDate, forecastHorizonDays: input.forecastHorizonDays, materialId, supplier, quantity: suggestedPurchaseQuantity, estimatedArrival }),
          materialId,
          supplier,
          quantity: suggestedPurchaseQuantity,
          estimatedArrival,
          status: "human_approval_required",
          createsPurchaseOrder: false,
        };
      }
    }

    return {
      materialId,
      name: material?.name?.trim() || null,
      unit: material?.unit?.trim() || demand.unit,
      requiredQuantity,
      currentStock,
      reservedStock,
      incomingPurchase,
      safetyStock,
      leadTimeDays,
      moq,
      supplier,
      shortage,
      reorderPoint,
      suggestedPurchaseQuantity,
      estimatedArrival,
      status: complete ? "ready" as const : "not_recorded" as const,
      blockers,
      purchaseDraft,
    };
  });

  return {
    planningDate: input.planningDate,
    forecastHorizonDays: input.forecastHorizonDays,
    requirements,
    productBlockers,
    purchaseDrafts: requirements.flatMap((requirement) => requirement.purchaseDraft ? [requirement.purchaseDraft] : []),
    requiresHumanApproval: true,
  };
}
