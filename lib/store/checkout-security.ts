import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { getDb } from "@/lib/admin/db";
import { StoreError } from "./validation";

const WINDOW_SECONDS = 5 * 60;
const IP_LIMIT = 20;
const CLIENT_LIMIT = 6;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CHECKOUT_RATE_LIMIT_POLICY = Object.freeze({
  windowSeconds: WINDOW_SECONDS,
  ipLimit: IP_LIMIT,
  clientLimit: CLIENT_LIMIT
});

export type CheckoutRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type CheckoutRateLimitConsumer = (input: {
  ipHash: string;
  clientHash: string;
  requestHash: string | null;
  windowSeconds: number;
  ipLimit: number;
  clientLimit: number;
}) => Promise<CheckoutRateLimitResult>;

export class CheckoutSecurityError extends StoreError {
  constructor(status: 403 | 429 | 503, message: string, public readonly retryAfterSeconds?: number) {
    super(status, message);
  }
}

function canonicalIp(value: string) {
  const version = isIP(value);
  if (version === 4) return value.split(".").map((part) => String(Number(part))).join(".");
  if (version === 6) {
    const hostname = new URL(`http://[${value}]/`).hostname;
    return hostname.slice(1, -1).toLowerCase();
  }
  return null;
}

export function trustedVercelClientIp(request: Request) {
  if (process.env.VERCEL !== "1") return null;
  const forwarded = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (!forwarded || forwarded.includes(",")) return null;
  return canonicalIp(forwarded);
}

export function checkoutClientId(request: Request) {
  const value = request.headers.get("x-sgl-checkout-client")?.trim();
  return value && UUID_PATTERN.test(value) ? value.toLowerCase() : null;
}

export function hashCheckoutSecurityKey(secret: string, dimension: "ip" | "client" | "request", value: string) {
  return createHmac("sha256", secret).update(`sgl-checkout:${dimension}:`).update(value).digest("hex");
}

async function consumeDatabaseRateLimit(input: {
  ipHash: string;
  clientHash: string;
  requestHash: string | null;
  windowSeconds: number;
  ipLimit: number;
  clientLimit: number;
}): Promise<CheckoutRateLimitResult> {
  const db = getDb();
  const rows = await db<{
    allowed: boolean;
    retry_after_seconds: number;
  }[]>`SELECT allowed,retry_after_seconds FROM consume_checkout_rate_limit(
    ${input.ipHash},${input.clientHash},${input.windowSeconds},${input.ipLimit},${input.clientLimit}
  )`;
  const row = rows[0];
  if (!row || typeof row.allowed !== "boolean" || !Number.isInteger(row.retry_after_seconds) || row.retry_after_seconds < 0) {
    throw new CheckoutSecurityError(503, "结账安全服务暂时不可用，请稍后重试。");
  }
  if (!row.allowed) {
    await db`INSERT INTO checkout_security_events(
        id,request_id,provider,decision,reason_code,ip_hash,client_hash
      ) VALUES(
        ${randomUUID()},${input.requestHash},'airwallex','rate_limited','shared_window_exceeded',${input.ipHash},${input.clientHash}
      )`;
  }
  return { allowed: row.allowed, retryAfterSeconds: row.retry_after_seconds };
}

export async function enforceAirwallexCheckoutSecurity(
  request: Request,
  consumeRateLimit: CheckoutRateLimitConsumer = consumeDatabaseRateLimit
) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    throw new CheckoutSecurityError(403, "请从官网购物车发起结账。");
  }

  const ip = trustedVercelClientIp(request);
  const clientId = checkoutClientId(request);
  const secret = process.env.CHECKOUT_SECURITY_HASH_SECRET;
  if (!ip || !clientId || !secret || secret.length < 32 || secret.length > 1024) {
    throw new CheckoutSecurityError(503, "结账安全服务暂时不可用，请稍后重试。");
  }

  const result = await consumeRateLimit({
    ipHash: hashCheckoutSecurityKey(secret, "ip", ip),
    clientHash: hashCheckoutSecurityKey(secret, "client", clientId),
    requestHash: request.headers.get("idempotency-key")
      ? hashCheckoutSecurityKey(secret, "request", request.headers.get("idempotency-key") as string)
      : null,
    windowSeconds: WINDOW_SECONDS,
    ipLimit: IP_LIMIT,
    clientLimit: CLIENT_LIMIT
  });
  if (!result.allowed) {
    const retryAfterSeconds = Math.max(1, Math.min(result.retryAfterSeconds, WINDOW_SECONDS));
    throw new CheckoutSecurityError(429, "结账请求过于频繁，请稍后重试。", retryAfterSeconds);
  }
}
