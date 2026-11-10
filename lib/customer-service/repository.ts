import { randomBytes, randomUUID } from "node:crypto";
import { getDb, toJson } from "@/lib/admin/db";
import { WEBSITE_ORGANIZATION_ID as DEFAULT_ORGANIZATION_ID, WEBSITE_STORE_ID as DEFAULT_STORE_ID } from "./constants";
import { enqueueWebsiteSupportEvent } from "@/lib/integrations/outbox";
import { hashConversationToken } from "./security";
import { buildBoundedConversationContext } from "./context";
import type { ConversationContextMessage, SupportAnswer, SupportCategory, SupportLocale, SupportPriority, TicketStatus } from "./types";

export async function createConversation(input: { locale: SupportLocale; message: string; name?: string | null; email?: string | null; answer: SupportAnswer; provider: string }) {
  const db = getDb(); const id = randomUUID(); const token = randomBytes(32).toString("base64url");
  await db.begin(async (tx) => {
    await tx`INSERT INTO support_conversations(id,organization_id,store_id,customer_name,customer_email,locale,subject,access_token_hash,category,ai_summary,last_ai_summary_at,status,human_handoff_requested)
      VALUES(${id},${DEFAULT_ORGANIZATION_ID},${DEFAULT_STORE_ID},${input.name || null},${input.email || null},${input.locale},${input.message.slice(0,120)},${hashConversationToken(token)},${input.answer.category},${input.answer.answer.slice(0,1000)},now(),${input.answer.humanHandoffRecommended ? "waiting_staff" : "waiting_customer"},${input.answer.humanHandoffRecommended})`;
    await tx`INSERT INTO support_messages(id,conversation_id,sender_type,body) VALUES(${randomUUID()},${id},'customer',${input.message})`;
    await tx`INSERT INTO support_messages(id,conversation_id,sender_type,body,provider,provider_reference) VALUES(${randomUUID()},${id},'ai',${input.answer.answer},${input.provider},${JSON.stringify({ evidenceIds: input.answer.evidenceIds, confidence: input.answer.confidence, source: input.answer.source, commercialIntent: input.answer.commercialIntent })})`;
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data) VALUES(${randomUUID()},NULL,'support.ai.answered','support_conversation',${id},${tx.json(toJson({provider:input.provider,evidenceIds:input.answer.evidenceIds,confidence:input.answer.confidence,source:input.answer.source,commercialIntent:input.answer.commercialIntent}))})`;
    await enqueueWebsiteSupportEvent(tx, { organizationId: DEFAULT_ORGANIZATION_ID, storeId: DEFAULT_STORE_ID, eventType: "support.conversation.created", aggregateType: "support_conversation", aggregateId: id, dedupeKey: `support-conversation-created:${id}`, payload: { category: input.answer.category, status: input.answer.humanHandoffRecommended ? "waiting_staff" : "waiting_customer", locale: input.locale, humanActionRequired: input.answer.humanHandoffRecommended, intentKind: input.answer.commercialIntent.kind, intentStrength: input.answer.commercialIntent.strength, signal: input.answer.humanHandoffRecommended ? "human_takeover" : "conversation_started" } });
  });
  return { conversationId: id, accessToken: token, answer: input.answer };
}

export async function ownConversation(id: string, token: string) {
  const rows = await getDb()<Array<{ id: string; locale: string; status: string; human_handoff_requested: boolean; customer_name: string | null; customer_email: string | null }>>`
    SELECT id,locale,status,human_handoff_requested,customer_name,customer_email FROM support_conversations WHERE id=${id} AND access_token_hash=${hashConversationToken(token)} LIMIT 1`;
  return rows[0] || null;
}

export async function getOwnedConversation(id: string, token: string) {
  const conversation = await ownConversation(id, token);
  if (!conversation) return null;
  const messages = await getDb()`SELECT id,sender_type,body,created_at FROM support_messages
    WHERE conversation_id=${id} ORDER BY created_at,id`;
  return { conversation, messages };
}

export async function readConversationContext(conversationId: string) {
  const rows = await getDb()<Array<{ sender_type: ConversationContextMessage["senderType"]; body: string }>>`
    SELECT sender_type,body FROM support_messages WHERE conversation_id=${conversationId}
    ORDER BY created_at DESC,id DESC LIMIT 12`;
  return buildBoundedConversationContext(rows.reverse().map((row) => ({ senderType: row.sender_type, body: row.body })));
}

export async function appendCustomerMessageForHuman(conversationId: string, message: string) {
  const db = getDb();
  return db.begin(async (tx) => {
    const rows = await tx<Array<{ id: string }>>`SELECT id FROM support_conversations
      WHERE id=${conversationId} AND human_handoff_requested=true AND status NOT IN ('resolved','closed') FOR UPDATE`;
    if (!rows[0]) return false;
    const messageId = randomUUID();
    await tx`INSERT INTO support_messages(id,conversation_id,sender_type,body) VALUES(${messageId},${conversationId},'customer',${message})`;
    await tx`UPDATE support_conversations SET status='waiting_staff',updated_at=now() WHERE id=${conversationId}`;
    await enqueueWebsiteSupportEvent(tx, { organizationId: DEFAULT_ORGANIZATION_ID, storeId: DEFAULT_STORE_ID, eventType: "support.conversation.updated", aggregateType: "support_conversation", aggregateId: conversationId, dedupeKey: `support-conversation-updated:${messageId}`, payload: { status: "waiting_staff", humanActionRequired: true, signal: "customer_reply" } });
    return true;
  });
}

export async function appendExchange(input: { conversationId: string; message: string; answer: SupportAnswer; provider: string }) {
  const db = getDb();
  return db.begin(async (tx) => {
    const rows = await tx<Array<{ id: string }>>`SELECT id FROM support_conversations
      WHERE id=${input.conversationId} AND human_handoff_requested=false AND status NOT IN ('waiting_staff','resolved','closed') FOR UPDATE`;
    if (!rows[0]) return false;
    const messageId = randomUUID();
    await tx`INSERT INTO support_messages(id,conversation_id,sender_type,body) VALUES(${messageId},${input.conversationId},'customer',${input.message})`;
    await tx`INSERT INTO support_messages(id,conversation_id,sender_type,body,provider,provider_reference) VALUES(${randomUUID()},${input.conversationId},'ai',${input.answer.answer},${input.provider},${JSON.stringify({ evidenceIds: input.answer.evidenceIds, confidence: input.answer.confidence, source: input.answer.source, commercialIntent: input.answer.commercialIntent })})`;
    await tx`UPDATE support_conversations SET status=${input.answer.humanHandoffRecommended ? "waiting_staff" : "waiting_customer"},category=${input.answer.category},human_handoff_requested=human_handoff_requested OR ${input.answer.humanHandoffRecommended},ai_summary=${input.answer.answer.slice(0,1000)},last_ai_summary_at=now(),updated_at=now() WHERE id=${input.conversationId}`;
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data) VALUES(${randomUUID()},NULL,'support.ai.answered','support_conversation',${input.conversationId},${tx.json(toJson({provider:input.provider,evidenceIds:input.answer.evidenceIds,confidence:input.answer.confidence,source:input.answer.source,commercialIntent:input.answer.commercialIntent}))})`;
    await enqueueWebsiteSupportEvent(tx, { organizationId: DEFAULT_ORGANIZATION_ID, storeId: DEFAULT_STORE_ID, eventType: "support.conversation.updated", aggregateType: "support_conversation", aggregateId: input.conversationId, dedupeKey: `support-conversation-updated:${messageId}`, payload: { category: input.answer.category, status: input.answer.humanHandoffRecommended ? "waiting_staff" : "waiting_customer", humanActionRequired: input.answer.humanHandoffRecommended, intentKind: input.answer.commercialIntent.kind, intentStrength: input.answer.commercialIntent.strength, signal: input.answer.humanHandoffRecommended ? "human_takeover" : "ai_answer" } });
    return true;
  });
}

