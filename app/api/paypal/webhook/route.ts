import { paypalConfig, verifyPayPalWebhook, type PayPalWebhookEvent } from "@/lib/payments/paypal/client";
import { parseDurableAck } from "@/lib/payments/paypal/validation";
import { errorResponse, opsRequest } from "@/lib/store/server";
import { StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";

const allowedEvents = new Set([
  "CHECKOUT.ORDER.APPROVED",
  "CHECKOUT.ORDER.COMPLETED",
  "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED"
]);

export async function POST(request: Request) {
  try {
    if (process.env.PAYPAL_WEBHOOK_ENABLED !== "true") throw new StoreError(503, "PayPal webhook is not available.");
    const config = paypalConfig();
    const raw = await request.text();
    if (!raw || raw.length > 256_000) throw new StoreError(413, "PayPal webhook payload is too large.");
    let event: PayPalWebhookEvent;
    try { event = JSON.parse(raw) as PayPalWebhookEvent; } catch { throw new StoreError(400, "PayPal webhook payload is invalid."); }
    if (!event.id || !/^[A-Z0-9-]{8,128}$/i.test(event.id) || !event.event_type || event.event_type.length > 128) throw new StoreError(400, "PayPal webhook event is invalid.");
    if (!allowedEvents.has(event.event_type)) throw new StoreError(400, "PayPal webhook event type is not supported.");
    await verifyPayPalWebhook(request.headers, event);
    const ack = await opsRequest("/payments/paypal/events", { environment: config.environment, event }, event.id);
    parseDurableAck(ack, { eventId: event.id });
    return Response.json({ received: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
