import { createHash } from "node:crypto";
import { getProduct } from "@/data/products";
import { isLocale, localizedPath } from "@/lib/i18n";
import { approveUrl, createPayPalOrder, paypalConfig, paypalRequestId } from "@/lib/payments/paypal/client";
import { parseDurableAck } from "@/lib/payments/paypal/validation";
import { assertOpsConfig, errorResponse, opsRequest, siteOrigin } from "@/lib/store/server";
import { parseItems, parseQuote, parseRequestKey, StoreError } from "@/lib/store/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (process.env.STORE_CHECKOUT_ENABLED !== "true") throw new StoreError(503, "Online payment is not available.");
    paypalConfig();
    assertOpsConfig();
    const origin = siteOrigin();
    if (request.headers.get("origin") !== origin) throw new StoreError(403, "Please start checkout from the SGL cart.");
    const requestKey = parseRequestKey(request.headers.get("idempotency-key"));
    const raw = await request.text();
    if (raw.length > 16_000) throw new StoreError(413, "Cart request is too large.");
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new StoreError(400, "Cart request is invalid."); }
    const locale = typeof body === "object" && body !== null && "locale" in body && typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "en";
    const items = parseItems(body).map(item => {
      const product = getProduct(item.slug);
      if (!product || item.variant >= Math.max(1, product.variants.length)) throw new StoreError(400, "Product variant does not exist.");
      if (product.soldOut || product.variants[item.variant]?.soldOut) throw new StoreError(409, "This item is sold out.");
      return { slug: item.slug, options: product.variants[item.variant]?.options ?? [], quantity: item.quantity };
    });
    const cartHash = createHash("sha256").update(JSON.stringify(items)).digest("hex");
    const quote = parseQuote(await opsRequest("/checkout/quotes", { items, cartHash }, requestKey));
    if (quote.currency !== "usd") throw new StoreError(409, "PayPal Sandbox checkout currently supports USD only.");
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
      environment: "sandbox"
    }, `paypal-order-${paypalOrderId}`);
    parseDurableAck(ack, { orderId: quote.orderId });
    return Response.json({ provider: "paypal", environment: "sandbox", paypalOrderId, url: approveUrl(paypalOrder) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
