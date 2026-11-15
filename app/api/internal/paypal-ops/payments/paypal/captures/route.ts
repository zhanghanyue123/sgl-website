import { errorResponse } from "@/lib/store/server";
import { opsIdempotencyKey, paypalOpsDb, positiveInt, readOpsBody, text } from "@/lib/payments/paypal/ops";
import { StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const key = opsIdempotencyKey(request);
    const { body } = await readOpsBody(request, 64_000);
    if (body.environment !== "live" || !body.order || typeof body.order !== "object") throw new StoreError(400, "Invalid PayPal capture.");
    const order = body.order as Record<string, unknown>;
    const paypalOrderId = text(order.id, /^[A-Z0-9]{10,32}$/, "Invalid PayPal order ID.");
    const units = Array.isArray(order.purchase_units) ? order.purchase_units : [];
    const unit = units[0] as Record<string, unknown> | undefined;
    const payments = unit?.payments as Record<string, unknown> | undefined;
    const captures = Array.isArray(payments?.captures) ? payments.captures : [];
    const capture = captures[0] as Record<string, unknown> | undefined;
    if (!capture) throw new StoreError(400, "Invalid PayPal capture.");
    const captureId = text(capture.id, /^[A-Z0-9]{10,32}$/, "Invalid PayPal capture ID.");
    const status = text(capture.status, /^(PENDING|COMPLETED|DENIED|REFUNDED|REVERSED)$/, "Invalid PayPal capture status.");
    const amount = capture.amount as Record<string, unknown> | undefined;
    const value = text(amount?.value, /^\d+\.\d{2}$/, "Invalid PayPal capture amount.");
    const amountCents = positiveInt(Math.round(Number(value) * 100), "Invalid PayPal capture amount.");
    const currency = text(amount?.currency_code, /^USD$/, "Invalid PayPal capture currency.");
    const sql = paypalOpsDb();
    const rows = await sql<{ result: unknown }[]>`
      SELECT paypal_ops.save_capture(${paypalOrderId},${captureId},${status},${amountCents},${currency},${key}) AS result`;
    return Response.json(rows[0]?.result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
