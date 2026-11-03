import { randomUUID } from "node:crypto";
import { getDb, toJson } from "@/lib/admin/db";
import type { AgentContext } from "./auth";
import { AgentValidationError } from "./http";
import { agentActionPolicies, type AgentActionType, isAgentActionType } from "./policy";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const locales = new Set(["en", "zh-CN", "ja-JP", "ko-KR", "it-IT"]);

function text(value: unknown, name: string, min = 1, max = 500) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) throw new AgentValidationError(`${name} is invalid`);
  return value.trim();
}
function id(value: unknown, name: string) { const result = text(value, name, 36, 36); if (!uuid.test(result)) throw new AgentValidationError(`${name} is invalid`); return result; }

export function parseAgentAction(value: unknown) {
  if (!value || typeof value !== "object") throw new AgentValidationError("JSON object required");
  const body = value as Record<string, unknown>;
  if (!isAgentActionType(body.actionType)) throw new AgentValidationError("Unsupported action type");
  const actionType: AgentActionType = body.actionType;
  const targetId = id(body.targetId, "targetId");
  const idempotencyKey = text(body.idempotencyKey, "idempotencyKey", 8, 120);
  const payload = body.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new AgentValidationError("payload must be an object");
  const p = payload as Record<string, unknown>;
  let cleaned: Record<string, unknown>;
  if (actionType === "inventory_adjustment") {
    if (!Number.isInteger(p.deltaOnHand) || Number(p.deltaOnHand) === 0 || Math.abs(Number(p.deltaOnHand)) > 100000) throw new AgentValidationError("deltaOnHand must be a non-zero integer");
    cleaned = { deltaOnHand: Number(p.deltaOnHand), reason: text(p.reason, "reason", 3, 500) };
  } else if (actionType === "shipping_dispatch") {
    cleaned = { carrier: text(p.carrier, "carrier", 2, 100), trackingNumber: text(p.trackingNumber, "trackingNumber", 2, 150), trackingUrl: p.trackingUrl == null ? null : text(p.trackingUrl, "trackingUrl", 8, 500), addressConfirmed: p.addressConfirmed === true };
    if (!cleaned.addressConfirmed) throw new AgentValidationError("addressConfirmed must be true");
    if (cleaned.trackingUrl && !String(cleaned.trackingUrl).startsWith("https://")) throw new AgentValidationError("trackingUrl must use HTTPS");
  } else if (actionType === "product_content_update") {
    const locale = text(p.locale, "locale", 2, 10); if (!locales.has(locale)) throw new AgentValidationError("Unsupported locale");
    cleaned = { locale, title: text(p.title, "title", 1, 200), description: text(p.description, "description", 1, 10000) };
  } else if (actionType === "price_change") {
    if (!Number.isInteger(p.priceCents) || Number(p.priceCents) < 0 || Number(p.priceCents) > 100000000) throw new AgentValidationError("priceCents is invalid");
    cleaned = { priceCents: Number(p.priceCents), currency: text(p.currency, "currency", 3, 3).toUpperCase(), reason: text(p.reason, "reason", 3, 500) };
  } else {
    if (!Number.isInteger(p.amountCents) || Number(p.amountCents) <= 0 || Number(p.amountCents) > 100000000) throw new AgentValidationError("amountCents is invalid");
    cleaned = { amountCents: Number(p.amountCents), reason: text(p.reason, "reason", 3, 500) };
  }
  if (JSON.stringify(cleaned).length > 20000) throw new AgentValidationError("payload is too large");
  return { actionType, targetType: agentActionPolicies[actionType].targetType, targetId, idempotencyKey, payload: cleaned };
}

export async function createAgentAction(input: ReturnType<typeof parseAgentAction>, context: AgentContext) {
  const db = getDb(); const actionId = randomUUID();
  await db`INSERT INTO agent_action_requests (id, client_id, token_id, action_type, target_type, target_id, payload, idempotency_key)
    VALUES (${actionId}, ${context.clientId}, ${context.tokenId}, ${input.actionType}, ${input.targetType}, ${input.targetId}, ${db.json(toJson(input.payload))}, ${input.idempotencyKey})`;
  return actionId;
}

export async function listAgentActions(clientId: string) {
  return getDb()`SELECT id, action_type, status, target_type, target_id, payload, idempotency_key, requested_at, reviewed_at, review_note
    FROM agent_action_requests WHERE client_id = ${clientId} ORDER BY requested_at DESC LIMIT 100`;
}

export type AgentActionRow = { id: string; action_type: string; status: string; target_type: string; target_id: string; payload: unknown; requested_at: Date; reviewed_at: Date | null; review_note: string | null; client_name: string; reviewer_email: string | null };

export async function listAllAgentActions() {
  return getDb()<AgentActionRow[]>`SELECT a.id, a.action_type, a.status, a.target_type, a.target_id, a.payload, a.requested_at, a.reviewed_at, a.review_note,
      c.name AS client_name, u.email AS reviewer_email
    FROM agent_action_requests a JOIN agent_clients c ON c.id = a.client_id
    LEFT JOIN admin_users u ON u.id = a.reviewed_by ORDER BY a.requested_at DESC LIMIT 250`;
}

export async function reviewAgentAction(actionId: string, status: "approved" | "rejected", note: string, reviewerId: string, requestId?: string | null) {
  if (!uuid.test(actionId)) throw new AgentValidationError("Invalid action id");
  const cleanNote = text(note, "note", 3, 1000); const db = getDb();
  return db.begin(async (tx) => {
    const before = await tx`SELECT * FROM agent_action_requests WHERE id = ${actionId} AND status = 'pending' FOR UPDATE`;
    if (!before[0]) return null;
    const rows = await tx`UPDATE agent_action_requests SET status = ${status}, reviewed_by = ${reviewerId}, reviewed_at = now(), review_note = ${cleanNote}
      WHERE id = ${actionId} RETURNING id, client_id, action_type, target_type, target_id`;
    const row = rows[0];
    await tx`INSERT INTO agent_audit_logs (id, client_id, method, path, action, entity_type, entity_id, request_id, outcome, data)
      VALUES (${randomUUID()}, ${row.client_id}, 'PATCH', '/api/admin/agent-actions', ${`proposal.${status}`}, ${row.target_type}, ${row.target_id}, ${requestId || null}, 'success', ${tx.json({ actionId, reviewNote: cleanNote })})`;
    await tx`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, before_data, after_data, request_id)
      VALUES (${randomUUID()}, ${reviewerId}, ${`agent_action.${status}`}, 'agent_action_request', ${actionId}, ${tx.json(before[0])}, ${tx.json({ status, note: cleanNote })}, ${requestId || null})`;
    return row;
  });
}
