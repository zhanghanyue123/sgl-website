import { randomUUID } from "node:crypto";
import type { TransactionSql } from "postgres";
import { toJson } from "@/lib/admin/db";

const eventTypes = ["support.conversation.created", "support.conversation.updated", "support.ticket.created", "support.ticket.updated"] as const;
const aggregateTypes = ["support_conversation", "support_ticket"] as const;

export type WebsiteSupportEventInput = {
  organizationId: string;
  storeId?: string | null;
  eventType: (typeof eventTypes)[number];
  aggregateType: (typeof aggregateTypes)[number];
  aggregateId: string;
  dedupeKey: string;
  payload?: Record<string, unknown>;
};

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function enqueueWebsiteSupportEvent(tx: TransactionSql, input: WebsiteSupportEventInput) {
  if (!uuid(input.organizationId) || (input.storeId && !uuid(input.storeId))) throw new Error("invalid_support_event_scope");
  if (!eventTypes.includes(input.eventType) || !aggregateTypes.includes(input.aggregateType)) throw new Error("invalid_support_event_type");
  if (input.aggregateId.length < 1 || input.aggregateId.length > 200 || input.dedupeKey.length < 8 || input.dedupeKey.length > 200) throw new Error("invalid_support_event_identity");
  const id = randomUUID();
  const rows = await tx<{ id: string }[]>`INSERT INTO integration_outbox
    (id,organization_id,store_id,destination,source,event_type,aggregate_type,aggregate_id,payload,dedupe_key)
    VALUES(${id},${input.organizationId},${input.storeId || null},'retail_agent','website',${input.eventType},${input.aggregateType},${input.aggregateId},${tx.json(toJson(input.payload || {}))},${input.dedupeKey})
    ON CONFLICT(destination,dedupe_key) DO NOTHING RETURNING id`;
  return { id: rows[0]?.id ?? null, created: Boolean(rows[0]?.id) };
}
