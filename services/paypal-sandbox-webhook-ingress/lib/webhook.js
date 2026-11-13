import { createHash, timingSafeEqual } from "node:crypto";

export const EVENT_ALLOWLIST = new Set([
  "CHECKOUT.ORDER.APPROVED",
  "CHECKOUT.ORDER.COMPLETED",
  "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED"
]);

const PAYPAL_API = "https://api-m.sandbox.paypal.com";
const CERT_HOSTS = new Set(["api-m.sandbox.paypal.com", "api.sandbox.paypal.com"]);
const buckets = new Map();
let cachedToken;

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function requiredEnv(name, max = 2048) {
  const value = process.env[name]?.trim();
  if (!value || value.length > max) throw new HttpError(503, "Sandbox webhook ingress is not configured.");
  return value;
}

export function config() {
  if (process.env.PAYPAL_ENV !== "sandbox") throw new HttpError(503, "Sandbox webhook ingress is disabled.");
  const opsUrl = new URL(requiredEnv("PREVIEW_OPS_URL"));
  if (opsUrl.protocol !== "https:" || opsUrl.username || opsUrl.password || opsUrl.search || opsUrl.hash) {
    throw new HttpError(503, "Preview OPS URL is invalid.");
  }
  return {
    clientId: requiredEnv("PAYPAL_CLIENT_ID", 512),
    clientSecret: requiredEnv("PAYPAL_CLIENT_SECRET", 512),
    webhookId: requiredEnv("PAYPAL_WEBHOOK_ID", 256),
    opsUrl: opsUrl.href.replace(/\/$/, ""),
    opsToken: requiredEnv("PREVIEW_OPS_TOKEN", 512)
  };
}

export function header(headers, name) {
  const value = headers[name] ?? headers[name.toLowerCase()];
  const text = Array.isArray(value) ? value[0] : value;
  if (typeof text !== "string" || !text.trim() || text.length > 4096) throw new HttpError(400, "PayPal webhook headers are incomplete.");
  return text.trim();
}

export function validateEvent(event) {
  if (!event || typeof event !== "object" || typeof event.id !== "string" || !/^[A-Z0-9-]{8,128}$/i.test(event.id)) {
    throw new HttpError(400, "PayPal webhook event is invalid.");
  }
  if (typeof event.event_type !== "string" || event.event_type.length > 128) throw new HttpError(400, "PayPal webhook event is invalid.");
  return event;
}

export function rateLimit(key, now = Date.now()) {
  const windowMs = 60_000;
  const limit = 60;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) throw new HttpError(429, "Rate limit exceeded.");
  if (buckets.size > 2048) for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
}

async function accessToken(fetcher, cfg) {
  if (cachedToken?.expiresAt > Date.now() + 30_000 && cachedToken.clientId === cfg.clientId) return cachedToken.value;
  const response = await fetcher(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    signal: AbortSignal.timeout(12_000),
    headers: {
      Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: "grant_type=client_credentials"
  });
  if (!response.ok) throw new HttpError(503, "PayPal Sandbox authentication failed.");
  const body = await response.json();
  if (!body?.access_token || typeof body.expires_in !== "number") throw new HttpError(502, "PayPal Sandbox returned an invalid authentication response.");
  cachedToken = { value: body.access_token, expiresAt: Date.now() + Math.max(body.expires_in, 60) * 1000, clientId: cfg.clientId };
  return cachedToken.value;
}

export async function verifySignature(headers, event, fetcher = fetch, cfg = config()) {
  const transmissionTime = header(headers, "paypal-transmission-time");
  const timestamp = Date.parse(transmissionTime);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 10 * 60_000) throw new HttpError(400, "PayPal webhook timestamp is invalid.");
  const certUrl = header(headers, "paypal-cert-url");
  const cert = new URL(certUrl);
  if (cert.protocol !== "https:" || !CERT_HOSTS.has(cert.hostname) || cert.username || cert.password) throw new HttpError(400, "PayPal webhook certificate URL is invalid.");
  const token = await accessToken(fetcher, cfg);
  const response = await fetcher(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    signal: AbortSignal.timeout(12_000),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      auth_algo: header(headers, "paypal-auth-algo"),
      cert_url: certUrl,
      transmission_id: header(headers, "paypal-transmission-id"),
      transmission_sig: header(headers, "paypal-transmission-sig"),
      transmission_time: transmissionTime,
      webhook_id: cfg.webhookId,
      webhook_event: event
    })
  });
  if (!response.ok) throw new HttpError(503, "PayPal signature verification is unavailable.");
  const body = await response.json();
  if (body?.verification_status !== "SUCCESS") throw new HttpError(400, "PayPal webhook signature is invalid.");
}

export async function persistEvent(event, rawBody, fetcher = fetch, cfg = config()) {
  const response = await fetcher(`${cfg.opsUrl}/api/paypal/events`, {
    method: "POST",
    signal: AbortSignal.timeout(12_000),
    headers: {
      Authorization: `Bearer ${cfg.opsToken}`,
      "Content-Type": "application/json",
      "Idempotency-Key": event.id
    },
    body: JSON.stringify({
      environment: "sandbox",
      event,
      payloadSha256: createHash("sha256").update(rawBody).digest("hex")
    })
  });
  if (!response.ok) throw new HttpError(503, "Preview OPS durable acknowledgement failed.");
  const ack = await response.json().catch(() => null);
  if (!ack?.persisted || ack.eventId !== event.id || !["created", "duplicate"].includes(ack.status)) {
    throw new HttpError(502, "Preview OPS returned an invalid acknowledgement.");
  }
  return ack;
}

export function audit(event, result, startedAt) {
  const eventHash = createHash("sha256").update(event?.id || "invalid").digest("hex").slice(0, 16);
  console.info(JSON.stringify({ service: "paypal-sandbox-webhook-ingress", eventHash, eventType: event?.event_type || "invalid", result, latencyMs: Date.now() - startedAt }));
}

export function safeEqualBearer(headerValue, expected) {
  if (typeof headerValue !== "string" || !headerValue.startsWith("Bearer ")) return false;
  const actual = Buffer.from(headerValue.slice(7));
  const target = Buffer.from(expected);
  return actual.length === target.length && timingSafeEqual(actual, target);
}

export function __resetForTests() { buckets.clear(); cachedToken = undefined; }
