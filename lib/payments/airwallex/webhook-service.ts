import { randomUUID } from "node:crypto";
import type { JSONValue, TransactionSql } from "postgres";
import { getDb } from "@/lib/admin/db";
import type { VerifiedAirwallexWebhook } from "./webhook";

const TERMINAL_INBOX = new Set(["processed", "ignored", "requires_review"]);
const TERMINAL_PAYMENT = new Set(["paid", "partially_refunded", "refunded", "disputed", "cancelled"]);
const PAYMENT_STATUS_RANK: Record<string, number> = {
  REQUIRES_PAYMENT_METHOD: 1,
  REQUIRES_CUSTOMER_ACTION: 2,
  PENDING: 3,
  PENDING_REVIEW: 4,
  REQUIRES_CAPTURE: 5,
  CANCELLED: 100
};
const REFUND_RANK: Record<string, number> = { RECEIVED: 1, ACCEPTED: 2, SETTLED: 3, FAILED: 0 };

function paymentStatus(event: VerifiedAirwallexWebhook) {
  if (event.providerStatus === "CANCELLED") return "cancelled";
  if (event.providerStatus === "REQUIRES_CAPTURE") return "authorized";
  if (event.providerStatus === "REQUIRES_PAYMENT_METHOD") return "created";
  return "pending";
}

function refundStatus(providerStatus: string) {
  if (providerStatus === "RECEIVED") return "received";
  if (providerStatus === "ACCEPTED") return "accepted";
  if (providerStatus === "SETTLED") return "settled";
  return "failed";
}

function refundRankFromLocal(status: string) {
  if (status === "settled" || status === "succeeded") return 3;
  if (status === "accepted") return 2;
  if (status === "received" || status === "processing") return 1;
  return 0;
}

function paymentEventRank(event: VerifiedAirwallexWebhook) {
  // A failed attempt legitimately returns the reusable intent to
  // REQUIRES_PAYMENT_METHOD, even from a later lifecycle state. Store the
  // actual lifecycle rank so a subsequent retry can advance again.
  if (event.eventType === "payment_intent.payment_failed") {
    return PAYMENT_STATUS_RANK.REQUIRES_PAYMENT_METHOD;
  }
  return PAYMENT_STATUS_RANK[event.providerStatus] ?? 0;
}

function resetsFailedPaymentAttempt(event: VerifiedAirwallexWebhook) {
  // Airwallex documents that a failed attempt reverts the reusable intent to
  // REQUIRES_PAYMENT_METHOD and emits requires_payment_method. Keep support for
  // payment_failed as well because it is an explicitly subscribed event.
  return event.providerStatus === "REQUIRES_PAYMENT_METHOD" &&
    (event.eventType === "payment_intent.requires_payment_method" ||
      event.eventType === "payment_intent.payment_failed");
}

async function insertInbox(event: VerifiedAirwallexWebhook) {
  const db = getDb();
  const id = randomUUID();
  const inserted = await db<{ id: string; processing_status: string; payload_sha256: string }[]>`
    INSERT INTO payment_webhook_inbox(
      id,provider,environment,external_event_id,event_type,api_version,account_id,external_organization_id,
      resource_type,resource_id,parent_resource_id,provider_request_id,internal_reference,
      merchant_order_reference,amount_cents,currency,provider_status,occurred_at,
      signature_timestamp_ms,signature_verified_at,payload_sha256,payload
    ) VALUES(
      ${id},'airwallex','sandbox',${event.externalEventId},${event.eventType},${event.apiVersion},${event.accountId},${event.organizationId},
      ${event.resourceType},${event.resourceId},${event.parentResourceId},${event.providerRequestId},${event.internalReference},
      ${event.merchantOrderId},${event.amountCents},${event.currency},${event.providerStatus},${event.occurredAt},
      ${event.signatureTimestampMs},now(),${event.payloadSha256},${db.json(event.sanitizedPayload as JSONValue)}
    ) ON CONFLICT(provider,environment,external_event_id) DO NOTHING
    RETURNING id,processing_status,payload_sha256`;
  if (inserted[0]) return { ...inserted[0], inserted: true };
  const existing = await db<{ id: string; processing_status: string; payload_sha256: string }[]>`
    SELECT id,processing_status,payload_sha256 FROM payment_webhook_inbox
    WHERE provider='airwallex' AND environment='sandbox' AND external_event_id=${event.externalEventId}`;
  if (!existing[0]) throw new Error("Airwallex webhook inbox conflict could not be loaded");
  if (existing[0].payload_sha256 !== event.payloadSha256) throw new Error("Airwallex event ID was reused with a different payload");
  return { ...existing[0], inserted: false };
}

