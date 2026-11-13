import { createHash } from "node:crypto";
import { StoreError } from "@/lib/store/validation";

const SANDBOX_API = "https://api-m.sandbox.paypal.com";
const APPROVAL_HOSTS = new Set(["www.sandbox.paypal.com"]);

type PayPalEnvironment = {
  PAYPAL_ENV?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_ID?: string;
};

type PayPalLink = { href?: string; rel?: string; method?: string };
export type PayPalAmount = { currency_code?: string; value?: string };
export type PayPalOrder = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: PayPalAmount;
    payments?: { captures?: Array<{ id?: string; status?: string; amount?: PayPalAmount }> };
  }>;
};

export type PayPalWebhookEvent = { id?: string; event_type?: string; resource?: unknown; [key: string]: unknown };

export function paypalConfig(env: PayPalEnvironment = process.env as PayPalEnvironment) {
  if (env.PAYPAL_ENV !== "sandbox") throw new StoreError(503, "PayPal Sandbox is not configured.");
  const clientId = env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = env.PAYPAL_CLIENT_SECRET?.trim();
  const webhookId = env.PAYPAL_WEBHOOK_ID?.trim();
  if (!clientId || !clientSecret || !webhookId || clientId.length > 256 || clientSecret.length > 256 || webhookId.length > 128) {
    throw new StoreError(503, "PayPal Sandbox is not configured.");
  }
  return { baseUrl: SANDBOX_API, clientId, clientSecret, webhookId };
}

let tokenCache: { token: string; expiresAt: number; clientIdHash: string } | null = null;

async function accessToken(fetcher: typeof fetch, config = paypalConfig()) {
  const clientIdHash = createHash("sha256").update(config.clientId).digest("hex");
  if (tokenCache && tokenCache.clientIdHash === clientIdHash && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token;
  let response: Response;
  try {
    response = await fetcher(`${config.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: "grant_type=client_credentials"
    });
  } catch {
    throw new StoreError(503, "PayPal Sandbox is temporarily unavailable.");
  }
  if (!response.ok) throw new StoreError(503, "PayPal Sandbox authentication failed.");
  const body = await response.json().catch(() => null) as { access_token?: string; expires_in?: number } | null;
  if (!body?.access_token || typeof body.expires_in !== "number") throw new StoreError(502, "PayPal Sandbox returned an invalid authentication response.");
  tokenCache = { token: body.access_token, expiresAt: Date.now() + Math.max(60, body.expires_in) * 1000, clientIdHash };
  return body.access_token;
}

async function paypalRequest<T>(path: string, init: RequestInit, fetcher: typeof fetch = fetch): Promise<T> {
  const config = paypalConfig();
  const token = await accessToken(fetcher, config);
  let response: Response;
  try {
    response = await fetcher(`${config.baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...init.headers }
    });
  } catch {
    throw new StoreError(503, "PayPal Sandbox is temporarily unavailable.");
  }
  if (!response.ok) {
    if (response.status === 409 || response.status === 422) throw new StoreError(409, "PayPal order state changed. Please refresh and try again.");
    throw new StoreError(503, "PayPal Sandbox could not process the request.");
  }
  const body = await response.json().catch(() => null);
  if (!body || typeof body !== "object") throw new StoreError(502, "PayPal Sandbox returned an invalid response.");
  return body as T;
}

export function centsToPayPalValue(cents: number) {
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new StoreError(409, "The payment amount is invalid.");
  return (cents / 100).toFixed(2);
}

export function parsePayPalOrderId(value: unknown) {
  if (typeof value !== "string" || !/^[A-Z0-9]{10,32}$/.test(value)) throw new StoreError(400, "PayPal order ID is invalid.");
  return value;
}

export function approveUrl(order: PayPalOrder) {
  const href = order.links?.find(link => link.rel === "payer-action" || link.rel === "approve")?.href;
  if (!href) throw new StoreError(502, "PayPal approval link is missing.");
  const url = new URL(href);
  if (url.protocol !== "https:" || !APPROVAL_HOSTS.has(url.hostname) || url.username || url.password) throw new StoreError(502, "PayPal approval link is invalid.");
  return url.href;
}