export async function createTicket(input: { conversationId: string; category: SupportCategory; priority: SupportPriority; summary: string; name?: string | null; email?: string | null }) {
  const db = getDb(); const id = randomUUID();
  return db.begin(async (tx) => {
    const rows = await tx<{ id: string }[]>`INSERT INTO support_tickets(id,conversation_id,category,priority,summary,customer_name,customer_email)
      VALUES(${id},${input.conversationId},${input.category},${input.priority},${input.summary},${input.name || null},${input.email || null})
      ON CONFLICT(conversation_id) DO UPDATE SET category=EXCLUDED.category,priority=EXCLUDED.priority,summary=EXCLUDED.summary,customer_name=COALESCE(EXCLUDED.customer_name,support_tickets.customer_name),customer_email=COALESCE(EXCLUDED.customer_email,support_tickets.customer_email),updated_at=now() RETURNING id`;
    const ticketId = rows[0]?.id || id;
    await tx`UPDATE support_conversations SET human_handoff_requested=true,status='waiting_staff',category=${input.category},updated_at=now() WHERE id=${input.conversationId}`;
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data) VALUES(${randomUUID()},NULL,'support.ticket.created','support_ticket',${ticketId},${tx.json(toJson({conversationId:input.conversationId,category:input.category,priority:input.priority,emailDelivery:'not_attempted'}))})`;
    await enqueueWebsiteSupportEvent(tx, { organizationId: DEFAULT_ORGANIZATION_ID, storeId: DEFAULT_STORE_ID, eventType: "support.ticket.created", aggregateType: "support_ticket", aggregateId: ticketId, dedupeKey: `support-ticket-created:${ticketId}`, payload: { category: input.category, priority: input.priority, status: "open", humanActionRequired: true, signal: "ticket_created" } });
    return ticketId;
  });
}

export async function releaseHumanHandoff(conversationId: string, adminId: string) {
  const db = getDb();
  return db.begin(async (tx) => {
    const rows = await tx<{ id: string }[]>`UPDATE support_conversations
      SET human_handoff_requested=false,status='waiting_customer',assigned_user_id=COALESCE(assigned_user_id,${adminId}),updated_at=now()
      WHERE id=${conversationId} AND human_handoff_requested=true AND status='waiting_staff' RETURNING id`;
    if (!rows[0]) return null;
    const eventId = randomUUID();
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data)
      VALUES(${randomUUID()},${adminId},'support.handoff_released','support_conversation',${conversationId},${tx.json(toJson({ status: 'waiting_customer', humanHandoffRequested: false }))})`;
    await enqueueWebsiteSupportEvent(tx, { organizationId: DEFAULT_ORGANIZATION_ID, storeId: DEFAULT_STORE_ID, eventType: "support.conversation.updated", aggregateType: "support_conversation", aggregateId: conversationId, dedupeKey: `support-handoff-released:${eventId}`, payload: { status: "waiting_customer", humanActionRequired: false, signal: "handoff_released" } });
    return rows[0].id;
  });
}

