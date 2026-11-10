import { randomBytes, randomUUID } from "node:crypto";
import type { TransactionSql } from "postgres";
import { getDb, toJson } from "@/lib/admin/db";
import { hashToken } from "@/lib/admin/security";

const supportEventTypes = [
  "support.conversation.created",
  "support.conversation.updated",
  "support.ticket.created",
  "support.ticket.updated"
] as const;
const aggregateTypes = ["support_conversation", "support_ticket"] as const;
const supportCategories = [
  "product_enquiry", "order_issue", "payment_issue", "shipping_delay", "damaged_item",
  "wrong_item", "return_exchange", "general_feedback"
] as const;
const supportPriorities = ["low", "normal", "high", "urgent"] as const;
const supportStatuses = ["open", "pending", "waiting_customer", "waiting_staff", "resolved", "closed"] as const;
const locales = ["en", "zh-CN", "ja-JP", "ko-KR", "it-IT"] as const;
const supportIntentKinds = [
  "product_discovery", "product_comparison", "purchase_interest", "store_activity",
  "wholesale_retail_partnership", "event_collaboration", "shipping_returns", "order_support", "general_support"
] as const;
const supportIntentStrengths = ["low", "medium", "high"] as const;
const supportOperationalSignals = [
  "conversation_started", "ai_answer", "customer_reply", "human_takeover",
  "handoff_released", "ticket_created", "ticket_progress", "heartbeat", "search", "sync", "no_progress"
] as const;
const supportTicketProgress = ["assigned", "unassigned", "pending", "resolved", "reopened", "escalated", "updated"] as const;

export type WebsiteSupportEventPayload = {
  category?: (typeof supportCategories)[number];
  priority?: (typeof supportPriorities)[number];
  status?: (typeof supportStatuses)[number];
  locale?: (typeof locales)[number];
  humanActionRequired?: boolean;
  intentKind?: (typeof supportIntentKinds)[number];
  intentStrength?: (typeof supportIntentStrengths)[number];
  signal?: (typeof supportOperationalSignals)[number];
  ticketProgress?: (typeof supportTicketProgress)[number];
};

export type WebsiteSupportEventInput = {
  organizationId: string;
  storeId?: string | null;
  eventType: (typeof supportEventTypes)[number];
  aggregateType: (typeof aggregateTypes)[number];
  aggregateId: string;
  dedupeKey: string;
  payload?: WebsiteSupportEventPayload;
};

export class SupportEventInputError extends Error {}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function requiredId(value: unknown, field: string) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new SupportEventInputError(`${field} must be a UUID`);
  }
  return value;
}

export function sanitizeWebsiteSupportPayload(value: unknown): WebsiteSupportEventPayload {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SupportEventInputError("payload must be an object");
  }
  const input = value as Record<string, unknown>;
  const allowedKeys = new Set(["category", "priority", "status", "locale", "humanActionRequired", "intentKind", "intentStrength", "signal", "ticketProgress"]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
    throw new SupportEventInputError("payload contains a field that is not approved for the support outbox");
  }
  if (input.category !== undefined && !isOneOf(input.category, supportCategories)) throw new SupportEventInputError("invalid support category");
  if (input.priority !== undefined && !isOneOf(input.priority, supportPriorities)) throw new SupportEventInputError("invalid support priority");
  if (input.status !== undefined && !isOneOf(input.status, supportStatuses)) throw new SupportEventInputError("invalid support status");
  if (input.locale !== undefined && !isOneOf(input.locale, locales)) throw new SupportEventInputError("invalid support locale");
  if (input.humanActionRequired !== undefined && typeof input.humanActionRequired !== "boolean") throw new SupportEventInputError("humanActionRequired must be boolean");
  if (input.intentKind !== undefined && !isOneOf(input.intentKind, supportIntentKinds)) throw new SupportEventInputError("invalid support intent kind");
  if (input.intentStrength !== undefined && !isOneOf(input.intentStrength, supportIntentStrengths)) throw new SupportEventInputError("invalid support intent strength");
  if (input.signal !== undefined && !isOneOf(input.signal, supportOperationalSignals)) throw new SupportEventInputError("invalid support operational signal");
  if (input.ticketProgress !== undefined && !isOneOf(input.ticketProgress, supportTicketProgress)) throw new SupportEventInputError("invalid support ticket progress");
  return {
    ...(input.category === undefined ? {} : { category: input.category }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.locale === undefined ? {} : { locale: input.locale }),
    ...(input.humanActionRequired === undefined ? {} : { humanActionRequired: input.humanActionRequired }),
    ...(input.intentKind === undefined ? {} : { intentKind: input.intentKind }),
    ...(input.intentStrength === undefined ? {} : { intentStrength: input.intentStrength }),
    ...(input.signal === undefined ? {} : { signal: input.signal }),
    ...(input.ticketProgress === undefined ? {} : { ticketProgress: input.ticketProgress })
  } as WebsiteSupportEventPayload;
}

