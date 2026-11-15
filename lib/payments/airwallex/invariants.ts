import { createHash } from "node:crypto";
import { StoreError } from "@/lib/store/validation";
import type { AirwallexPaymentIntent } from "./client";
import { airwallexAmountToCents, normalizeAirwallexCurrency } from "./money";

export type AirwallexPaymentExpectation = {
  requestId: string;
  merchantOrderId: string;
  amountCents: number;
  currency: string;
};

export function deterministicAirwallexRequestId(kind: "pi" | "rf", ...parts: string[]) {
  const digest = createHash("sha256").update([kind, ...parts].join("\u0000")).digest("hex");
  return `sgl_${kind}_${digest.slice(0, 57)}`;
}

export function hashAirwallexPaymentRequest(orderId: string, amountCents: number, currency: string) {
  return createHash("sha256").update(JSON.stringify({ orderId, amountCents, currency })).digest("hex");
}

export function validateAirwallexPaymentIntent(intent: AirwallexPaymentIntent, claim: AirwallexPaymentExpectation) {
  const currency = normalizeAirwallexCurrency(intent.currency);
  if (intent.merchant_order_id !== claim.merchantOrderId || currency !== claim.currency ||
    airwallexAmountToCents(intent.amount, currency) !== claim.amountCents) {
    throw new StoreError(502, "支付渠道返回的订单、金额或币种不一致。");
  }
  return intent;
}
