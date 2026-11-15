import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const WEBSITE_ENV = "/Users/hanyue/Documents/Codex/sgl-website/.env.local";
const WEBHOOK_ENV = "/Users/hanyue/.config/sgl/paypal-sandbox-webhook.env";
const STATE_FILE = "/Users/hanyue/.config/sgl/paypal-sandbox-e2e.env";

function parse(text) {
  return Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => {
    const index = line.indexOf("=");
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return [line.slice(0, index), value];
  }));
}

if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox" || process.env.PAYPAL_ENABLED === "true") {
  throw new Error("Refusing duplicate-delivery verification outside disabled-payment Preview Sandbox.");
}

const paypal = parse(await readFile(WEBSITE_ENV, "utf8"));
const webhook = parse(await readFile(WEBHOOK_ENV, "utf8"));
const state = parse(await readFile(STATE_FILE, "utf8"));
if (!paypal.PAYPAL_API_KEY || !paypal.PAYPAL_API_SECRET || !webhook.PREVIEW_OPS_TOKEN || !state.PAYPAL_ORDER_ID || !state.CAPTURE_ID) {
  throw new Error("Sandbox duplicate-delivery verification configuration is incomplete.");
}

try {
  const basic = Buffer.from(`${paypal.PAYPAL_API_KEY}:${paypal.PAYPAL_API_SECRET}`).toString("base64");
  const tokenResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: "grant_type=client_credentials"
  });
  if (!tokenResponse.ok) throw new Error(`PayPal OAuth HTTP ${tokenResponse.status}`);
  const token = (await tokenResponse.json()).access_token;
  const eventResponse = await fetch("https://api-m.sandbox.paypal.com/v1/notifications/webhooks-events?page_size=20", {
    signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  const eventList = await eventResponse.json();
  if (!eventResponse.ok) throw new Error(`PayPal event query HTTP ${eventResponse.status}: ${eventList.name || "unknown"}`);
  const event = eventList.events?.find(candidate => candidate.event_type === "PAYMENT.CAPTURE.COMPLETED" && candidate.resource?.id === state.CAPTURE_ID);
  if (!event || event.resource?.supplementary_data?.related_ids?.order_id !== state.PAYPAL_ORDER_ID) {
    throw new Error("PayPal capture event association is invalid.");
  }

  const response = await fetch("https://sgl-paypal-sandbox-ops.vercel.app/api/paypal/events", {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: {
      Authorization: `Bearer ${webhook.PREVIEW_OPS_TOKEN}`,
      "Content-Type": "application/json",
      "Idempotency-Key": event.id
    },
    body: JSON.stringify({ environment: "sandbox", event, payloadSha256: createHash("sha256").update(JSON.stringify(event)).digest("hex") })
  });
  const acknowledgement = await response.json();
  if (!response.ok || acknowledgement.status !== "duplicate" || acknowledgement.orderSyncStatus !== "captured") {
    throw new Error("Duplicate capture event was not handled idempotently.");
  }
  console.info(JSON.stringify({
    paypalEventQueryHttp: eventResponse.status,
    opsHttp: response.status,
    acknowledgement: acknowledgement.status,
    durableAcknowledgement: true,
    orderStatusUnchanged: acknowledgement.orderSyncStatus,
    captureAssociationUnchanged: true
  }));
} finally {}
