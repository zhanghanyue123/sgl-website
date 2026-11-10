import { randomUUID } from "node:crypto";
import { getDb, toJson } from "@/lib/admin/db";
import type { ContentDraftActor, ContentDraftKind, ContentDraftModule, ContentDraftRecord, ContentDraftStatus } from "./types";
import { assertDraftTransition, publishingEnabled, workflowAction } from "./workflow";

export type NewDraft = {
  module: ContentDraftModule;
  kind: ContentDraftKind;
  productId?: string | null;
  title: string;
  locale?: "en" | "zh-CN" | null;
  channel?: string | null;
  payload: Record<string, unknown>;
  sourceSnapshot?: Record<string, unknown>;
  generationMetadata?: Record<string, unknown>;
};

const actorColumns = (actor: ContentDraftActor) => actor.type === "admin"
  ? { adminId: actor.adminId, clientId: null }
  : { adminId: null, clientId: actor.clientId };

export async function createContentDraft(input: NewDraft, actor: ContentDraftActor) {
  const db = getDb();
  return db.begin(async (tx) => {
    const id = randomUUID(); const ids = actorColumns(actor);
    const rows = await tx<ContentDraftRecord[]>`INSERT INTO content_drafts (
      id,module,kind,product_id,title,locale,channel,payload,source_snapshot,generation_metadata,
      created_by_admin_id,created_by_agent_client_id
    ) VALUES (
      ${id},${input.module},${input.kind},${input.productId || null},${input.title},${input.locale || null},${input.channel || null},
      ${tx.json(toJson(input.payload))},${tx.json(toJson(input.sourceSnapshot || {}))},${tx.json(toJson(input.generationMetadata || {}))},
      ${ids.adminId},${ids.clientId}
    ) RETURNING *`;
    const action = Object.keys(input.generationMetadata || {}).length ? "generated" : "created";
    await tx`INSERT INTO content_draft_events (id,draft_id,actor_type,actor_admin_id,actor_agent_client_id,action,after_data)
      VALUES (${randomUUID()},${id},${actor.type},${ids.adminId},${ids.clientId},${action},${tx.json(toJson({ status: "draft", version: 1 }))})`;
    if (actor.type === "admin") await tx`INSERT INTO audit_logs (id,actor_user_id,action,entity_type,entity_id,after_data,request_id)
      VALUES (${randomUUID()},${actor.adminId},${`content_draft.${action}`},'content_draft',${id},${tx.json(toJson({ module: input.module, kind: input.kind, status: "draft" }))},${actor.requestId || null})`;
    return rows[0];
  });
}

export async function listContentDrafts(module: ContentDraftModule, status?: ContentDraftStatus) {
  return getDb()<ContentDraftRecord[]>`SELECT d.*,p.slug AS product_slug,COALESCE(l.title,p.slug) AS product_title
    FROM content_drafts d LEFT JOIN products p ON p.id=d.product_id
    LEFT JOIN product_localizations l ON l.product_id=p.id AND l.locale='en'
    WHERE d.module=${module} AND (${status || null}::text IS NULL OR d.status=${status || null})
    ORDER BY d.updated_at DESC LIMIT 250`;
}

export async function getContentDraft(id: string) {
  const rows = await getDb()<ContentDraftRecord[]>`SELECT d.*,p.slug AS product_slug,COALESCE(l.title,p.slug) AS product_title
    FROM content_drafts d LEFT JOIN products p ON p.id=d.product_id
    LEFT JOIN product_localizations l ON l.product_id=p.id AND l.locale='en' WHERE d.id=${id} LIMIT 1`;
  return rows[0] || null;
}

export async function updateContentDraft(input: {
  id: string;
  expectedVersion: number;
  title?: string;
  payload?: Record<string, unknown>;
  nextStatus?: ContentDraftStatus;
  canApprove: boolean;
}, actor: Extract<ContentDraftActor, { type: "admin" }>) {
  return getDb().begin(async (tx) => {
    const rows = await tx<ContentDraftRecord[]>`SELECT * FROM content_drafts WHERE id=${input.id} FOR UPDATE`;
    const before = rows[0];
    if (!before || before.version !== input.expectedVersion) return null;
    const nextStatus = input.nextStatus || before.status;
    if (input.nextStatus) assertDraftTransition({ from: before.status, to: input.nextStatus, canApprove: input.canApprove, externalPublishingEnabled: publishingEnabled() });
    if ((input.title !== undefined || input.payload !== undefined) && !new Set(["draft", "review"]).has(before.status)) {
      throw new Error("Approved or published drafts must be returned to review before editing");
    }
    const title = input.title ?? before.title;
    const payload = input.payload ?? before.payload;
    const updated = await tx<ContentDraftRecord[]>`UPDATE content_drafts SET
      title=${title},payload=${tx.json(toJson(payload))},status=${nextStatus},version=version+1,updated_at=now(),
      reviewed_by=CASE WHEN ${nextStatus}='draft' THEN NULL WHEN ${nextStatus} IN ('review','approved','published') THEN COALESCE(reviewed_by,${actor.adminId}) END,
      reviewed_at=CASE WHEN ${nextStatus}='draft' THEN NULL WHEN ${nextStatus} IN ('review','approved','published') THEN COALESCE(reviewed_at,now()) END,
      approved_by=CASE WHEN ${nextStatus} IN ('draft','review') THEN NULL WHEN ${nextStatus} IN ('approved','published') THEN COALESCE(approved_by,${actor.adminId}) END,
      approved_at=CASE WHEN ${nextStatus} IN ('draft','review') THEN NULL WHEN ${nextStatus} IN ('approved','published') THEN COALESCE(approved_at,now()) END,
      published_by=CASE WHEN ${nextStatus}='published' THEN COALESCE(published_by,${actor.adminId}) ELSE NULL END,
      published_at=CASE WHEN ${nextStatus}='published' THEN COALESCE(published_at,now()) ELSE NULL END
      WHERE id=${input.id} AND version=${input.expectedVersion} RETURNING *`;
    const after = updated[0]; if (!after) return null;
    const action = input.nextStatus ? workflowAction(before.status, input.nextStatus) : "edited";
    await tx`INSERT INTO content_draft_events (id,draft_id,actor_type,actor_admin_id,action,before_data,after_data)
      VALUES (${randomUUID()},${input.id},'admin',${actor.adminId},${action},${tx.json(toJson({ title: before.title, payload: before.payload, status: before.status, version: before.version }))},${tx.json(toJson({ title: after.title, payload: after.payload, status: after.status, version: after.version }))})`;
    await tx`INSERT INTO audit_logs (id,actor_user_id,action,entity_type,entity_id,before_data,after_data,request_id)
      VALUES (${randomUUID()},${actor.adminId},${`content_draft.${action}`},'content_draft',${input.id},${tx.json(toJson({ status: before.status, version: before.version }))},${tx.json(toJson({ status: after.status, version: after.version }))},${actor.requestId || null})`;
    return after;
  });
}

