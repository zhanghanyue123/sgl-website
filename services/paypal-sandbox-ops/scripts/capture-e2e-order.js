import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";

const WEBSITE_ENV = "/Users/hanyue/Documents/Codex/sgl-website/.env.local";
const STATE_FILE = "/Users/hanyue/.config/sgl/paypal-sandbox-e2e.env";

function parse(text) {
  return Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => {
    const index = line.indexOf("=");
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return [line.slice(0, index), value];
  }));
}

if (process.env.PAYPAL_ENABLED === "true") throw new Error("Refusing E2E capture while PayPal is enabled.");
const paypal = parse(await readFile(WEBSITE_ENV, "utf8"));
const state = parse(await readFile(STATE_FILE, "utf8"));
if (!paypal.PAYPAL_API_KEY || !paypal.PAYPAL_API_SECRET || !state.PAYPAL_ORDER_ID || !state.TEST_ORDER_ID) throw new Error("Sandbox E2E state is incomplete.");
const basic = Buffer.from(`${paypal.PAYPAL_API_KEY}:${paypal.PAYPAL_API_SECRET}`).toString("base64");
const tokenResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
  method: "POST", signal: AbortSignal.timeout(20_000),
  headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
  body: "grant_type=client_credentials"
});
if (!tokenResponse.ok) throw new Error(`PayPal OAuth HTTP ${tokenResponse.status}`);
const token = (await tokenResponse.json()).access_token;
const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

const orderResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodeURIComponent(state.PAYPAL_ORDER_ID)}`, { headers, signal: AbortSignal.timeout(20_000) });
const order = await orderResponse.json();
if (!orderResponse.ok) throw new Error(`PayPal order query HTTP ${orderResponse.status}: ${order.name || "unknown"} debug_id=${order.debug_id || "unavailable"}`);
if (order.id !== state.PAYPAL_ORDER_ID || !Array.isArray(order.purchase_units) || order.purchase_units.length !== 1) throw new Error("PayPal order association is invalid.");
const unit = order.purchase_units[0];
if (unit.reference_id !== state.TEST_ORDER_ID || unit.custom_id !== state.TEST_ORDER_ID) throw new Error("PayPal order does not match the SGL test order.");
if (unit.amount?.currency_code !== state.CURRENCY || unit.amount?.value !== (Number(state.EXPECTED_AMOUNT_CENTS) / 100).toFixed(2)) throw new Error("PayPal order amount mismatch.");

let capture = unit.payments?.captures?.[0];
let captureCalled = false;
if (order.status === "APPROVED" && !state.CAPTURE_ID) {
  const captureRequestId = `sgl-sandbox-capture-${createHash("sha256").update(`${state.TEST_ORDER_ID}\0${state.PAYPAL_ORDER_ID}`).digest("hex").slice(0, 32)}`;
  const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodeURIComponent(state.PAYPAL_ORDER_ID)}/capture`, {
    method: "POST", signal: AbortSignal.timeout(20_000),
    headers: { ...headers, "Content-Type": "application/json", "PayPal-Request-Id": captureRequestId, Prefer: "return=representation" },
    body: "{}"
  });
  const capturedOrder = await captureResponse.json();
  if (!captureResponse.ok) throw new Error(`PayPal capture HTTP ${captureResponse.status}: ${capturedOrder.name || "unknown"} debug_id=${capturedOrder.debug_id || "unavailable"}`);
  capture = capturedOrder.purchase_units?.[0]?.payments?.captures?.[0];
  if (capturedOrder.id !== state.PAYPAL_ORDER_ID || capturedOrder.status !== "COMPLETED") throw new Error("PayPal capture did not complete the expected order.");
  captureCalled = true;
  state.CAPTURE_REQUEST_ID = captureRequestId;
} else if (order.status !== "COMPLETED" || !capture) {
  throw new Error(`PayPal order is not capturable: ${order.status || "unknown"}`);
}

if (!capture?.id || capture.status !== "COMPLETED" || capture.amount?.currency_code !== state.CURRENCY || capture.amount?.value !== (Number(state.EXPECTED_AMOUNT_CENTS) / 100).toFixed(2)) {
  throw new Error("PayPal capture association or amount is invalid.");
}
state.CAPTURE_ID = capture.id;
state.PAYPAL_FINAL_STATUS = "COMPLETED";
state.CAPTURED_AT = new Date().toISOString();
await writeFile(STATE_FILE, Object.entries(state).map(([key, value]) => `${key}=${value}\n`).join(""), { mode: 0o600 });
await chmod(STATE_FILE, 0o600);
console.info(JSON.stringify({ queryHttp: orderResponse.status, statusBeforeCapture: order.status, captureCalled, captureStatus: capture.status, amount: `${capture.amount.value} ${capture.amount.currency_code}`, associationsValid: true, stateSaved: true }));
