import { randomUUID } from "node:crypto";
import type { TransactionSql } from "postgres";
import { getDb } from "@/lib/admin/db";
import { StoreError } from "@/lib/store/validation";
import {
  AirwallexApiError,
  createAirwallexPaymentIntent,
  listAirwallexPaymentIntents,
  retrieveAirwallexPaymentIntent,
  type AirwallexPaymentIntent
} from "./client";
import { normalizeAirwallexCurrency } from "./money";
import { createCheckoutStatusToken } from "./status-token";
import {
  deterministicAirwallexRequestId,
  hashAirwallexPaymentRequest,
  validateAirwallexPaymentIntent
} from "./invariants";

export { deterministicAirwallexRequestId, hashAirwallexPaymentRequest, validateAirwallexPaymentIntent } from "./invariants";

type PaymentClaim = {
  paymentId: string;
  orderId: string;
  requestId: string;
  merchantOrderId: string;
  amountCents: number;
  currency: string;
  providerReference: string | null;
  paymentStatus: string;
};

export type AirwallexCheckoutResult = {
  provider: "airwallex";
  intentId: string;
  clientSecret: string;
  currency: string;
  statusToken: string;
  status: "created" | "pending" | "authorized";
};

function localPaymentStatus(providerStatus: string): "created" | "pending" | "authorized" | "cancelled" {
  if (providerStatus === "REQUIRES_PAYMENT_METHOD") return "created";
  if (providerStatus === "REQUIRES_CAPTURE") return "authorized";
  if (providerStatus === "CANCELLED") return "cancelled";
  return "pending";
}