async function reconciliation(tx: TransactionSql, input: {
  inboxId: string;
  paymentId?: string | null;
  orderId?: string | null;
  code: string;
  details: JSONValue;
}) {
  await tx`INSERT INTO payment_reconciliation_issues(
      id,webhook_inbox_id,payment_id,order_id,issue_code,details
    ) VALUES(
      ${randomUUID()},${input.inboxId},${input.paymentId || null},${input.orderId || null},${input.code},${tx.json(input.details)}
    ) ON CONFLICT(webhook_inbox_id) DO NOTHING`;
  await tx`UPDATE payment_webhook_inbox SET processing_status='requires_review',processed_at=now()
    WHERE id=${input.inboxId}`;
}

async function applyPaymentEvent(tx: TransactionSql, inboxId: string, event: VerifiedAirwallexWebhook) {
  if (event.eventType === "payment_intent.succeeded") {
    const result = await tx<{ result: string }[]>`SELECT apply_airwallex_payment_succeeded(${inboxId}) AS result`;
    return result[0]?.result || "processed";
  }
  const candidates = await tx<{ payment_id: string }[]>`SELECT id AS payment_id FROM payments
    WHERE provider='airwallex' AND environment='sandbox' AND (
      provider_reference=${event.resourceId}
      OR (${event.eventType}='payment_intent.created' AND provider_reference IS NULL
        AND merchant_order_reference=${event.merchantOrderId}
        AND provider_request_id=${event.providerRequestId})
    ) ORDER BY created_at DESC LIMIT 2`;
  if (candidates.length !== 1) {
    await reconciliation(tx, {
      inboxId,
      code: candidates.length ? "payment_match_ambiguous" : "payment_not_found",
      details: { resourceId: event.resourceId, merchantOrderId: event.merchantOrderId }
    });
    return "requires_review";
  }
  const payments = await tx<{
    payment_id: string;
    provider_reference: string | null;
    provider_request_id: string;
    merchant_order_reference: string;
    amount_cents: number;
    currency: string;
    payment_status: string;
    provider_status: string | null;
    provider_transition_rank: number | null;
    provider_updated_at: Date | null;
    order_id: string;
    }[]>`SELECT id AS payment_id,provider_reference,provider_request_id,merchant_order_reference,
      amount_cents,currency,status AS payment_status,provider_status,provider_transition_rank,provider_updated_at,order_id
    FROM payments WHERE id=${candidates[0].payment_id} FOR UPDATE`;
  const payment = payments[0];
  if (!payment) throw new Error("Airwallex payment disappeared during webhook processing");
  const orders = await tx<{
    order_id: string;
    total_cents: number;
    order_currency: string;
    order_status: string;
    order_payment_status: string;
  }[]>`SELECT id AS order_id,total_cents,currency AS order_currency,order_status,
      payment_status AS order_payment_status FROM orders WHERE id=${payment.order_id} FOR UPDATE`;
  const order = orders[0];
  if (!order) throw new Error("Airwallex payment order disappeared during webhook processing");
  const row = { ...payment, ...order };
  if (row.provider_reference && row.provider_reference !== event.resourceId ||
    row.merchant_order_reference !== event.merchantOrderId || row.order_id !== event.merchantOrderId ||
    event.eventType === "payment_intent.created" && row.provider_request_id !== event.providerRequestId ||
    row.amount_cents !== event.amountCents || row.total_cents !== event.amountCents ||
    row.currency !== event.currency || row.order_currency !== event.currency) {
    await reconciliation(tx, {
      inboxId,
      paymentId: row.payment_id,
      orderId: row.order_id,
      code: "payment_payload_mismatch",
      details: { resourceId: event.resourceId, merchantOrderId: event.merchantOrderId, amountCents: event.amountCents, currency: event.currency }
    });
    return "requires_review";
  }

  await tx`INSERT INTO payment_events(id,payment_id,event_type,external_event_id,payload,webhook_inbox_id,provider_status,provider_occurred_at)
    VALUES(${randomUUID()},${row.payment_id},${event.eventType},${event.externalEventId},
      ${tx.json(event.sanitizedPayload as JSONValue)},${inboxId},${event.providerStatus},${event.occurredAt})
    ON CONFLICT(payment_id,external_event_id) DO NOTHING`;
  const currentTime = row.provider_updated_at ? new Date(row.provider_updated_at).valueOf() : null;
  const incomingTime = event.occurredAt.valueOf();
  const currentRank = row.provider_transition_rank ?? PAYMENT_STATUS_RANK[row.provider_status || ""] ?? 0;
  const incomingRank = paymentEventRank(event);
  const failedAttemptReset = resetsFailedPaymentAttempt(event);
  const sameTimeDoesNotAdvance = !failedAttemptReset && currentTime === incomingTime &&
    incomingRank <= currentRank;
  const lowerLifecycleRank = !failedAttemptReset && incomingRank < currentRank;
  if (TERMINAL_PAYMENT.has(row.payment_status) || currentTime !== null && currentTime > incomingTime ||
    sameTimeDoesNotAdvance || lowerLifecycleRank) {
    await tx`UPDATE payment_webhook_inbox SET payment_id=${row.payment_id},processing_status='ignored',processed_at=now()
      WHERE id=${inboxId}`;
    return "ignored";
  }

  const status = paymentStatus(event);
  await tx`UPDATE payments SET provider_reference=COALESCE(provider_reference,${event.resourceId}),
    provider_status=${event.providerStatus},provider_event_type=${event.eventType},
    provider_transition_rank=${paymentEventRank(event)},status=${status},provider_updated_at=${event.occurredAt},updated_at=now()
    WHERE id=${row.payment_id}`;
  if (status === "cancelled" && row.order_status === "pending_payment" && row.order_payment_status === "pending") {
    await tx`SELECT release_order_reservation(${row.order_id},'cancelled','Verified Airwallex PaymentIntent cancellation')`;
  }
  await tx`UPDATE payment_webhook_inbox SET payment_id=${row.payment_id},processing_status='processed',processed_at=now()
    WHERE id=${inboxId}`;
  return "processed";
}

