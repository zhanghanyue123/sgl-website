import { getAirwallexApiConfig } from "./config";
import { centsToAirwallexAmount, normalizeAirwallexCurrency } from "./money";

type JsonObject = Record<string, unknown>;

export type AirwallexPaymentIntent = {
  id: string;
  request_id?: string;
  merchant_order_id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
  created_at?: string;
  updated_at: string;
};

export type AirwallexRefund = {
  id: string;
  request_id?: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  status: "RECEIVED" | "ACCEPTED" | "SETTLED" | "FAILED";
  created_at?: string;
  updated_at: string;
};

export class AirwallexApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | null,
    public readonly outcomeUnknown = false
  ) {
    super(message);
  }
}

type TokenCache = { token: string; expiresAtMs: number };
let tokenCache: TokenCache | null = null;
let tokenRequest: Promise<TokenCache> | null = null;
const TOKEN_SAFETY_WINDOW_MS = 60_000;

function object(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
}

async function responseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function parseExpiry(value: unknown) {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 10_000_000_000 ? value : value * 1000;
  }
  throw new AirwallexApiError("Airwallex authentication returned an invalid expiry", 502, null);
}

async function login(fetchImpl: typeof fetch): Promise<TokenCache> {
  const config = getAirwallexApiConfig();
  let response: Response;
  try {
    response = await fetchImpl(`${config.baseUrl}/api/v1/authentication/login`, {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: {
        "x-client-id": config.clientId,
        "x-api-key": config.apiKey,
        "Content-Type": "application/json"
      }
    });
  } catch {
    throw new AirwallexApiError("Airwallex authentication is unavailable", 503, null, true);
  }
  const payload = object(await responseJson(response));
  if (!response.ok || !payload || typeof payload.token !== "string" || !payload.token) {
    const code = payload && typeof payload.code === "string" ? payload.code : null;
    throw new AirwallexApiError("Airwallex authentication failed", response.status || 502, code);
  }
  const expiresAtMs = parseExpiry(payload.expires_at);
  if (expiresAtMs <= Date.now() + TOKEN_SAFETY_WINDOW_MS) {
    throw new AirwallexApiError("Airwallex authentication returned an expired token", 502, null);
  }
  return { token: payload.token, expiresAtMs };
}

export async function getAirwallexAccessToken(fetchImpl: typeof fetch = fetch) {
  if (tokenCache && tokenCache.expiresAtMs > Date.now() + TOKEN_SAFETY_WINDOW_MS) return tokenCache.token;
  if (!tokenRequest) {
    tokenRequest = login(fetchImpl).then((result) => {
      tokenCache = result;
      return result;
    }).finally(() => {
      tokenRequest = null;
    });
  }
  return (await tokenRequest).token;
}

export function resetAirwallexTokenCacheForTests() {
  tokenCache = null;
  tokenRequest = null;
}

async function apiRequest<T>(path: string, init: RequestInit, fetchImpl: typeof fetch, retryAuth = true): Promise<T> {
  const config = getAirwallexApiConfig();
  const token = await getAirwallexAccessToken(fetchImpl);
  let response: Response;
  try {
    response = await fetchImpl(`${config.baseUrl}${path}`, {
      ...init,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-api-version": config.apiVersion,
        ...(init.headers || {})
      }
    });
  } catch {
    throw new AirwallexApiError("Airwallex is temporarily unavailable", 503, null, true);
  }
  if (response.status === 401 && retryAuth) {
    tokenCache = null;
    return apiRequest<T>(path, init, fetchImpl, false);
  }
  const payload = await responseJson(response);
  if (!response.ok) {
    const body = object(payload);
    const code = body && typeof body.code === "string" ? body.code : null;
    throw new AirwallexApiError("Airwallex rejected the request", response.status || 502, code);
  }
  if (!object(payload)) throw new AirwallexApiError("Airwallex returned an invalid response", 502, null);
  return payload as T;
}

function validateIntentShape(value: AirwallexPaymentIntent) {
  if (!value || typeof value.id !== "string" || !/^int_[A-Za-z0-9_-]+$/.test(value.id) ||
    typeof value.merchant_order_id !== "string" || typeof value.amount !== "number" ||
    typeof value.currency !== "string" || typeof value.status !== "string" ||
    typeof value.updated_at !== "string" || !Number.isFinite(Date.parse(value.updated_at))) {
    throw new AirwallexApiError("Airwallex returned an invalid PaymentIntent", 502, null);
  }
  return value;
}