async function claimPayment(input: {
  orderId: string;
  amountCents: number;
  currency: string;
  idempotencyKey: string;
}): Promise<PaymentClaim> {
  const currency = normalizeAirwallexCurrency(input.currency);
  const requestId = deterministicAirwallexRequestId("pi", input.orderId, input.idempotencyKey);
  const requestHash = hashAirwallexPaymentRequest(input.orderId, input.amountCents, currency);
  const merchantOrderId = input.orderId;
  const db = getDb();
  return db.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${'airwallex:' + input.idempotencyKey},0))`;
    // Existing payment rows are locked before their order, matching webhook
    // processing and avoiding an order->payment / payment->order deadlock.
    const rows = await tx<{
      id: string;
      order_id: string;
      provider_request_id: string;
      merchant_order_reference: string;
      amount_cents: number;
      currency: string;
      request_hash: string;
      provider_reference: string | null;
      status: string;
    }[]>`SELECT id,order_id,provider_request_id,merchant_order_reference,amount_cents,currency,
        request_hash,provider_reference,status FROM payments
      WHERE provider='airwallex' AND idempotency_key=${input.idempotencyKey} FOR UPDATE`;
    const existing = rows[0];
    const orders = await tx<{
      id: string;
      order_status: string;
      payment_status: string;
      total_cents: number;
      currency: string;
      reservation_expires_at: Date | null;
    }[]>`SELECT id,order_status,payment_status,total_cents,currency,reservation_expires_at
      FROM orders WHERE id=${input.orderId} FOR UPDATE`;
    const order = orders[0];
    if (!order) throw new StoreError(404, "订单不存在。");
    // Revalidate the live, human-approved variant before every provider claim.
    // The order item SKU is only a historical snapshot: a later catalogue edit
    // deliberately resets approval and must also invalidate an already-created
    // pending order until the new SKU is reviewed.
    const invalidSkuItems = await tx<{ count: number }[]>`SELECT count(*)::int AS count
      FROM order_items oi
      LEFT JOIN product_variants v ON v.id=oi.variant_id AND v.product_id=oi.product_id
      WHERE oi.order_id=${input.orderId} AND (
        oi.sku IS NULL OR length(trim(oi.sku))=0 OR
        v.id IS NULL OR NOT v.active OR
        v.sku IS NULL OR length(trim(v.sku))=0 OR
        v.sku_approval_status<>'approved' OR
        v.sku_reviewed_value IS DISTINCT FROM v.sku OR
        oi.sku IS DISTINCT FROM v.sku
      )`;
    if ((invalidSkuItems[0]?.count || 0) > 0) {
      throw new StoreError(409, "商品 SKU 尚未批准或订单快照已失效，暂不能发起支付。");
    }
    if (order.total_cents !== input.amountCents || order.currency !== currency) {
      throw new StoreError(409, "订单金额或币种已变化，请刷新后重试。");
    }
    if (order.order_status !== "pending_payment" || order.payment_status !== "pending" ||
      !order.reservation_expires_at || new Date(order.reservation_expires_at).valueOf() <= Date.now()) {
      throw new StoreError(409, "订单已不在可支付状态。");
    }

    if (existing) {
      if (existing.order_id !== input.orderId || existing.amount_cents !== input.amountCents ||
        existing.currency !== currency || existing.request_hash !== requestHash ||
        existing.provider_request_id !== requestId || existing.merchant_order_reference !== merchantOrderId) {
        throw new StoreError(409, "此结账请求编号已用于另一笔支付。");
      }
      if (["paid", "partially_refunded", "refunded", "disputed"].includes(existing.status)) {
        throw new StoreError(409, "订单已经付款，请查看订单状态。");
      }
      return {
        paymentId: existing.id,
        orderId: existing.order_id,
        requestId: existing.provider_request_id,
        merchantOrderId: existing.merchant_order_reference,
        amountCents: existing.amount_cents,
        currency: existing.currency,
        providerReference: existing.provider_reference,
        paymentStatus: existing.status
      };
    }

    const paymentId = randomUUID();
    await tx`INSERT INTO payments(
        id,order_id,provider,environment,provider_request_id,merchant_order_reference,request_hash,
        idempotency_key,amount_cents,currency,status,metadata
      ) VALUES(
        ${paymentId},${input.orderId},'airwallex','sandbox',${requestId},${merchantOrderId},${requestHash},
        ${input.idempotencyKey},${input.amountCents},${currency},'created',
        ${tx.json({ environment: "sandbox", clientSecretStored: false })}
      )`;
    return {
      paymentId,
      orderId: input.orderId,
      requestId,
      merchantOrderId,
      amountCents: input.amountCents,
      currency,
      providerReference: null,
      paymentStatus: "created"
    };
  });
}

async function recoverIntent(claim: PaymentClaim, fetchImpl: typeof fetch) {
  const candidates = await listAirwallexPaymentIntents(claim.merchantOrderId, fetchImpl);
  const matches = candidates.filter((intent) => intent.merchant_order_id === claim.merchantOrderId &&
    intent.request_id === claim.requestId);
  if (matches.length !== 1) throw new StoreError(503, "支付请求状态暂时无法确认，请稍后使用相同购物车重试。");
  return matches[0];
}

async function getOrCreateIntent(claim: PaymentClaim, returnUrl: string, fetchImpl: typeof fetch) {
  if (claim.providerReference) return retrieveAirwallexPaymentIntent(claim.providerReference, fetchImpl);
  try {
    return await createAirwallexPaymentIntent({
      requestId: claim.requestId,
      merchantOrderId: claim.merchantOrderId,
      amountCents: claim.amountCents,
      currency: claim.currency,
      returnUrl
    }, fetchImpl);
  } catch (error) {
    if (error instanceof AirwallexApiError && (error.outcomeUnknown || error.code === "duplicate_request")) {
      return recoverIntent(claim, fetchImpl);
    }
    throw error;
  }
}

async function persistIntent(claim: PaymentClaim, intent: AirwallexPaymentIntent) {
  const status = localPaymentStatus(intent.status);
  if (status === "cancelled") throw new StoreError(409, "此支付请求已取消，请重新结账。");
  const providerUpdatedAt = new Date(intent.updated_at);
  if (Number.isNaN(providerUpdatedAt.valueOf())) throw new StoreError(502, "支付渠道返回了无效的更新时间。");
  let effectiveStatus = status;
  const db = getDb();
  await db.begin(async (tx: TransactionSql) => {
    const rows = await tx<{ provider_reference: string | null; status: string; provider_updated_at: Date | null }[]>`
      SELECT provider_reference,status,provider_updated_at FROM payments WHERE id=${claim.paymentId} FOR UPDATE`;
    const payment = rows[0];
    if (!payment) throw new Error("Airwallex payment claim disappeared");
    if (payment.provider_reference && payment.provider_reference !== intent.id) {
      throw new Error("Airwallex PaymentIntent reference conflict");
    }
    if (["paid", "partially_refunded", "refunded", "disputed"].includes(payment.status)) {
      throw new StoreError(409, "订单已经付款，请查看订单状态。");
    }
    if (payment.status === "cancelled") throw new StoreError(409, "此支付请求已取消，请重新结账。");
    if (payment.provider_updated_at && new Date(payment.provider_updated_at) >= providerUpdatedAt) {
      effectiveStatus = payment.status === "authorized" ? "authorized" : payment.status === "created" ? "created" : "pending";
      await tx`UPDATE payments SET provider_reference=COALESCE(provider_reference,${intent.id}),updated_at=now()
        WHERE id=${claim.paymentId}`;
      return;
    }
    await tx`UPDATE payments SET provider_reference=${intent.id},provider_status=${intent.status},
      provider_event_type=NULL,provider_transition_rank=NULL,
      status=${status},provider_updated_at=${providerUpdatedAt},updated_at=now()
      WHERE id=${claim.paymentId}`;
  });
  return effectiveStatus;
}

export async function startAirwallexPayment(input: {
  orderId: string;
  amountCents: number;
  currency: string;
  idempotencyKey: string;
  returnUrl: string;
}, fetchImpl: typeof fetch = fetch): Promise<AirwallexCheckoutResult> {
  const claim = await claimPayment(input);
  const statusToken = createCheckoutStatusToken(claim.orderId, claim.paymentId);
  const returnUrl = new URL(input.returnUrl);
  returnUrl.searchParams.set("status_token", statusToken);
  let intent: AirwallexPaymentIntent;
  try {
    intent = validateAirwallexPaymentIntent(await getOrCreateIntent(claim, returnUrl.href, fetchImpl), claim);
  } catch (error) {
    if (error instanceof StoreError) throw error;
    if (error instanceof AirwallexApiError) {
      throw new StoreError(error.status >= 500 || error.outcomeUnknown ? 503 : 502, "Airwallex Sandbox 暂时无法创建支付，请使用相同购物车重试。");
    }
    throw error;
  }
  const status = await persistIntent(claim, intent);
  if (typeof intent.client_secret !== "string" || !intent.client_secret) {
    throw new StoreError(503, "支付会话暂时无法恢复，请稍后使用相同购物车重试。");
  }
  return {
    provider: "airwallex",
    intentId: intent.id,
    clientSecret: intent.client_secret,
    currency: claim.currency,
    statusToken,
    status
  };
}
