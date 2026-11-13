import { createHash } from "node:crypto";
import { EVENT_ALLOWLIST, HttpError, audit, persistEvent, rateLimit, validateEvent, verifySignature } from "../../lib/webhook.js";

export const config = { api: { bodyParser: false } };

async function readBody(request) {
  const length = Number(request.headers["content-length"] || 0);
  if (Number.isFinite(length) && length > 256_000) throw new HttpError(413, "PayPal webhook payload is too large.");
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 256_000) throw new HttpError(413, "PayPal webhook payload is too large.");
    chunks.push(chunk);
  }
  if (!size) throw new HttpError(400, "PayPal webhook payload is empty.");
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(request, response) {
  const startedAt = Date.now();
  let event;
  try {
    if (request.method !== "POST") throw new HttpError(405, "Method not allowed.");
    const forwarded = String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0].trim();
    rateLimit(createHash("sha256").update(forwarded).digest("hex"));
    const raw = await readBody(request);
    try { event = validateEvent(JSON.parse(raw)); } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, "PayPal webhook payload is invalid."); }
    await verifySignature(request.headers, event);
    if (!EVENT_ALLOWLIST.has(event.event_type)) {
      audit(event, "verified_ignored", startedAt);
      return response.status(200).json({ received: true, ignored: true });
    }
    const ack = await persistEvent(event, raw);
    audit(event, ack.status, startedAt);
    return response.status(200).json({ received: true, eventId: event.id, status: ack.status });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 503;
    audit(event, `error_${status}`, startedAt);
    return response.status(status).json({ error: error instanceof HttpError ? error.message : "Sandbox webhook ingress is temporarily unavailable." });
  }
}
