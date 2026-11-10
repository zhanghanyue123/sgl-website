export const contentDraftModules = ["product_content", "marketing", "seo_growth"] as const;
export type ContentDraftModule = (typeof contentDraftModules)[number];

export const contentDraftStatuses = ["draft", "review", "approved", "published"] as const;
export type ContentDraftStatus = (typeof contentDraftStatuses)[number];

export type ContentDraftKind = "product_content_bundle" | "weekly_marketing_plan" | "seo_optimization_proposal";

export type ContentDraftActor =
  | { type: "admin"; adminId: string; requestId?: string | null }
  | { type: "agent"; clientId: string; tokenId: string; requestId?: string | null };

export type ContentDraftRecord = {
  id: string;
  module: ContentDraftModule;
  kind: ContentDraftKind;
  status: ContentDraftStatus;
  product_id: string | null;
  product_slug?: string | null;
  product_title?: string | null;
  title: string;
  locale: "en" | "zh-CN" | null;
  channel: string | null;
  payload: Record<string, unknown>;
  source_snapshot: Record<string, unknown>;
  generation_metadata: Record<string, unknown>;
  version: number;
  created_at: Date | string;
  updated_at: Date | string;
  reviewed_at: Date | string | null;
  approved_at: Date | string | null;
  published_at: Date | string | null;
};