export function assertPayPalOrderMatches(order: PayPalOrder, expected: { paypalOrderId: string; orderId: string; amountTotal: number; currency: string }) {
  if (order.id !== expected.paypalOrderId) throw new StoreError(409, "PayPal order association is invalid.");
  if (!order.purchase_units || order.purchase_units.length !== 1) throw new StoreError(409, "PayPal order contents are invalid.");
  const unit = order.purchase_units[0];
  const amount = unit.amount;
  if (unit.custom_id !== expected.orderId || unit.reference_id !== expected.orderId) throw new StoreError(409, "PayPal order association is invalid.");
  if (amount?.currency_code?.toUpperCase() !== expected.currency.toUpperCase() || amount.value !== centsToPayPalValue(expected.amountTotal)) {
    throw new StoreError(409, "PayPal payment amount does not match the SGL order.");
  }
  for (const capture of unit.payments?.captures || []) {
    if (capture.amount?.currency_code?.toUpperCase() !== expected.currency.toUpperCase() || capture.amount.value !== centsToPayPalValue(expected.amountTotal)) {
      throw new StoreError(409, "PayPal capture amount does not match the SGL order.");
    }
  }
  return unit;
}

export async function createPayPalOrder(input: {
  orderId: string; amountTotal: number; currency: string; returnUrl: string; cancelUrl: string; requestId: string;
}, fetcher: typeof fetch = fetch) {
  const currency = input.currency.toUpperCase();
  if (currency !== "USD") throw new StoreError(409, "PayPal Sandbox checkout currently supports USD only.");
  const order = await paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PayPal-Request-Id": input.requestId,
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: input.orderId,
        custom_id: input.orderId,
        invoice_id: input.orderId,
        amount: { currency_code: currency, value: centsToPayPalValue(input.amountTotal) }
      }],
      payment_source: { paypal: { experience_context: {
        brand_name: "Seagull Labs",
        user_action: "PAY_NOW",
        shipping_preference: "GET_FROM_FILE",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl
      } } }
    })
  }, fetcher);
  if (!order.id || !["CREATED", "PAYER_ACTION_REQUIRED"].includes(order.status || "")) throw new StoreError(502, "PayPal Sandbox did not create an approvable order.");
  return order;
}

export async function getPayPalOrder(orderId: string, fetcher: typeof fetch = fetch) {
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(parsePayPalOrderId(orderId))}`, { method: "GET" }, fetcher);
}

export async function capturePayPalOrder(orderId: string, requestId: string, fetcher: typeof fetch = fetch) {
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(parsePayPalOrderId(orderId))}/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "PayPal-Request-Id": requestId, Prefer: "return=representation" },
    body: "{}"
  }, fetcher);
}

function requiredHeader(headers: Headers, name: string) {
  const value = headers.get(name)?.trim();
  if (!value || value.length > 2048) throw new StoreError(400, "PayPal webhook headers are incomplete.");
  return value;
}

export async function verifyPayPalWebhook(headers: Headers, event: PayPalWebhookEvent, fetcher: typeof fetch = fetch) {
  const transmissionTime = requiredHeader(headers, "paypal-transmission-time");
  const timestamp = Date.parse(transmissionTime);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 10 * 60 * 1000) throw new StoreError(400, "PayPal webhook timestamp is invalid.");
  const certUrl = requiredHeader(headers, "paypal-cert-url");
  const cert = new URL(certUrl);
  if (cert.protocol !== "https:" || !["api-m.sandbox.paypal.com", "api.sandbox.paypal.com"].includes(cert.hostname)) throw new StoreError(400, "PayPal webhook certificate URL is invalid.");
  const result = await paypalRequest<{ verification_status?: string }>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: requiredHeader(headers, "paypal-auth-algo"),
      cert_url: certUrl,
      transmission_id: requiredHeader(headers, "paypal-transmission-id"),
      transmission_sig: requiredHeader(headers, "paypal-transmission-sig"),
      transmission_time: transmissionTime,
      webhook_id: paypalConfig().webhookId,
      webhook_event: event
    })
  }, fetcher);
  if (result.verification_status !== "SUCCESS") throw new StoreError(400, "PayPal webhook signature is invalid.");
}

export function paypalRequestId(prefix: string, ...values: string[]) {
  return `${prefix}-${createHash("sha256").update(values.join("\u0000")).digest("hex").slice(0, 40)}`;
}

export function __resetPayPalTokenCacheForTests() { tokenCache = null; }