async function applyRefundEvent(tx: TransactionSql, inboxId: string, event: VerifiedAirwallexWebhook) {
  const rows = await tx<{
    refund_id: string;
    provider_reference: string | null;
    provider_request_id: string | null;
    refund_status: string;
    provider_updated_at: Date | null;
    approved_by: string | null;
    executed_by: string | null;
    amount_cents: number;
    currency: string;
    payment_id: string;
    payment_reference: string;
    captured_amount_cents: number;
    order_id: string;
    organization_id: string;
    store_id: string;
  }[]>`SELECT r.id AS refund_id,r.provider_reference,r.provider_request_id,r.status AS refund_status,r.provider_updated_at,
      r.approved_by,r.executed_by,
      r.amount_cents,r.currency,p.id AS payment_id,p.provider_reference AS payment_reference,
      p.captured_amount_cents,o.id AS order_id,o.organization_id,o.store_id
    FROM refunds r JOIN payments p ON p.id=r.payment_id JOIN orders o ON o.id=r.order_id
    WHERE p.provider='airwallex' AND p.environment='sandbox' AND (
      r.provider_reference=${event.resourceId}
      OR (${event.providerRequestId} IS NOT NULL AND r.provider_request_id=${event.providerRequestId})
      OR (${event.internalReference} IS NOT NULL AND r.id::text=${event.internalReference})
    ) ORDER BY r.created_at DESC LIMIT 1 FOR UPDATE OF r,p,o`;
  const row = rows[0];
  if (!row) {
    const payments = await tx<{ payment_id: string; order_id: string }[]>`
      SELECT id AS payment_id,order_id FROM payments
      WHERE provider='airwallex' AND environment='sandbox' AND provider_reference=${event.parentResourceId}
      FOR UPDATE`;
    await reconciliation(tx, {
      inboxId,
      paymentId: payments[0]?.payment_id,
      orderId: payments[0]?.order_id,
      code: "external_refund_not_authorized",
      details: { refundId: event.resourceId, paymentIntentId: event.parentResourceId }
    });
    return "requires_review";
  }
  if (!row.approved_by || !row.executed_by || !row.provider_request_id ||
    row.provider_request_id !== event.providerRequestId ||
    !["submitting", "received", "accepted", "settled"].includes(row.refund_status)) {
    await reconciliation(tx, {
      inboxId,
      paymentId: row.payment_id,
      orderId: row.order_id,
      code: "external_refund_not_authorized",
      details: { refundId: event.resourceId, paymentIntentId: event.parentResourceId }
    });
    return "requires_review";
  }
  if (row.provider_reference && row.provider_reference !== event.resourceId ||
    row.payment_reference !== event.parentResourceId || row.amount_cents !== event.amountCents || row.currency !== event.currency) {
    await reconciliation(tx, {
      inboxId,
      paymentId: row.payment_id,
      orderId: row.order_id,
      code: "refund_payload_mismatch",
      details: { refundId: event.resourceId, paymentIntentId: event.parentResourceId, amountCents: event.amountCents, currency: event.currency }
    });
    return "requires_review";
  }

  await tx`INSERT INTO refund_events(id,refund_id,webhook_inbox_id,external_event_id,event_type,provider_status,occurred_at,data)
    VALUES(${randomUUID()},${row.refund_id},${inboxId},${event.externalEventId},${event.eventType},
      ${event.providerStatus},${event.occurredAt},${tx.json(event.sanitizedPayload as JSONValue)})
    ON CONFLICT(refund_id,external_event_id) DO NOTHING`;
  const incomingRank = REFUND_RANK[event.providerStatus] ?? -1;
  const currentRank = refundRankFromLocal(row.refund_status);
  if ((row.provider_updated_at && new Date(row.provider_updated_at) > event.occurredAt) ||
    (row.refund_status === "failed" && event.providerStatus !== "FAILED") ||
    (event.providerStatus !== "FAILED" && incomingRank < currentRank) ||
    (event.providerStatus === "FAILED" && currentRank >= 2)) {
    await tx`UPDATE payment_webhook_inbox SET payment_id=${row.payment_id},processing_status='ignored',processed_at=now()
      WHERE id=${inboxId}`;
    return "ignored";
  }
  const status = refundStatus(event.providerStatus);
  await tx`UPDATE refunds SET provider_reference=COALESCE(provider_reference,${event.resourceId}),
    provider_status=${event.providerStatus},status=${status},provider_updated_at=${event.occurredAt},updated_at=now()
    WHERE id=${row.refund_id}`;

  if (status === "accepted" || status === "settled") {
    const sums = await tx<{ refunded_cents: number }[]>`SELECT COALESCE(sum(amount_cents),0)::int AS refunded_cents
      FROM refunds WHERE payment_id=${row.payment_id} AND status IN ('accepted','settled','succeeded')`;
    const refundedCents = sums[0]?.refunded_cents || 0;
    if (refundedCents > row.captured_amount_cents) throw new Error("Refund projection exceeds captured amount");
    const paymentProjection = refundedCents === row.captured_amount_cents ? "refunded" : "partially_refunded";
    await tx`UPDATE payments SET refunded_amount_cents=${refundedCents},status=${paymentProjection},updated_at=now()
      WHERE id=${row.payment_id}`;
    await tx`UPDATE orders SET payment_status=${paymentProjection},updated_at=now() WHERE id=${row.order_id}`;
    await tx`INSERT INTO order_events(id,order_id,event_type,actor_type,external_reference,data)
      VALUES(${randomUUID()},${row.order_id},'refund.updated','payment',${'airwallex:refund:' + row.refund_id + ':ledger'},
        ${tx.json({ refundId: row.refund_id, amountCents: row.amount_cents, status })})
      ON CONFLICT(event_type,external_reference) WHERE external_reference IS NOT NULL DO NOTHING`;
    await tx`INSERT INTO integration_outbox(id,organization_id,store_id,destination,event_type,aggregate_type,aggregate_id,payload,dedupe_key)
      VALUES(${randomUUID()},${row.organization_id},${row.store_id},'retail_agent','payment.refunded','order',${row.order_id},
        ${tx.json({ orderId: row.order_id, paymentId: row.payment_id, refundId: row.refund_id, amountCents: row.amount_cents })},
        ${'airwallex:refund:' + row.refund_id + ':retail_agent'})
      ON CONFLICT(destination,dedupe_key) DO NOTHING`;
  }
  await tx`UPDATE payment_webhook_inbox SET payment_id=${row.payment_id},processing_status='processed',processed_at=now()
    WHERE id=${inboxId}`;
  return "processed";
}

