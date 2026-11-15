import { errorResponse } from "@/lib/store/server";
import { opsIdempotencyKey, paypalOpsDb, readOpsBody, text } from "@/lib/payments/paypal/ops";
import { StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    opsIdempotencyKey(request);
    const { body } = await readOpsBody(request, 2_000);
    const paypalOrderId = text(body.paypalOrderId, /^[A-Z0-9]{10,32}$/, "Invalid PayPal order ID.");
    const sql = paypalOpsDb();
    const rows = await sql<{ result: unknown }[]>`
      SELECT paypal_ops.capture_context(${paypalOrderId}) AS result`;
    if (!rows[0]?.result) throw new StoreError(404, "PayPal payment association not found.");
    return Response.json(rows[0].result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
