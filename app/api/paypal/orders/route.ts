import { createHash } from "node:crypto";
import { getProduct } from "@/data/products";
import { isLocale, localizedPath } from "@/lib/i18n";
import { createPendingOrder } from "@/lib/orders/service";
import { approveUrl, createPayPalOrder, paypalConfig, paypalRequestId } from "@/lib/payments/paypal/client";
import { parseDurableAck } from "@/lib/payments/paypal/validation";
import { assertOpsConfig, errorResponse, opsRequest, siteOrigin } from "@/lib/store/server";
import { parseItems, parseRequestKey, StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (process.env.PAYPAL_ENABLED !== "true") throw new StoreError(503, "PayPal checkout is not available.");
    if (process.env.STORE_CHECKOUT_ENABLED !== "true") throw new StoreError(503, "Online payment is not available.");
    const config = paypalConfig();
    if (config.environment === "live" && process.env.PAYPAL_LIVE_ENABLED !== "true") throw new StoreError(503, "PayPal checkout is not available.");
    assertOpsConfig();
    const origin = siteOrigin();
    if (request.headers.get("origin") !== origin) throw new StoreError(403, "Please start checkout from the SGL cart.");
    const requestKey = parseRequestKey(request.headers.get("idempotency-key"));
    const raw = await request.text();
    if (raw.length > 16_000) throw new StoreError(413, "Cart request is too large.");
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new StoreError(400, "Cart request is invalid."); }
    const locale = typeof body === "object" && body !== null && "locale" in body && typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "en";
    const items = parseItems(body);
    items.forEach(item => {
      const product = getProduct(item.slug);
      if (!product || item.variant >= Math.max(1, product.variants.length)) throw new StoreError(400, "Product variant does not exist.");
      if (product.soldOut || product.variants[item.variant]?.soldOut) throw new StoreError(409, "This item is sold out.");
    });
    const cartHash = createHash("sha256").update(JSON.stringify(items)).digest("hex");
    const order = await createPendingOrder({ items, locale, idempotencyKey: requestKey, requireStableSku: true });
    const quote = { orderId: order.id, amountTotal: order.totalCents, currency: order.currency.toLowerCase() };
    if (quote.currency !== "usd") throw new StoreError(409, "PayPal checkout currently supports USD only.");
    const returnUrl = `${origin}${localizedPath("/checkout/paypal/return", locale)}`;
    const cancelUrl = `${origin}${localizedPath("/cart", locale)}?cancelled=1&provider=paypal`;
    const paypalOrder = await createPayPalOrder({
      orderId: quote.orderId,
      amountTotal: quote.amountTotal,
      currency: quote.currency,
      returnUrl,
      cancelUrl,
      requestId: paypalRequestId("sgl-create", quote.orderId, cartHash)
    });
    const paypalOrderId = paypalOrder.id!;
    const ack = await opsRequest("/checkout/paypal/orders", {
      orderId: quote.orderId,
      paypalOrderId,
      amountTotal: quote.amountTotal,
      currency: quote.currency,
      cartHash,
      environment: config.environment
    }, `paypal-order-${paypalOrderId}`);
    parseDurableAck(ack, { orderId: quote.orderId });
    return Response.json({ provider: "paypal", environment: config.environment, paypalOrderId, url: approveUrl(paypalOrder, config) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