export async function readProductContentContext(productId: string) {
  const rows = await getDb()<{
    id: string; slug: string; category: string; badge: string | null; details: unknown;
    localizations: unknown; variants: unknown;
  }[]>`SELECT p.id,p.slug,c.slug AS category,p.badge,p.details,
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object('locale',l.locale,'title',l.title,'description',l.description,'seoTitle',l.seo_title,'seoDescription',l.seo_description)) FILTER (WHERE l.locale IS NOT NULL),'[]'::jsonb) AS localizations,
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id',v.id,'sku',v.sku,'title',v.title,'options',v.options,'active',v.active)) FILTER (WHERE v.id IS NOT NULL),'[]'::jsonb) AS variants
    FROM products p JOIN product_categories c ON c.id=p.category_id
    LEFT JOIN product_localizations l ON l.product_id=p.id LEFT JOIN product_variants v ON v.product_id=p.id
    WHERE p.id=${productId} GROUP BY p.id,c.slug LIMIT 1`;
  return rows[0] || null;
}

export type MarketingEvidence = { id: string; label: string; value: string };
export async function readMarketingContext() {
  const db = getDb();
  const overall = await db<{ orders_30d: number; paid_revenue_cents_30d: string }[]>`SELECT
    count(*) FILTER (WHERE created_at>=now()-interval '30 days')::int AS orders_30d,
    COALESCE(sum(total_cents) FILTER (WHERE paid_at>=now()-interval '30 days' AND payment_status IN ('paid','partially_refunded')),0)::text AS paid_revenue_cents_30d FROM orders`;
  const products = await db<{ id: string; slug: string; title: string; status: string; units_30d: number; revenue_cents_30d: string; available: number }[]>`SELECT
      p.id,p.slug,COALESCE(l.title,p.slug) AS title,p.status,
      COALESCE(sum(oi.quantity) FILTER (WHERE o.paid_at>=now()-interval '30 days' AND o.payment_status IN ('paid','partially_refunded')),0)::int AS units_30d,
      COALESCE(sum(oi.line_total_cents) FILTER (WHERE o.paid_at>=now()-interval '30 days' AND o.payment_status IN ('paid','partially_refunded')),0)::text AS revenue_cents_30d,
      COALESCE((SELECT sum(i.available)::int FROM product_variants v JOIN inventory_levels i ON i.variant_id=v.id WHERE v.product_id=p.id AND v.active),0) AS available
    FROM products p LEFT JOIN product_localizations l ON l.product_id=p.id AND l.locale='en'
    LEFT JOIN order_items oi ON oi.product_id=p.id LEFT JOIN orders o ON o.id=oi.order_id
    WHERE p.status IN ('published','unpublished') GROUP BY p.id,l.title ORDER BY units_30d DESC,p.updated_at DESC`;
  const facts: MarketingEvidence[] = [
    { id: "overall.orders_30d", label: "Orders created in the last 30 days", value: String(overall[0]?.orders_30d || 0) },
    { id: "overall.paid_revenue_cents_30d", label: "Paid revenue in cents in the last 30 days", value: overall[0]?.paid_revenue_cents_30d || "0" }
  ];
  for (const product of products) facts.push(
    { id: `product.${product.id}.units_30d`, label: `${product.title} paid units in the last 30 days`, value: String(product.units_30d) },
    { id: `product.${product.id}.revenue_cents_30d`, label: `${product.title} paid revenue in cents in the last 30 days`, value: product.revenue_cents_30d },
    { id: `product.${product.id}.available`, label: `${product.title} available inventory`, value: String(product.available) }
  );
  return { products, facts, dataWindow: "rolling_30_days_at_generation_time" };
}
