import { assertEvidenceReferences } from "./evidence";
import type { SeoEvidence } from "./types";

const changeTypes = ["seo_title", "meta_description", "h1", "h2", "image_alt", "internal_link", "product_description", "category_description", "multilingual_metadata", "structured_data", "canonical", "redirect", "robots", "noindex"] as const;
const sensitive = new Set<string>(["canonical", "redirect", "robots", "noindex"]);
export type SeoChangeType = (typeof changeTypes)[number];

export type SeoOptimizationProposal = {
  pageUrl: string;
  targetLocale: string;
  summary: string;
  changes: Array<{
    type: SeoChangeType;
    currentValue: string | null;
    recommendedValue: string;
    rationale: string;
    evidenceIds: string[];
    requiresExplicitApproval: boolean;
  }>;
  productContentCoordination: null | { productId: string; requestedFields: string[] };
};

export const seoOptimizationJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["pageUrl", "targetLocale", "summary", "changes", "productContentCoordination"],
  properties: {
    pageUrl: { type: "string" }, targetLocale: { type: "string" }, summary: { type: "string" },
    changes: { type: "array", items: { type: "object", additionalProperties: false, required: ["type", "currentValue", "recommendedValue", "rationale", "evidenceIds", "requiresExplicitApproval"], properties: {
      type: { type: "string", enum: changeTypes }, currentValue: { anyOf: [{ type: "string" }, { type: "null" }] }, recommendedValue: { type: "string" }, rationale: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } }, requiresExplicitApproval: { type: "boolean" }
    } } },
    productContentCoordination: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["productId", "requestedFields"], properties: { productId: { type: "string" }, requestedFields: { type: "array", items: { type: "string" } } } }] }
  }
} as const;

const requiredText = (value: unknown, name: string, max: number) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`${name} is invalid`);
  return value.trim();
};

export function parseSeoOptimizationProposal(value: unknown, evidence: readonly SeoEvidence[], allowedProductIds?: ReadonlySet<string>): SeoOptimizationProposal {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("SEO proposal must be an object");
  const body = value as Record<string, any>;
  const pageUrl = requiredText(body.pageUrl, "pageUrl", 2048); const parsed = new URL(pageUrl);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("pageUrl is invalid");
  if (!Array.isArray(body.changes) || body.changes.length === 0 || body.changes.length > 30) throw new Error("changes is invalid");
  const changes = body.changes.map((item: any, index: number) => {
    if (!item || typeof item !== "object" || !changeTypes.includes(item.type)) throw new Error(`changes[${index}].type is invalid`);
    const type = item.type as SeoChangeType;
    const references = Array.isArray(item.evidenceIds) ? item.evidenceIds.map((id: unknown) => requiredText(id, `changes[${index}].evidenceIds`, 160)) : [];
    const requiresExplicitApproval = sensitive.has(type);
    if (item.requiresExplicitApproval !== requiresExplicitApproval) throw new Error(`changes[${index}] approval classification is invalid`);
    return { type, currentValue: item.currentValue === null ? null : requiredText(item.currentValue, `changes[${index}].currentValue`, 5000), recommendedValue: requiredText(item.recommendedValue, `changes[${index}].recommendedValue`, 5000), rationale: requiredText(item.rationale, `changes[${index}].rationale`, 1200), evidenceIds: assertEvidenceReferences(references, evidence), requiresExplicitApproval };
  });
  let coordination: SeoOptimizationProposal["productContentCoordination"] = null;
  if (body.productContentCoordination != null) {
    const productId = requiredText(body.productContentCoordination.productId, "productContentCoordination.productId", 36);
    if (allowedProductIds && !allowedProductIds.has(productId)) throw new Error("SEO proposal references an unknown product");
    if (!Array.isArray(body.productContentCoordination.requestedFields) || body.productContentCoordination.requestedFields.length > 20) throw new Error("requestedFields is invalid");
    coordination = { productId, requestedFields: body.productContentCoordination.requestedFields.map((item: unknown) => requiredText(item, "requestedFields", 120)) };
  }
  return { pageUrl, targetLocale: requiredText(body.targetLocale, "targetLocale", 20), summary: requiredText(body.summary, "summary", 1600), changes, productContentCoordination: coordination };
}