function validateRefundShape(value: AirwallexRefund) {
  if (!value || typeof value.id !== "string" || !/^rfd_[A-Za-z0-9_-]+$/.test(value.id) ||
    typeof value.payment_intent_id !== "string" || !/^int_[A-Za-z0-9_-]+$/.test(value.payment_intent_id) ||
    typeof value.amount !== "number" || typeof value.currency !== "string" ||
    !["RECEIVED", "ACCEPTED", "SETTLED", "FAILED"].includes(value.status) ||
    typeof value.updated_at !== "string" || !Number.isFinite(Date.parse(value.updated_at))) {
    throw new AirwallexApiError("Airwallex returned an invalid refund", 502, null);
  }
  return value;
}

export async function createAirwallexPaymentIntent(input: {
  requestId: string;
  merchantOrderId: string;
  amountCents: number;
  currency: string;
  returnUrl: string;
}, fetchImpl: typeof fetch = fetch) {
  const currency = normalizeAirwallexCurrency(input.currency);
  const result = await apiRequest<AirwallexPaymentIntent>("/api/v1/pa/payment_intents/create", {
    method: "POST",
    body: JSON.stringify({
      request_id: input.requestId,
      merchant_order_id: input.merchantOrderId,
      amount: centsToAirwallexAmount(input.amountCents, currency),
      currency,
      return_url: input.returnUrl
    })
  }, fetchImpl);
  const intent = validateIntentShape(result);
  if (intent.request_id && intent.request_id !== input.requestId) {
    throw new AirwallexApiError("Airwallex returned a mismatched PaymentIntent request", 502, null);
  }
  return intent;
}

export async function retrieveAirwallexPaymentIntent(id: string, fetchImpl: typeof fetch = fetch) {
  if (!/^int_[A-Za-z0-9_-]+$/.test(id)) throw new Error("Airwallex PaymentIntent ID is invalid");
  return validateIntentShape(await apiRequest<AirwallexPaymentIntent>(
    `/api/v1/pa/payment_intents/${encodeURIComponent(id)}`,
    { method: "GET" },
    fetchImpl
  ));
}

export async function listAirwallexPaymentIntents(merchantOrderId: string, fetchImpl: typeof fetch = fetch) {
  const query = new URLSearchParams({ merchant_order_id: merchantOrderId, page_size: "10" });
  const result = await apiRequest<{ items?: AirwallexPaymentIntent[] }>(
    `/api/v1/pa/payment_intents?${query}`,
    { method: "GET" },
    fetchImpl
  );
  if (!Array.isArray(result.items)) throw new AirwallexApiError("Airwallex returned an invalid PaymentIntent list", 502, null);
  return result.items.map(validateIntentShape);
}

export async function createAirwallexRefund(input: {
  requestId: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
  reason: string;
  refundId: string;
}, fetchImpl: typeof fetch = fetch) {
  const currency = normalizeAirwallexCurrency(input.currency);
  const result = await apiRequest<AirwallexRefund>("/api/v1/pa/refunds/create", {
    method: "POST",
    body: JSON.stringify({
      request_id: input.requestId,
      payment_intent_id: input.paymentIntentId,
      amount: centsToAirwallexAmount(input.amountCents, currency),
      reason: input.reason.slice(0, 128),
      metadata: { sgl_refund_id: input.refundId }
    })
  }, fetchImpl);
  return validateRefundShape(result);
}

export async function retrieveAirwallexRefund(id: string, fetchImpl: typeof fetch = fetch) {
  if (!/^rfd_[A-Za-z0-9_-]+$/.test(id)) throw new Error("Airwallex refund ID is invalid");
  return validateRefundShape(await apiRequest<AirwallexRefund>(
    `/api/v1/pa/refunds/${encodeURIComponent(id)}`,
    { method: "GET" },
    fetchImpl
  ));
}

export async function listAirwallexRefunds(paymentIntentId: string, fetchImpl: typeof fetch = fetch) {
  if (!/^int_[A-Za-z0-9_-]+$/.test(paymentIntentId)) throw new Error("Airwallex PaymentIntent ID is invalid");
  const query = new URLSearchParams({ payment_intent_id: paymentIntentId, page_size: "100" });
  const result = await apiRequest<{ items?: AirwallexRefund[] }>(
    `/api/v1/pa/refunds?${query}`,
    { method: "GET" },
    fetchImpl
  );
  if (!Array.isArray(result.items)) throw new AirwallexApiError("Airwallex returned an invalid refund list", 502, null);
  return result.items.map(validateRefundShape);
}
