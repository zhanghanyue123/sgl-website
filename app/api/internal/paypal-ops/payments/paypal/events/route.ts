import { errorResponse } from "@/lib/store/server";
import { digest, opsIdempotencyKey, paypalOpsDb, readOpsBody, text } from "@/lib/payments/paypal/ops";
import { StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";
const events = /^(CHECKOUT\.ORDER\.(APPROVED|COMPLETED)|PAYMENT\.CAPTURE\.(PENDING|COMPLETED|DENIED|REFUNDED|REVERSED))$/;

export async function POST(request: Request) {
  try {
    const key = opsIdempotencyKey(request);
    const { body } = await readOpsBody(request, 256_000);
    if (body.environment !== "live" || !body.event || typeof body.event !== "object") throw new StoreError(400, "Invalid PayPal event.");
    const event = body.event as Record<string, unknown>;
    const eventId = text(event.id, /^[A-Z0-9-]{8,128}$/i, "Invalid PayPal event ID.");
    if (key !== eventId) throw new StoreError(400, "Invalid PayPal event idempotency key.");
    const eventType = text(event.event_type, events, "Unsupported PayPal event.");
    const resource = event.resource && typeof event.resource === "object" ? event.resource as Record<string, unknown> : {};
    const resourceId = typeof resource.id === "string" ? resource.id : null;
    const related = (resource.supplementary_data as Record<string, unknown> | undefined)?.related_ids as Record<string, unknown> | undefined;
    const relatedOrderId = typeof related?.order_id === "string" ? related.order_id : null;
    const paypalOrderId = eventType.startsWith("CHECKOUT.ORDER.") ? resourceId : relatedOrderId;
    const captureId = eventType.startsWith("PAYMENT.CAPTURE.") ? resourceId : null;
    const amount = resource.amount as Record<string, unknown> | undefined;
    const value = typeof amount?.value === "string" && /^\d+\.\d{2}$/.test(amount.value) ? Math.round(Number(amount.value) * 100) : null;
    const currency = typeof amount?.currency_code === "string" ? amount.currency_code.toUpperCase() : null;
    const status = typeof resource.status === "string" ? resource.status.slice(0, 64) : null;
    const eventDigest = digest(JSON.stringify(event));
    const sql = paypalOpsDb();
    const rows = await sql<{ result: unknown }[]>`
      SELECT paypal_ops.save_webhook(${eventId},${eventType},${eventDigest},${paypalOrderId ?? null},${captureId ?? null},
        ${status},${value},${currency}) AS result`;
    return Response.json(rows[0]?.result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
