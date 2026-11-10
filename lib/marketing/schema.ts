const text = (value: unknown, name: string, max: number) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`${name} is invalid`);
  return value.trim();
};
const list = (value: unknown, name: string, max: number, item: (value: unknown, index: number) => any) => {
  if (!Array.isArray(value) || value.length > max) throw new Error(`${name} is invalid`);
  return value.map(item);
};
const productIds = (value: unknown, name: string) => list(value, name, 20, (item, index) => text(item, `${name}[${index}]`, 36));
const evidenceIds = (value: unknown, name: string) => list(value, name, 20, (item, index) => text(item, `${name}[${index}]`, 80));
const record = (value: unknown, name: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} is invalid`);
  return value as Record<string, unknown>;
};

export const marketingPlanJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["weekStart", "objective", "recommendations", "calendar", "channelContent", "launchPlan", "weeklyReport"],
  properties: {
    weekStart: { type: "string" }, objective: { type: "string" },
    recommendations: { type: "array", items: { type: "object", additionalProperties: false, required: ["productId", "rationale", "evidenceIds"], properties: { productId: { type: "string" }, rationale: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } } } } },
    calendar: { type: "array", items: { type: "object", additionalProperties: false, required: ["date", "channel", "productIds", "contentBrief", "evidenceIds"], properties: { date: { type: "string" }, channel: { type: "string", enum: ["xiaohongshu", "instagram", "website", "email", "offline"] }, productIds: { type: "array", items: { type: "string" } }, contentBrief: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } } } } },
    channelContent: { type: "array", items: { type: "object", additionalProperties: false, required: ["channel", "productIds", "headline", "body", "hashtags", "evidenceIds"], properties: { channel: { type: "string", enum: ["xiaohongshu", "instagram", "website", "email", "offline"] }, productIds: { type: "array", items: { type: "string" } }, headline: { type: "string" }, body: { type: "string" }, hashtags: { type: "array", items: { type: "string" } }, evidenceIds: { type: "array", items: { type: "string" } } } } },
    launchPlan: { anyOf: [
      { type: "object", additionalProperties: false, required: ["name", "productIds", "concept", "phases", "evidenceIds"], properties: { name: { type: "string" }, productIds: { type: "array", items: { type: "string" } }, concept: { type: "string" }, phases: { type: "array", items: { type: "string" } }, evidenceIds: { type: "array", items: { type: "string" } } } },
      { type: "null" }
    ] },
    weeklyReport: {
      type: "object", additionalProperties: false,
      required: ["summary", "observations", "risks", "nextActions"],
      properties: {
        summary: { type: "string" },
        observations: { type: "array", items: { type: "object", additionalProperties: false, required: ["statement", "evidenceIds"], properties: { statement: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } } } } },
        risks: { type: "array", items: { type: "string" } },
        nextActions: { type: "array", items: { type: "string" } }
      }
    }
  }
} as const;

export type MarketingPlanPayload = {
  weekStart: string;
  objective: string;
  recommendations: { productId: string; rationale: string; evidenceIds: string[] }[];
  calendar: { date: string; channel: "xiaohongshu" | "instagram" | "website" | "email" | "offline"; productIds: string[]; contentBrief: string; evidenceIds: string[] }[];
  channelContent: { channel: "xiaohongshu" | "instagram" | "website" | "email" | "offline"; productIds: string[]; headline: string; body: string; hashtags: string[]; evidenceIds: string[] }[];
  launchPlan: null | { name: string; productIds: string[]; concept: string; phases: string[]; evidenceIds: string[] };
  weeklyReport: { summary: string; observations: { statement: string; evidenceIds: string[] }[]; risks: string[]; nextActions: string[] };
};

export function parseMarketingPlanPayload(value: unknown, allowedProductIds?: ReadonlySet<string>, allowedEvidenceIds?: ReadonlySet<string>): MarketingPlanPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Marketing plan must be an object");
  const body = value as Record<string, any>;
  const checkProducts = (ids: string[]) => { if (allowedProductIds && ids.some((id) => !allowedProductIds.has(id))) throw new Error("Marketing plan references an unknown product"); return ids; };
  const checkEvidence = (ids: string[]) => { if (allowedEvidenceIds && ids.some((id) => !allowedEvidenceIds.has(id))) throw new Error("Marketing plan references unknown evidence"); return ids; };
  const recommendations = list(body.recommendations, "recommendations", 20, (item, index) => { const row = record(item, `recommendations[${index}]`); return { productId: checkProducts(productIds([row.productId], `recommendations[${index}].productId`))[0], rationale: text(row.rationale, `recommendations[${index}].rationale`, 800), evidenceIds: checkEvidence(evidenceIds(row.evidenceIds, `recommendations[${index}].evidenceIds`)) }; });
  const calendar = list(body.calendar, "calendar", 31, (item, index) => {
    const row = record(item, `calendar[${index}]`);
    const channel = text(row.channel, `calendar[${index}].channel`, 20) as MarketingPlanPayload["calendar"][number]["channel"];
    if (!["xiaohongshu", "instagram", "website", "email", "offline"].includes(channel)) throw new Error(`calendar[${index}].channel is invalid`);
    return { date: text(row.date, `calendar[${index}].date`, 10), channel, productIds: checkProducts(productIds(row.productIds, `calendar[${index}].productIds`)), contentBrief: text(row.contentBrief, `calendar[${index}].contentBrief`, 1200), evidenceIds: checkEvidence(evidenceIds(row.evidenceIds, `calendar[${index}].evidenceIds`)) };
  });
  const channelContent = list(body.channelContent, "channelContent", 30, (item, index) => {
    const row = record(item, `channelContent[${index}]`);
    const channel = text(row.channel, `channelContent[${index}].channel`, 20) as MarketingPlanPayload["channelContent"][number]["channel"];
    if (!["xiaohongshu", "instagram", "website", "email", "offline"].includes(channel)) throw new Error(`channelContent[${index}].channel is invalid`);
    return { channel, productIds: checkProducts(productIds(row.productIds, `channelContent[${index}].productIds`)), headline: text(row.headline, `channelContent[${index}].headline`, 160), body: text(row.body, `channelContent[${index}].body`, 4000), hashtags: list(row.hashtags, `channelContent[${index}].hashtags`, 30, (tag, tagIndex) => text(tag, `channelContent[${index}].hashtags[${tagIndex}]`, 100)), evidenceIds: checkEvidence(evidenceIds(row.evidenceIds, `channelContent[${index}].evidenceIds`)) };
  });
  let launchPlan: MarketingPlanPayload["launchPlan"] = null;
  if (body.launchPlan != null) launchPlan = { name: text(body.launchPlan.name, "launchPlan.name", 160), productIds: checkProducts(productIds(body.launchPlan.productIds, "launchPlan.productIds")), concept: text(body.launchPlan.concept, "launchPlan.concept", 1600), phases: list(body.launchPlan.phases, "launchPlan.phases", 12, (item, index) => text(item, `launchPlan.phases[${index}]`, 500)), evidenceIds: checkEvidence(evidenceIds(body.launchPlan.evidenceIds, "launchPlan.evidenceIds")) };
  const observations = list(body.weeklyReport?.observations, "weeklyReport.observations", 30, (item, index) => { const row = record(item, `weeklyReport.observations[${index}]`); return { statement: text(row.statement, `weeklyReport.observations[${index}].statement`, 800), evidenceIds: checkEvidence(evidenceIds(row.evidenceIds, `weeklyReport.observations[${index}].evidenceIds`)) }; });
  return { weekStart: text(body.weekStart, "weekStart", 10), objective: text(body.objective, "objective", 800), recommendations, calendar, channelContent, launchPlan, weeklyReport: { summary: text(body.weeklyReport?.summary, "weeklyReport.summary", 1600), observations, risks: list(body.weeklyReport?.risks, "weeklyReport.risks", 20, (item, index) => text(item, `weeklyReport.risks[${index}]`, 500)), nextActions: list(body.weeklyReport?.nextActions, "weeklyReport.nextActions", 20, (item, index) => text(item, `weeklyReport.nextActions[${index}]`, 500)) } };
}
