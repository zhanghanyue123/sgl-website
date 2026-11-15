import { createHmac, timingSafeEqual } from "node:crypto";
import { getAirwallexApiConfig } from "./config";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function signingKey() {
  return createHmac("sha256", getAirwallexApiConfig().apiKey)
    .update("sgl-airwallex-checkout-status-v1")
    .digest();
}

export function createCheckoutStatusToken(orderId: string, paymentId: string) {
  if (!uuidPattern.test(orderId) || !uuidPattern.test(paymentId)) throw new Error("Checkout status identifiers are invalid");
  const payload = Buffer.from(`${orderId}:${paymentId}`).toString("base64url");
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyCheckoutStatusToken(token: string) {
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) || token.length > 300) return null;
  const [payload, encodedSignature] = token.split(".");
  const expected = createHmac("sha256", signingKey()).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const [orderId, paymentId, extra] = decoded.split(":");
  if (extra || !uuidPattern.test(orderId) || !uuidPattern.test(paymentId)) return null;
  return { orderId, paymentId };
}