export async function enqueueWebsiteSupportEvent(tx: TransactionSql, input: WebsiteSupportEventInput) {
  const organizationId = requiredId(input.organizationId, "organizationId");
  const storeId = input.storeId == null ? null : requiredId(input.storeId, "storeId");
  if (!isOneOf(input.eventType, supportEventTypes)) throw new SupportEventInputError("invalid support event type");
  if (!isOneOf(input.aggregateType, aggregateTypes)) throw new SupportEventInputError("invalid support aggregate type");
  if (typeof input.aggregateId !== "string" || input.aggregateId.length < 1 || input.aggregateId.length > 200) throw new SupportEventInputError("aggregateId is invalid");
  if (typeof input.dedupeKey !== "string" || input.dedupeKey.length < 8 || input.dedupeKey.length > 200) throw new SupportEventInputError("dedupeKey is invalid");
  const payload = sanitizeWebsiteSupportPayload(input.payload);
  const id = randomUUID();
  const rows = await tx<{ id: string }[]>`INSERT INTO integration_outbox
    (id,organization_id,store_id,destination,source,event_type,aggregate_type,aggregate_id,payload,dedupe_key)
    VALUES(${id},${organizationId},${storeId},'retail_agent','website',${input.eventType},${input.aggregateType},${input.aggregateId},${tx.json(toJson(payload))},${input.dedupeKey})
    ON CONFLICT(destination,dedupe_key) DO NOTHING RETURNING id`;
  const eventId = rows[0]?.id;
  if (eventId) {
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data)
      VALUES(${randomUUID()},NULL,'support.outbox.enqueued','integration_outbox',${eventId},
        ${tx.json(toJson({ source: "website", destination: "retail_agent", eventType: input.eventType, aggregateType: input.aggregateType }))})`;
  }
  return { id: eventId ?? null, created: Boolean(eventId) };
}

export type SupportEventLease = {
  id: string;
  organizationId: string;
  storeId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: WebsiteSupportEventPayload;
  createdAt: string;
  leaseExpiresAt: string;
  receipt: string;
};
export type SupportEventScope = { organizationId: string; storeId: string | null };

export function parseSupportEventPull(value: unknown) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  if (Object.keys(input).some((key) => key !== "limit" && key !== "leaseSeconds")) throw new SupportEventInputError("pull options contain an unknown field");
  const limit = input.limit === undefined ? 25 : Number(input.limit);
  const leaseSeconds = input.leaseSeconds === undefined ? Number(process.env.SUPPORT_EVENT_LEASE_SECONDS || 60) : Number(input.leaseSeconds);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new SupportEventInputError("limit must be an integer between 1 and 100");
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 30 || leaseSeconds > 300) throw new SupportEventInputError("leaseSeconds must be an integer between 30 and 300");
  return { limit, leaseSeconds };
}

export async function pullWebsiteSupportEvents(clientId: string, scope: SupportEventScope, options: { limit: number; leaseSeconds: number }) {
  const db = getDb();
  return db.begin(async (tx) => {
    await tx`UPDATE integration_outbox SET
      status=CASE WHEN attempts>=max_attempts THEN 'failed' ELSE 'pending' END,
      failed_at=CASE WHEN attempts>=max_attempts THEN now() ELSE failed_at END,
      last_error_code=CASE WHEN attempts>=max_attempts THEN 'lease_expired_max_attempts' ELSE 'lease_expired' END,
      next_attempt_at=CASE WHEN attempts>=max_attempts THEN NULL ELSE now()+(power(2,least(attempts,8))*interval '1 second') END,
      locked_at=NULL,lease_expires_at=NULL,leased_by_agent_client_id=NULL,lease_token_hash=NULL,updated_at=now()
      WHERE source='website' AND destination='retail_agent' AND organization_id=${scope.organizationId}
        AND (${scope.storeId}::uuid IS NULL OR store_id=${scope.storeId})
        AND status='processing' AND lease_expires_at<=now()`;
    const rows = await tx<{
      id: string; organization_id: string; store_id: string | null; event_type: string;
      aggregate_type: string; aggregate_id: string; payload: WebsiteSupportEventPayload; created_at: Date;
    }[]>`SELECT id,organization_id,store_id,event_type,aggregate_type,aggregate_id,payload,created_at
      FROM integration_outbox WHERE source='website' AND destination='retail_agent' AND status='pending'
        AND organization_id=${scope.organizationId} AND (${scope.storeId}::uuid IS NULL OR store_id=${scope.storeId})
        AND (next_attempt_at IS NULL OR next_attempt_at<=now())
      ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT ${options.limit}`;
    const leases: SupportEventLease[] = [];
    for (const row of rows) {
      const receipt = randomBytes(32).toString("base64url");
      const updated = await tx<{ lease_expires_at: Date }[]>`UPDATE integration_outbox SET status='processing',attempts=attempts+1,
        locked_at=now(),lease_expires_at=now()+(${options.leaseSeconds}*interval '1 second'),
        leased_by_agent_client_id=${clientId},lease_token_hash=${hashToken(receipt)},updated_at=now()
        WHERE id=${row.id} RETURNING lease_expires_at`;
      leases.push({
        id: row.id, organizationId: row.organization_id, storeId: row.store_id,
        eventType: row.event_type, aggregateType: row.aggregate_type, aggregateId: row.aggregate_id,
        payload: row.payload, createdAt: row.created_at.toISOString(),
        leaseExpiresAt: updated[0].lease_expires_at.toISOString(), receipt
      });
      await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data)
        VALUES(${randomUUID()},NULL,'support.outbox.leased','integration_outbox',${row.id},
          ${tx.json(toJson({ source: "website", destination: "retail_agent", agentClientId: clientId, leaseExpiresAt: updated[0].lease_expires_at }))})`;
    }
    return leases;
  });
}

