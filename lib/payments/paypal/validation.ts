import { StoreError } from "@/lib/store/validation";

export type PayPalCaptureContext = {
  orderId: string;
  paypalOrderId: string;
  amountTotal: number;
  currency: string;
};

export function parsePayPalCaptureContext(value: unknown): PayPalCaptureContext {
  if (!value || typeof value !== "object") throw new StoreError(502, "Order service returned an invalid PayPal payment context.");
  const source = value as Record<string, unknown>;
  if (typeof source.orderId !== "string" || source.orderId.length < 1 || source.orderId.length > 128) throw new StoreError(502, "Order service returned an invalid PayPal payment context.");
  if (typeof source.paypalOrderId !== "string" || !/^[A-Z0-9]{10,32}$/.test(source.paypalOrderId)) throw new StoreError(502, "Order service returned an invalid PayPal payment context.");
  if (!Number.isSafeInteger(source.amountTotal) || Number(source.amountTotal) <= 0) throw new StoreError(502, "Order service returned an invalid PayPal payment context.");
  if (typeof source.currency !== "string" || source.currency.toLowerCase() !== "usd") throw new StoreError(502, "Order service returned an invalid PayPal payment context.");
  return { orderId: source.orderId, paypalOrderId: source.paypalOrderId, amountTotal: Number(source.amountTotal), currency: source.currency };
}

export function parseDurableAck(value: unknown, expected: { orderId?: string; eventId?: string }) {
  if (!value || typeof value !== "object") throw new StoreError(503, "Order service did not persist the PayPal update.");
  const ack = value as Record<string, unknown>;
  if (ack.persisted !== true) throw new StoreError(503, "Order service did not persist the PayPal update.");
  if (expected.orderId && ack.orderId !== expected.orderId) throw new StoreError(503, "Order service returned an inconsistent PayPal acknowledgement.");
  if (expected.eventId && ack.eventId !== expected.eventId) throw new StoreError(503, "Order service returned an inconsistent PayPal acknowledgement.");
  return ack;
}
