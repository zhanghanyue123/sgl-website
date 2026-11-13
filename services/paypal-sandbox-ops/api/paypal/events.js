import postgres from "postgres";
import { HttpError, authorize, parsePayload, persist } from "../../lib/events.js";

export const config = { api: { bodyParser: { sizeLimit: "256kb" } } };

let client;
function database() {
  if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox") throw new HttpError(503, "Preview Sandbox OPS is disabled.");
  const url = process.env.DATABASE_URL;
  if (!url) throw new HttpError(503, "Preview database is not configured.");
  client ||= postgres(url, { ssl: "verify-full", max: 2, idle_timeout: 10, connect_timeout: 10, prepare: false });
  return client;
}

export default async function handler(request, response) {
  try {
    if (request.method !== "POST") throw new HttpError(405, "Method not allowed.");
    authorize(request.headers.authorization);
    const key = request.headers["idempotency-key"];
    if (typeof key !== "string") throw new HttpError(400, "Idempotency key is required.");
    const input = parsePayload(request.body, key);
    const ack = await persist(database(), input);
    console.info(JSON.stringify({ service: "paypal-sandbox-ops", eventType: input.eventType, status: ack.status }));
    return response.status(200).json(ack);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 503;
    console.warn(JSON.stringify({ service: "paypal-sandbox-ops", result: `error_${status}` }));
    return response.status(status).json({ error: error instanceof HttpError ? error.message : "Preview Sandbox OPS is temporarily unavailable." });
  }
}