async function processInbox(inboxId: string, event: VerifiedAirwallexWebhook) {
  const db = getDb();
  return db.begin(async (tx) => {
    const inbox = await tx<{ processing_status: string; payload_sha256: string }[]>`
      SELECT processing_status,payload_sha256 FROM payment_webhook_inbox WHERE id=${inboxId} FOR UPDATE`;
    if (!inbox[0]) throw new Error("Airwallex webhook inbox row disappeared");
    if (inbox[0].payload_sha256 !== event.payloadSha256) throw new Error("Airwallex webhook payload hash mismatch");
    if (TERMINAL_INBOX.has(inbox[0].processing_status)) return inbox[0].processing_status;
    await tx`UPDATE payment_webhook_inbox SET processing_status='processing',attempts=attempts+1,last_error=NULL
      WHERE id=${inboxId}`;
    return event.resourceType === "payment_intent"
      ? applyPaymentEvent(tx, inboxId, event)
      : applyRefundEvent(tx, inboxId, event);
  });
}

export async function persistAndApplyAirwallexWebhook(event: VerifiedAirwallexWebhook) {
  const inbox = await insertInbox(event);
  if (TERMINAL_INBOX.has(inbox.processing_status)) return { duplicate: true, status: inbox.processing_status };
  try {
    const status = await processInbox(inbox.id, event);
    return { duplicate: !inbox.inserted, status };
  } catch (error) {
    await getDb()`UPDATE payment_webhook_inbox SET processing_status='failed',last_error='processing failed'
      WHERE id=${inbox.id} AND processing_status NOT IN ('processed','ignored','requires_review')`;
    throw error;
  }
}
