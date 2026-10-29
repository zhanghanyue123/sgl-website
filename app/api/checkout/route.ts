import Stripe from "stripe";
import { createHash } from "node:crypto";
import { getProduct } from "@/data/products";
import { parseItems, parseQuote, parseRequestKey, StoreError } from "@/lib/store/validation";
import { assertOpsConfig, errorResponse, getStripe, opsRequest, siteOrigin } from "@/lib/store/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (process.env.STORE_CHECKOUT_ENABLED !== "true") throw new StoreError(503, "在线支付尚未开放，请联系 SGL。");
    const origin = siteOrigin();
    if (request.headers.get("origin") !== origin) throw new StoreError(403, "请从官网购物车发起结账。");
    assertOpsConfig();
    const stripe = getStripe();
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new StoreError(503, "在线支付尚未开放，请联系 SGL。");
    const requestKey = parseRequestKey(request.headers.get("idempotency-key"));
    const raw = await request.text();
    if (raw.length > 16000) throw new StoreError(413, "购物车请求过大。");
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new StoreError(400, "购物车格式不正确。"); }
    const items = parseItems(body).map(item => {
      const product = getProduct(item.slug);
      if (!product || item.variant >= Math.max(1, product.variants.length)) throw new StoreError(400, "商品规格不存在。");
      const options = product.variants[item.variant]?.options ?? [];
      return { slug: item.slug, options, quantity: item.quantity };
    });
    const cartHash = createHash("sha256").update(JSON.stringify(items)).digest("hex");
    const quote = parseQuote(await opsRequest("/checkout/quotes", { items, cartHash }, requestKey));
    if (quote.currency !== "usd") throw new StoreError(409, "结账币种必须与网站美元标价一致。");
    // Stripe prices and shipping must match the persisted OPS quote exactly.
    for (const line of quote.lines) {
      const price = await stripe.prices.retrieve(line.priceId);
      if (!price.active || price.type !== "one_time" || price.currency !== quote.currency || price.unit_amount !== line.unitAmount || price.tax_behavior === "exclusive") throw new StoreError(409, "商品价格配置已变化，请联系 SGL。");
    }
    const shipping = await stripe.shippingRates.retrieve(quote.shippingRateId);
    if (!shipping.active || shipping.type !== "fixed_amount" || shipping.fixed_amount?.currency !== quote.currency || shipping.fixed_amount?.amount !== quote.shippingAmount || shipping.tax_behavior === "exclusive") throw new StoreError(409, "运费配置已变化，请联系 SGL。");
    const session = await stripe.checkout.sessions.create({
      mode: "payment", allowed_payment_method_types: ["card"],
      adaptive_pricing: { enabled: false }, automatic_tax: { enabled: false }, allow_promotion_codes: false,
      client_reference_id: quote.orderId,
      metadata: { ops_order_id: quote.orderId, cart_hash: cartHash },
      payment_intent_data: { metadata: { ops_order_id: quote.orderId } },
      line_items: quote.lines.map(line => ({ price: line.priceId, quantity: line.quantity })),
      shipping_options: [{ shipping_rate: quote.shippingRateId }],
      shipping_address_collection: { allowed_countries: quote.allowedCountries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] },
      billing_address_collection: "required",
      expires_at: quote.expiresAt,
      success_url: `${origin}/checkout/success`, cancel_url: `${origin}/cart?cancelled=1`,
    }, { idempotencyKey: `sgl-checkout-${quote.orderId}-${cartHash}` });
    if (!session.url || session.amount_total !== quote.amountTotal || session.currency !== quote.currency) throw new StoreError(502, "支付金额不一致，请联系 SGL。");
    await opsRequest("/checkout/sessions", { orderId: quote.orderId, sessionId: session.id, amountTotal: session.amount_total, currency: session.currency }, `session-${session.id}`);
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
