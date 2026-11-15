import { errorResponse } from "@/lib/store/server";
import { parsePayPalOpsEvent } from "@/lib/payments/paypal/events";
import { opsIdempotencyKey, paypalOpsDb, readOpsBody } from "@/lib/payments/paypal/ops";
import { StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const key = opsIdempotencyKey(request);
    const { body } = await readOpsBody(request, 256_000);
    if (body.environment !== "live" || !body.event || typeof body.event !== "object") throw new StoreError(400, "Invalid PayPal event.");
    const event = body.event as Record<string, unknown>;
    const parsed = parsePayPalOpsEvent(event);
    const { eventId } = parsed;
    if (key !== eventId) throw new StoreError(400, "Invalid PayPal event idempotency key.");
    const sql = paypalOpsDb();
    const rows = await sql<{ result: unknown }[]>`
      SELECT paypal_ops.save_webhook_v2(
        ${eventId},${parsed.eventType},${parsed.payloadSha256},${parsed.paypalOrderId},${parsed.captureId},
        ${parsed.refundId},${parsed.relatedCaptureId},${parsed.providerStatus},${parsed.amountCents},${parsed.currency},${parsed.occurredAt}
      ) AS result`;
    return Response.json(rows[0]?.result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