export async function listTickets(filters: { status?: TicketStatus; category?: SupportCategory } = {}) {
  return getDb()`SELECT t.*,c.subject,c.locale,u.display_name AS assigned_name FROM support_tickets t
    JOIN support_conversations c ON c.id=t.conversation_id LEFT JOIN admin_users u ON u.id=t.assigned_user_id
    WHERE (${filters.status || null}::text IS NULL OR t.status=${filters.status || null})
      AND (${filters.category || null}::text IS NULL OR t.category=${filters.category || null})
    ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,t.updated_at DESC LIMIT 500`;
}

export async function updateTicket(id: string, input: { status?: TicketStatus; priority?: SupportPriority; assignedUserId?: string | null }, adminId: string, requestId?: string | null) {
  const db = getDb();
  return db.begin(async (tx) => {
    const rows = await tx<{ id: string; category: SupportCategory; priority: SupportPriority; status: TicketStatus }[]>`UPDATE support_tickets SET status=COALESCE(${input.status || null},status),priority=COALESCE(${input.priority || null},priority),assigned_user_id=CASE WHEN ${input.assignedUserId === undefined} THEN assigned_user_id ELSE ${input.assignedUserId || null}::uuid END,updated_at=now(),resolved_at=CASE WHEN ${input.status || null}='resolved' THEN now() WHEN ${input.status || null}::text IS NOT NULL THEN NULL ELSE resolved_at END WHERE id=${id} RETURNING id,category,priority,status`;
    if (!rows[0]) return null;
    const progress = input.status === "resolved" ? "resolved" : input.status === "pending" ? "pending" : input.status === "open" ? "reopened" : input.assignedUserId !== undefined ? (input.assignedUserId ? "assigned" : "unassigned") : input.priority === "urgent" || input.priority === "high" ? "escalated" : "updated";
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data,request_id) VALUES(${randomUUID()},${adminId},'support.ticket.updated','support_ticket',${id},${tx.json(toJson(input))},${requestId || null})`;
    await enqueueWebsiteSupportEvent(tx, { organizationId: DEFAULT_ORGANIZATION_ID, storeId: DEFAULT_STORE_ID, eventType: "support.ticket.updated", aggregateType: "support_ticket", aggregateId: id, dedupeKey: `support-ticket-updated:${requestId?.slice(0, 150) || randomUUID()}`, payload: { category: rows[0].category, priority: rows[0].priority, status: rows[0].status, humanActionRequired: rows[0].status !== "resolved", signal: "ticket_progress", ticketProgress: progress } });
    return rows[0];
  });
}

export async function supportDashboard() {
  const db = getDb();
  const counts = await db`SELECT (SELECT count(*)::int FROM support_conversations WHERE status NOT IN ('resolved','closed')) AS active_conversations,(SELECT count(*)::int FROM support_tickets WHERE status='open') AS open_tickets,(SELECT count(*)::int FROM support_tickets WHERE status='pending') AS pending_tickets,(SELECT count(*)::int FROM support_conversations WHERE human_handoff_requested) AS handoffs`;
  return { counts: counts[0], tickets: await listTickets() };
}
