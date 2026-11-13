import { timingSafeEqual } from "node:crypto";

export const EVENT_ALLOWLIST = new Set([
  "CHECKOUT.ORDER.APPROVED", "CHECKOUT.ORDER.COMPLETED", "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.REVERSED"
]);

export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

export function authorize(value, expected = process.env.PREVIEW_OPS_TOKEN) {
  if (!expected || expected.length < 32 || typeof value !== "string" || !value.startsWith("Bearer ")) throw new HttpError(401, "Unauthorized.");
  const actual = Buffer.from(value.slice(7));
  const target = Buffer.from(expected);
  if (actual.length !== target.length || !timingSafeEqual(actual, target)) throw new HttpError(401, "Unauthorized.");
}

export function parsePayload(value, idempotencyKey) {
  if (!value || value.environment !== "sandbox" || !value.event || typeof value.event !== "object") throw new HttpError(400, "Invalid sandbox event.");
  const { id, event_type: eventType, resource } = value.event;
  if (typeof id !== "string" || id !== idempotencyKey || !/^[A-Z0-9-]{8,128}$/i.test(id)) throw new HttpError(400, "Invalid event idempotency key.");
  if (typeof eventType !== "string" || !EVENT_ALLOWLIST.has(eventType)) throw new HttpError(400, "Event type is not allowed.");
  if (typeof value.payloadSha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.payloadSha256)) throw new HttpError(400, "Invalid payload digest.");
  const resourceId = resource && typeof resource === "object" && typeof resource.id === "string" && resource.id.length <= 128 ? resource.id : null;
  return { id, eventType, payloadSha256: value.payloadSha256, resourceId };
}

export async function persist(sql, input) {
  const rows = await sql`
    INSERT INTO paypal_sandbox_webhook_events (event_id, event_type, payload_sha256, resource_id)
    VALUES (${input.id}, ${input.eventType}, ${input.payloadSha256}, ${input.resourceId})
    ON CONFLICT (event_id) DO UPDATE SET
      last_seen_at = now(),
      delivery_count = paypal_sandbox_webhook_events.delivery_count + 1
    RETURNING event_id, delivery_count
  `;
  return { persisted: true, eventId: rows[0].event_id, status: rows[0].delivery_count === 1 ? "created" : "duplicate" };
}