export function parseSupportEventAck(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new SupportEventInputError("acknowledgement body is required");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== "eventId" && key !== "receipt" && key !== "idempotencyKey")) throw new SupportEventInputError("acknowledgement contains an unknown field");
  const eventId = requiredId(input.eventId, "eventId");
  if (typeof input.receipt !== "string" || input.receipt.length < 32 || input.receipt.length > 120) throw new SupportEventInputError("receipt is invalid");
  if (typeof input.idempotencyKey !== "string" || input.idempotencyKey.length < 8 || input.idempotencyKey.length > 120) throw new SupportEventInputError("idempotencyKey is invalid");
  return { eventId, receipt: input.receipt, idempotencyKey: input.idempotencyKey };
}

export function parseSupportEventNack(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new SupportEventInputError("negative acknowledgement body is required");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["eventId","receipt","errorCode","retryable"].includes(key))) throw new SupportEventInputError("negative acknowledgement contains an unknown field");
  const eventId = requiredId(input.eventId, "eventId");
  if (typeof input.receipt !== "string" || input.receipt.length < 32 || input.receipt.length > 120) throw new SupportEventInputError("receipt is invalid");
  if (typeof input.errorCode !== "string" || !/^[a-z0-9_.-]{2,80}$/.test(input.errorCode)) throw new SupportEventInputError("errorCode is invalid");
  if (typeof input.retryable !== "boolean") throw new SupportEventInputError("retryable must be boolean");
  return { eventId, receipt: input.receipt, errorCode: input.errorCode, retryable: input.retryable };
}

export function parseSupportEventReplay(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new SupportEventInputError("replay body is required");
  const input=value as Record<string,unknown>;
  if (Object.keys(input).some((key)=>key!=="eventId")) throw new SupportEventInputError("replay contains an unknown field");
  return { eventId: requiredId(input.eventId,"eventId") };
}

