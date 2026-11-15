import { errorResponse } from "@/lib/store/server";
import { opsIdempotencyKey, paypalOpsDb, positiveInt, readOpsBody, text } from "@/lib/payments/paypal/ops";
import { StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const key = opsIdempotencyKey(request);
    const { body } = await readOpsBody(request, 8_000);
    if (body.environment !== "live") throw new StoreError(400, "Invalid PayPal environment.");
    const orderId = text(body.orderId, /^[0-9a-f-]{36}$/i, "Invalid order ID.");
    const paypalOrderId = text(body.paypalOrderId, /^[A-Z0-9]{10,32}$/, "Invalid PayPal order ID.");
    const amount = positiveInt(body.amountTotal, "Invalid amount.");
    const currency = text(body.currency, /^usd$/i, "Invalid currency.").toUpperCase();
    const cartHash = text(body.cartHash, /^[0-9a-f]{64}$/, "Invalid cart digest.");
    const sql = paypalOpsDb();
    const rows = await sql<{ result: unknown }[]>`
      SELECT paypal_ops.register_order(${orderId}::uuid,${paypalOrderId},${amount},${currency},${cartHash},${key}) AS result`;
    return Response.json(rows[0]?.result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
