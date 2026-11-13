import { assertPayPalOrderMatches, capturePayPalOrder, getPayPalOrder, parsePayPalOrderId, paypalRequestId } from "@/lib/payments/paypal/client";
import { parseDurableAck, parsePayPalCaptureContext } from "@/lib/payments/paypal/validation";
import { errorResponse, opsRequest, siteOrigin } from "@/lib/store/server";
import { parseRequestKey, StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (process.env.STORE_CHECKOUT_ENABLED !== "true") throw new StoreError(503, "Online payment is not available.");
    const origin = siteOrigin();
    if (request.headers.get("origin") !== origin) throw new StoreError(403, "Please return from PayPal to the SGL website.");
    const requestKey = parseRequestKey(request.headers.get("idempotency-key"));
    const raw = await request.text();
    if (raw.length > 2_000) throw new StoreError(413, "Payment request is too large.");
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new StoreError(400, "Payment request is invalid."); }
    const paypalOrderId = parsePayPalOrderId(parsed && typeof parsed === "object" && "paypalOrderId" in parsed ? (parsed as { paypalOrderId?: unknown }).paypalOrderId : null);
    const context = parsePayPalCaptureContext(await opsRequest("/checkout/paypal/capture-context", { paypalOrderId }, `paypal-context-${paypalOrderId}`));
    if (context.paypalOrderId !== paypalOrderId) throw new StoreError(409, "PayPal order association is invalid.");
    let order = await getPayPalOrder(paypalOrderId);
    assertPayPalOrderMatches(order, context);
    if (order.status === "APPROVED") {
      order = await capturePayPalOrder(paypalOrderId, paypalRequestId("sgl-capture", context.orderId, requestKey));
      assertPayPalOrderMatches(order, context);
    } else if (order.status !== "COMPLETED") {
      throw new StoreError(409, "PayPal payment has not been approved.");
    }
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture?.id || !["COMPLETED", "PENDING"].includes(capture.status || "")) throw new StoreError(502, "PayPal did not return a valid capture status.");
    const ack = await opsRequest("/payments/paypal/captures", { environment: "sandbox", order }, `paypal-capture-${capture.id}`);
    parseDurableAck(ack, { orderId: context.orderId });
    return Response.json({ orderId: context.orderId, paymentStatus: capture.status === "COMPLETED" ? "paid" : "pending" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
