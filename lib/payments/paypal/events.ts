import { digest, text } from "@/lib/payments/paypal/ops";
import { StoreError } from "@/lib/store/validation";

const supportedEvents = /^(CHECKOUT\.ORDER\.(APPROVED|COMPLETED)|CHECKOUT\.PAYMENT-APPROVAL\.REVERSED|PAYMENT\.CAPTURE\.(PENDING|COMPLETED|DENIED|REFUNDED|REVERSED))$/;

export type ParsedPayPalOpsEvent = {
  eventId: string;
  eventType: string;
  payloadSha256: string;
  paypalOrderId: string | null;
  captureId: string | null;
  refundId: string | null;
  relatedCaptureId: string | null;
  providerStatus: string | null;
  amountCents: number | null;
  currency: string | null;
  occurredAt: Date;
};

export function parsePayPalOpsEvent(event: Record<string, unknown>, now = Date.now()): ParsedPayPalOpsEvent {
  const eventId = text(event.id, /^[A-Z0-9-]{8,128}$/i, "Invalid PayPal event ID.");
  const eventType = text(event.event_type, supportedEvents, "Unsupported PayPal event.");
  const resource = event.resource && typeof event.resource === "object" ? event.resource as Record<string, unknown> : {};
  const resourceId = typeof resource.id === "string" && /^[A-Z0-9-]{8,128}$/i.test(resource.id) ? resource.id : null;
  const supplementary = resource.supplementary_data && typeof resource.supplementary_data === "object"
    ? resource.supplementary_data as Record<string, unknown> : {};
  const related = supplementary.related_ids && typeof supplementary.related_ids === "object"
    ? supplementary.related_ids as Record<string, unknown> : {};
  const relatedOrderId = typeof related.order_id === "string" && /^[A-Z0-9]{10,32}$/.test(related.order_id)
    ? related.order_id : null;
  const checkoutEvent = eventType.startsWith("CHECKOUT.");
  const refundEvent = eventType === "PAYMENT.CAPTURE.REFUNDED";
  const paypalOrderId = checkoutEvent ? resourceId : relatedOrderId;
  const captureId = eventType.startsWith("PAYMENT.CAPTURE.") && !refundEvent ? resourceId : null;
  const refundId = refundEvent ? resourceId : null;
  const relatedCaptureId = refundEvent && typeof related.capture_id === "string" && /^[A-Z0-9-]{8,128}$/i.test(related.capture_id)
    ? related.capture_id : null;

  if (!paypalOrderId) throw new StoreError(400, "PayPal event is missing its order association.");
  if (eventType.startsWith("PAYMENT.CAPTURE.") && !refundEvent && !captureId) {
    throw new StoreError(400, "PayPal event is missing its capture association.");
  }
  if (refundEvent && (!refundId || !relatedCaptureId)) {
    throw new StoreError(400, "PayPal refund event is missing its refund or capture association.");
  }

  const amount = resource.amount && typeof resource.amount === "object" ? resource.amount as Record<string, unknown> : {};
  const amountCents = typeof amount.value === "string" && /^\d+\.\d{2}$/.test(amount.value)
    ? Math.round(Number(amount.value) * 100) : null;
  const currency = typeof amount.currency_code === "string" && /^[A-Z]{3}$/.test(amount.currency_code.toUpperCase())
    ? amount.currency_code.toUpperCase() : null;
  if (eventType.startsWith("PAYMENT.CAPTURE.") && (!amountCents || !currency)) {
    throw new StoreError(400, "PayPal payment event is missing its amount.");
  }

  const occurredRaw = typeof resource.update_time === "string" ? resource.update_time :
    typeof event.create_time === "string" ? event.create_time : null;
  if (!occurredRaw) throw new StoreError(400, "Invalid PayPal event timestamp.");
  const occurredAt = new Date(occurredRaw);
  if (!Number.isFinite(occurredAt.getTime()) || occurredAt.getTime() > now + 10 * 60_000) {
    throw new StoreError(400, "Invalid PayPal event timestamp.");
  }

  return {
    eventId,
    eventType,
    payloadSha256: digest(JSON.stringify(event)),
    paypalOrderId,
    captureId,
    refundId,
    relatedCaptureId,
    providerStatus: typeof resource.status === "string" ? resource.status.slice(0,64) : null,
    amountCents,
    currency,
    occurredAt
  };
}
