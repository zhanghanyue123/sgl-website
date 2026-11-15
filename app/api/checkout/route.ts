import { isLocale, localizedPath } from "@/lib/i18n";
import { decodeUtf8Body, readBoundedRequestBody, RequestBodyError } from "@/lib/http/read-bounded-body";
import { createPendingOrder } from "@/lib/orders/service";
import { getAirwallexApiConfig, getAirwallexWebhookConfig } from "@/lib/payments/airwallex/config";
import { startAirwallexPayment } from "@/lib/payments/airwallex/service";
import { CheckoutSecurityError, enforceAirwallexCheckoutSecurity } from "@/lib/store/checkout-security";
import { parseRequestKey, StoreError } from "@/lib/store/validation";
import { errorResponse, siteOrigin } from "@/lib/store/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const origin = siteOrigin();
    if (request.headers.get("origin") !== origin) throw new StoreError(403, "Please start checkout from the SGL cart.");
    if (process.env.STORE_CHECKOUT_ENABLED !== "true" || process.env.AIRWALLEX_ENABLED !== "true") {
      throw new StoreError(503, "Airwallex checkout is not available.");
    }
    if (process.env.COMMERCE_BACKEND !== "local" || process.env.PAYMENT_PROVIDER !== "airwallex") {
      throw new StoreError(503, "Airwallex checkout is not configured.");
    }
    if (new URL(origin).protocol !== "https:") throw new StoreError(503, "Airwallex checkout requires HTTPS.");

    getAirwallexApiConfig();
    getAirwallexWebhookConfig();
    await enforceAirwallexCheckoutSecurity(request);

    const requestKey = parseRequestKey(request.headers.get("idempotency-key"));
    const raw = decodeUtf8Body(await readBoundedRequestBody(request, 16_000));
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new StoreError(400, "The cart request is invalid."); }
    if (!body || typeof body !== "object" || !("provider" in body) || body.provider !== "airwallex") {
      throw new StoreError(400, "The requested payment provider is invalid.");
    }
    const requestedLocale = "locale" in body && typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "en";
    const items = "items" in body ? body.items : undefined;
    const order = await createPendingOrder({ items, locale: requestedLocale, idempotencyKey: requestKey, requireStableSku: true });
    const payment = await startAirwallexPayment({
      orderId: order.id,
      amountCents: order.totalCents,
      currency: order.currency,
      idempotencyKey: requestKey,
      returnUrl: `${origin}${localizedPath("/checkout/success", requestedLocale)}`
    });
    const successUrl = new URL(`${origin}${localizedPath("/checkout/success", requestedLocale)}`);
    successUrl.searchParams.set("status_token", payment.statusToken);
    const cancelUrl = new URL(`${origin}${localizedPath("/cart", requestedLocale)}`);
    cancelUrl.searchParams.set("cancelled", "1");
    cancelUrl.searchParams.set("provider", "airwallex");
    return Response.json({
      provider: "airwallex",
      intentId: payment.intentId,
      clientSecret: payment.clientSecret,
      currency: payment.currency,
      successUrl: successUrl.href,
      cancelUrl: cancelUrl.href
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CheckoutSecurityError) {
      const headers: Record<string, string> = { "Cache-Control": "no-store" };
      if (error.status === 429 && error.retryAfterSeconds) headers["Retry-After"] = String(error.retryAfterSeconds);
      return Response.json({ error: error.message }, { status: error.status, headers });
    }
    if (error instanceof RequestBodyError) return errorResponse(new StoreError(error.status, error.message));
    return errorResponse(error);
  }
}
