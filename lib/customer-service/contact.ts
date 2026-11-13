import { createHash } from "node:crypto";
import { supportLocales, type SupportLocale } from "./types";
import { signedServiceHeaders } from "./fries-agent";

export type ContactSubmission = {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: SupportLocale;
  idempotencyKey: string;
};

function text(value: unknown, field: string, max: number) {
  if (typeof value !== "string") throw Object.assign(new Error(`${field} is required`), { status: 400 });
  const clean = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();
  if (!clean || clean.length > max) throw Object.assign(new Error(`${field} is invalid`), { status: 400 });
  return clean;
}

export function validateContactSubmission(value: unknown, idempotencyHeader?: string | null): ContactSubmission {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("Invalid contact form"), { status: 400 });
  const body = value as Record<string, unknown>;
  if (typeof body.website === "string" && body.website.trim()) throw Object.assign(new Error("Submission rejected"), { status: 400 });
  const email = text(body.email, "email", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error("email is invalid"), { status: 400 });
  const message = text(body.message, "message", 4000);
  const links = message.match(/https?:\/\//gi)?.length ?? 0;
  if (links > 3 || /(.)\1{14,}/.test(message)) throw Object.assign(new Error("Submission rejected"), { status: 400 });
  const locale = supportLocales.includes(body.locale as SupportLocale) ? body.locale as SupportLocale : "en";
  const idempotencyKey = text(idempotencyHeader || body.idempotencyKey, "idempotency key", 128);
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) throw Object.assign(new Error("idempotency key is invalid"), { status: 400 });
  return { name: text(body.name, "name", 160), email, subject: text(body.subject, "subject", 200), message, locale, idempotencyKey };
}

export function contactSubmissionHash(input: ContactSubmission) {
  return createHash("sha256").update(`${input.email}\n${input.subject}\n${input.message}\n${input.idempotencyKey}`).digest("hex");
}

export type ContactDeliveryResult = { providerMessageId: string; mode: "relay" | "mock" };

export async function deliverContactSubmission(
  input: ContactSubmission,
  environment: Readonly<Record<string, string | undefined>> = process.env,
  fetcher: typeof fetch = fetch
): Promise<ContactDeliveryResult> {
  if (environment.NODE_ENV === "test" && environment.FRIES_CONTACT_DELIVERY_MODE === "mock") {
    return { providerMessageId: `mock-${contactSubmissionHash(input).slice(0, 16)}`, mode: "mock" };
  }
  const url = environment.FRIES_CONTACT_DELIVERY_URL?.trim();
  const token = environment.FRIES_CONTACT_DELIVERY_TOKEN?.trim();
  const signingSecret = environment.FRIES_CONTACT_DELIVERY_SIGNING_SECRET?.trim() || "";
  const clientKey = environment.FRIES_CONTACT_DELIVERY_CLIENT_KEY?.trim() || "";
  if (!url || !token || signingSecret.length < 32 || !/^[A-Za-z0-9_-]{8,128}$/.test(clientKey)) {
    throw Object.assign(new Error("Contact delivery is not configured"), { status: 503 });
  }
  const body = JSON.stringify({ schemaVersion: "fries.contact.relay.v1", replyTo: input.email, name: input.name, subject: input.subject, message: input.message, locale: input.locale });
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "POST",
      headers: { ...signedServiceHeaders({ url, method: "POST", body, idempotencyKey: input.idempotencyKey, token, signingSecret, clientKey }), "content-type": "application/json", "idempotency-key": input.idempotencyKey },
      body,
      signal: AbortSignal.timeout(8_000),
      cache: "no-store"
    });
  } catch {
    throw Object.assign(new Error("Contact delivery is temporarily unavailable"), { status: 503, retrySafe: false });
  }
  if (!response.ok) throw Object.assign(new Error("Contact delivery failed"), { status: response.status >= 500 ? 503 : 502, retrySafe: response.status < 500 });
  const result = await response.json().catch(() => null) as { sent?: unknown; messageId?: unknown } | null;
  if (result?.sent !== true || typeof result.messageId !== "string" || !result.messageId) throw Object.assign(new Error("Contact delivery was not confirmed"), { status: 502, retrySafe: true });
  return { providerMessageId: result.messageId.slice(0, 200), mode: "relay" };
}
