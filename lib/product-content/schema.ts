const text = (value: unknown, name: string, max: number) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`${name} is invalid`);
  return value.trim();
};
const stringList = (value: unknown, name: string, maxItems = 20) => {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`${name} is invalid`);
  return value.map((item, index) => text(item, `${name}[${index}]`, 160));
};

export const productContentJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["descriptions", "seo", "xiaohongshu", "instagram", "campaignConcept"],
  properties: {
    descriptions: { type: "object", additionalProperties: false, required: ["en", "zhCN"], properties: { en: { type: "string" }, zhCN: { type: "string" } } },
    seo: { type: "object", additionalProperties: false, required: ["en", "zhCN"], properties: {
      en: { type: "object", additionalProperties: false, required: ["title", "metaDescription"], properties: { title: { type: "string" }, metaDescription: { type: "string" } } },
      zhCN: { type: "object", additionalProperties: false, required: ["title", "metaDescription"], properties: { title: { type: "string" }, metaDescription: { type: "string" } } }
    } },
    xiaohongshu: { type: "object", additionalProperties: false, required: ["title", "body", "hashtags"], properties: { title: { type: "string" }, body: { type: "string" }, hashtags: { type: "array", items: { type: "string" } } } },
    instagram: { type: "object", additionalProperties: false, required: ["caption", "hashtags"], properties: { caption: { type: "string" }, hashtags: { type: "array", items: { type: "string" } } }, },
    campaignConcept: { type: "object", additionalProperties: false, required: ["name", "summary", "keyMessages", "assetIdeas"], properties: { name: { type: "string" }, summary: { type: "string" }, keyMessages: { type: "array", items: { type: "string" } }, assetIdeas: { type: "array", items: { type: "string" } } } }
  }
} as const;

export type ProductContentPayload = {
  descriptions: { en: string; zhCN: string };
  seo: { en: { title: string; metaDescription: string }; zhCN: { title: string; metaDescription: string } };
  xiaohongshu: { title: string; body: string; hashtags: string[] };
  instagram: { caption: string; hashtags: string[] };
  campaignConcept: { name: string; summary: string; keyMessages: string[]; assetIdeas: string[] };
};

export function parseProductContentPayload(value: unknown): ProductContentPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Product content must be an object");
  const body = value as Record<string, any>;
  return {
    descriptions: { en: text(body.descriptions?.en, "descriptions.en", 4000), zhCN: text(body.descriptions?.zhCN, "descriptions.zhCN", 4000) },
    seo: {
      en: { title: text(body.seo?.en?.title, "seo.en.title", 70), metaDescription: text(body.seo?.en?.metaDescription, "seo.en.metaDescription", 180) },
      zhCN: { title: text(body.seo?.zhCN?.title, "seo.zhCN.title", 70), metaDescription: text(body.seo?.zhCN?.metaDescription, "seo.zhCN.metaDescription", 180) }
    },
    xiaohongshu: { title: text(body.xiaohongshu?.title, "xiaohongshu.title", 80), body: text(body.xiaohongshu?.body, "xiaohongshu.body", 3000), hashtags: stringList(body.xiaohongshu?.hashtags, "xiaohongshu.hashtags") },
    instagram: { caption: text(body.instagram?.caption, "instagram.caption", 2200), hashtags: stringList(body.instagram?.hashtags, "instagram.hashtags", 30) },
    campaignConcept: { name: text(body.campaignConcept?.name, "campaignConcept.name", 120), summary: text(body.campaignConcept?.summary, "campaignConcept.summary", 1200), keyMessages: stringList(body.campaignConcept?.keyMessages, "campaignConcept.keyMessages"), assetIdeas: stringList(body.campaignConcept?.assetIdeas, "campaignConcept.assetIdeas") }
  };
}
