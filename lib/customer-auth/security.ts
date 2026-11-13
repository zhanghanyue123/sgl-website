import { createHmac } from "node:crypto";
import { CustomerAuthError } from "./types";

const MAX_BODY_BYTES = 8 * 1024;

export function customerRequestOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set<string>();
  for (const value of [process.env.SITE_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null, "https://www.theseagulllabs.com"]) {
    if (!value) continue;
    try { allowed.add(new URL(value).origin); } catch { /* Invalid configuration is not trusted. */ }
  }
  try { return allowed.has(new URL(origin).origin); } catch { return false; }
}

export function requireCustomerOrigin(request: Request) {
  if (!customerRequestOriginAllowed(request)) throw new CustomerAuthError(403, "Invalid request origin");
}

export async function readCustomerJson(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) throw new CustomerAuthError(413, "Request body is too large");
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) throw new CustomerAuthError(413, "Request body is too large");
  try { return JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new CustomerAuthError(400, "Invalid JSON request"); }
}

export function customerAuthRateKey(request: Request, normalizedEmail: string) {
  const secret = process.env.CUSTOMER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new CustomerAuthError(503, "Customer authentication is not configured");
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHmac("sha256", secret).update(`${address}\n${normalizedEmail}`).digest("base64url");
}

export function customerNetworkHash(request: Request) {
  const secret = process.env.CUSTOMER_AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return address ? createHmac("sha256", secret).update(address).digest("base64url") : null;
}

export function cleanDisplayName(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new CustomerAuthError(400, "Name must be text");
  const result = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!result || result.length > 120) throw new CustomerAuthError(400, "Name must be between 1 and 120 characters");
  return result;
}
