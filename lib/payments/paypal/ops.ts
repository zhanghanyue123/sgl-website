import { createHash, timingSafeEqual } from "node:crypto";
import postgres from "postgres";
import { StoreError } from "@/lib/store/validation";

let client: ReturnType<typeof postgres> | null = null;

export function authorizePayPalOps(request: Request) {
  const expected = process.env.PAYPAL_OPS_TOKEN;
  const value = request.headers.get("authorization");
  if (!expected || expected.length < 32 || !value?.startsWith("Bearer ")) throw new StoreError(401, "Unauthorized.");
  const actual = Buffer.from(value.slice(7));
  const target = Buffer.from(expected);
  if (actual.length !== target.length || !timingSafeEqual(actual, target)) throw new StoreError(401, "Unauthorized.");
}

export function paypalOpsDb() {
  const url = process.env.PAYPAL_OPS_DATABASE_URL;
  if (!url) throw new StoreError(503, "PayPal OPS is not configured.");
  const parsed = new URL(url);
  if (!parsed.hostname.endsWith(".neon.tech") || parsed.searchParams.get("sslmode") !== "verify-full") {
    throw new StoreError(503, "PayPal OPS database TLS is not configured.");
  }
  client ||= postgres(url, { ssl: "verify-full", max: 2, idle_timeout: 10, connect_timeout: 10, prepare: false });
  return client;
}

export async function readOpsBody(request: Request, limit = 64_000) {
  authorizePayPalOps(request);
  const raw = await request.text();
  if (!raw || raw.length > limit) throw new StoreError(raw ? 413 : 400, "Invalid PayPal OPS request.");
  try { return { body: JSON.parse(raw) as Record<string, unknown>, raw }; }
  catch { throw new StoreError(400, "Invalid PayPal OPS request."); }
}

export function opsIdempotencyKey(request: Request) {
  const key = request.headers.get("idempotency-key");
  if (!key || !/^[A-Za-z0-9:_-]{8,120}$/.test(key)) throw new StoreError(400, "Invalid idempotency key.");
  return key;
}

export function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }

export function text(value: unknown, pattern: RegExp, message: string) {
  if (typeof value !== "string" || !pattern.test(value)) throw new StoreError(400, message);
  return value;
}

export function positiveInt(value: unknown, message: string) {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) throw new StoreError(400, message);
  return Number(value);
}
