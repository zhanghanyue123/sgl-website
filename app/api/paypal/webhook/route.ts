import { verifyPayPalWebhook, type PayPalWebhookEvent } from "@/lib/payments/paypal/client";
import { parseDurableAck } from "@/lib/payments/paypal/validation";
import { errorResponse, opsRequest } from "@/lib/store/server";
import { StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (!raw || raw.length > 256_000) throw new StoreError(413, "PayPal webhook payload is too large.");
    let event: PayPalWebhookEvent;
    try { event = JSON.parse(raw) as PayPalWebhookEvent; } catch { throw new StoreError(400, "PayPal webhook payload is invalid."); }
    if (!event.id || !/^[A-Z0-9-]{8,128}$/i.test(event.id) || !event.event_type || event.event_type.length > 128) throw new StoreError(400, "PayPal webhook event is invalid.");
    await verifyPayPalWebhook(request.headers, event);
    const ack = await opsRequest("/payments/paypal/events", { environment: "sandbox", event }, event.id);
    parseDurableAck(ack, { eventId: event.id });
    return Response.json({ received: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