export async function acknowledgeWebsiteSupportEvent(clientId: string, scope: SupportEventScope, input: ReturnType<typeof parseSupportEventAck>) {
  const db = getDb();
  return db.begin(async (tx) => {
    const duplicate = await tx<{ id: string; lease_token_hash: string | null }[]>`SELECT id,lease_token_hash FROM integration_outbox
      WHERE source='website' AND destination='retail_agent' AND status='delivered'
        AND organization_id=${scope.organizationId} AND (${scope.storeId}::uuid IS NULL OR store_id=${scope.storeId})
        AND leased_by_agent_client_id=${clientId} AND ack_idempotency_key=${input.idempotencyKey}`;
    if (duplicate[0]?.id === input.eventId && duplicate[0].lease_token_hash === hashToken(input.receipt)) {
      return { status: "already_acknowledged" as const, id: duplicate[0].id };
    }
    if (duplicate[0]) return { status: "idempotency_conflict" as const, id: input.eventId };
    const rows = await tx<{ id: string }[]>`UPDATE integration_outbox SET status='delivered',acknowledged_at=now(),delivered_at=now(),
      ack_idempotency_key=${input.idempotencyKey},updated_at=now()
      WHERE id=${input.eventId} AND source='website' AND destination='retail_agent' AND status='processing'
        AND organization_id=${scope.organizationId} AND (${scope.storeId}::uuid IS NULL OR store_id=${scope.storeId})
        AND leased_by_agent_client_id=${clientId} AND lease_token_hash=${hashToken(input.receipt)} AND lease_expires_at>now()
      RETURNING id`;
    if (!rows[0]) return { status: "lease_not_found" as const, id: input.eventId };
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data)
      VALUES(${randomUUID()},NULL,'support.outbox.acknowledged','integration_outbox',${rows[0].id},
        ${tx.json(toJson({ source: "website", destination: "retail_agent", agentClientId: clientId, idempotencyKey: input.idempotencyKey }))})`;
    return { status: "acknowledged" as const, id: rows[0].id };
  });
}

export async function negativeAcknowledgeWebsiteSupportEvent(clientId:string,scope:SupportEventScope,input:ReturnType<typeof parseSupportEventNack>){
  const db=getDb();
  return db.begin(async(tx)=>{
    const rows=await tx<{id:string;status:string;attempts:number;max_attempts:number}[]>`SELECT id,status,attempts,max_attempts FROM integration_outbox
      WHERE id=${input.eventId} AND source='website' AND destination='retail_agent' AND status='processing'
        AND organization_id=${scope.organizationId} AND (${scope.storeId}::uuid IS NULL OR store_id=${scope.storeId})
        AND leased_by_agent_client_id=${clientId} AND lease_token_hash=${hashToken(input.receipt)} AND lease_expires_at>now() FOR UPDATE`;
    const event=rows[0]; if(!event)return {status:"lease_not_found" as const,id:input.eventId};
    const retry=input.retryable&&event.attempts<event.max_attempts;
    await tx`UPDATE integration_outbox SET status=${retry?'pending':'failed'},
      next_attempt_at=${retry?new Date(Date.now()+Math.min(300_000,2**Math.min(event.attempts,8)*1000)):null},
      failed_at=${retry?null:new Date()},last_error_code=${input.errorCode},locked_at=NULL,lease_expires_at=NULL,
      leased_by_agent_client_id=NULL,lease_token_hash=NULL,updated_at=now() WHERE id=${event.id}`;
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data)
      VALUES(${randomUUID()},NULL,${retry?'support.outbox.nacked':'support.outbox.dead_lettered'},'integration_outbox',${event.id},
        ${tx.json(toJson({source:'website',agentClientId:clientId,errorCode:input.errorCode,retryable:retry}))})`;
    return {status:retry?"retry_scheduled" as const:"dead_lettered" as const,id:event.id};
  });
}

export async function replayDeadLetteredSupportEvent(clientId:string,scope:SupportEventScope,eventId:string){
  const db=getDb();
  const rows=await db<{id:string}[]>`UPDATE integration_outbox SET status='pending',attempts=0,next_attempt_at=now(),failed_at=NULL,last_error_code=NULL,updated_at=now()
    WHERE id=${eventId} AND source='website' AND destination='retail_agent' AND status='failed'
      AND organization_id=${scope.organizationId} AND (${scope.storeId}::uuid IS NULL OR store_id=${scope.storeId}) RETURNING id`;
  if(!rows[0])return null;
  await db`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data) VALUES(${randomUUID()},NULL,'support.outbox.replayed','integration_outbox',${eventId},${db.json(toJson({agentClientId:clientId}))})`;
  return {status:"replayed" as const,id:eventId};
}
