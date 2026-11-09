import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
const KEY_LENGTH = 64;
const scryptOptions = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function derive(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => scryptCallback(password, salt, KEY_LENGTH, scryptOptions, (error, key) => error ? reject(error) : resolve(key)));
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validatePassword(value: string) {
  if (value.length < 12 || value.length > 200) throw new Error("Password must be between 12 and 200 characters");
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    throw new Error("Password must include upper-case, lower-case and numeric characters");
  }
  return value;
}

export async function hashPassword(password: string, salt = randomBytes(24).toString("base64url")) {
  validatePassword(password);
  const derived = await derive(password, salt);
  return { salt, hash: derived.toString("base64url") };
}

export async function verifyPassword(password: string, salt: string, expected: string) {
  try {
    const derived = await derive(password, salt);
    const expectedBuffer = Buffer.from(expected, "base64url");
    return expectedBuffer.length === derived.length && timingSafeEqual(expectedBuffer, derived);
  } catch {
    return false;
  }
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

export function hashNetworkValue(value?: string | null) {
  if (!value) return null;
  const secret = process.env.ADMIN_AUDIT_SECRET;
  if (!secret) return null;
  return createHash("sha256").update(`${secret}:${value}`).digest("base64url");
}

export function safeOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configured = process.env.SITE_URL || "https://www.theseagulllabs.com";
  try {
    return new URL(origin).origin === new URL(configured).origin;
  } catch {
    return false;
  }
}

export function safePublicOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configured = process.env.SITE_URL || "https://www.theseagulllabs.com";
  try {
    return new URL(origin).origin === new URL(configured).origin;
  } catch {
    return false;
  }
}
