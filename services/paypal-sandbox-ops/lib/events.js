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
  const relatedOrderId = resource && typeof resource === "object" && resource.supplementary_data?.related_ids?.order_id;
  const paypalOrderId = eventType.startsWith("CHECKOUT.ORDER.") ? resourceId : (typeof relatedOrderId === "string" ? relatedOrderId : null);
  const captureId = eventType.startsWith("PAYMENT.CAPTURE.") ? resourceId : null;
  const amount = resource && typeof resource === "object" ? resource.amount : null;
  let amountCents = null;
  let currency = null;
  if (amount && typeof amount === "object" && typeof amount.value === "string" && /^\d+(?:\.\d{2})$/.test(amount.value) && typeof amount.currency_code === "string") {
    amountCents = Math.round(Number(amount.value) * 100);
    currency = amount.currency_code.toUpperCase();
  }
  const providerStatus = resource && typeof resource === "object" && typeof resource.status === "string" ? resource.status.slice(0, 64) : null;
  return { id, eventType, payloadSha256: value.payloadSha256, resourceId, paypalOrderId, captureId, providerStatus, amountCents, currency };
}

export async function persist(sql, input) {
  const rows = await sql`
    WITH stored AS (
      INSERT INTO paypal_sandbox_events (event_id, event_type, payload_sha256, resource_id)
      VALUES (${input.id}, ${input.eventType}, ${input.payloadSha256}, ${input.resourceId})
      ON CONFLICT (event_id) DO UPDATE SET
        last_seen_at = now(),
        delivery_count = paypal_sandbox_events.delivery_count + 1
      RETURNING event_id, delivery_count
    ), projected AS (
      SELECT apply_paypal_sandbox_event(
        ${input.eventType}, ${input.paypalOrderId}, ${input.captureId}, ${input.providerStatus},
        ${input.amountCents}, ${input.currency}
      ) AS order_sync_status
    )
    SELECT stored.event_id, stored.delivery_count, projected.order_sync_status
    FROM stored CROSS JOIN projected
  `;
  return { persisted: true, eventId: rows[0].event_id, status: rows[0].delivery_count === 1 ? "created" : "duplicate", orderSyncStatus: rows[0].order_sync_status };
}
