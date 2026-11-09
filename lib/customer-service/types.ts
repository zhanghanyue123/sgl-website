export const supportCategories = [
  "product_enquiry", "order_issue", "payment_issue", "shipping_delay", "damaged_item",
  "wrong_item", "return_exchange", "general_feedback"
] as const;
export type SupportCategory = (typeof supportCategories)[number];
export type SupportPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "pending" | "resolved";
export const supportLocales = ["en", "zh-CN", "ja-JP", "ko-KR", "it-IT"] as const;
export type SupportLocale = (typeof supportLocales)[number];

export type PublicProductFact = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  details: string[];
  variants: Array<{ options: Array<{ name: string; value: string }> }>;
};

export type ApprovedPolicyFact = { id: string; title: string; category: string; body: string };
export type SupportEvidence = { id: string; kind: "product" | "policy"; label: string };
export type ConversationContextMessage = {
  senderType: "customer" | "ai" | "staff" | "system";
  body: string;
};
export type CommercialIntent = {
  kind: "product_discovery" | "product_comparison" | "purchase_interest" | "store_activity" | "wholesale_retail_partnership" | "event_collaboration" | "shipping_returns" | "order_support" | "general_support";
  strength: "low" | "medium" | "high";
  productSlugs: string[];
  needsHuman: boolean;
};
export type SupportAnswer = {
  answer: string;
  category: SupportCategory;
  confidence: "grounded" | "limited";
  evidenceIds: string[];
  humanHandoffRecommended: boolean;
  source: "website";
  commercialIntent: CommercialIntent;
};

export type SupportChatResult = SupportAnswer | { aiLocked: true; reason: "human_handoff" };
