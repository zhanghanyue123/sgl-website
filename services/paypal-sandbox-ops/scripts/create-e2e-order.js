import { createHash, randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import postgres from "postgres";

const WEBSITE_ENV = "/Users/hanyue/Documents/Codex/sgl-website/.env.local";
const BUYER_ENV = "/Users/hanyue/.config/sgl/paypal-sandbox-buyer.env";
const STATE_FILE = "/Users/hanyue/.config/sgl/paypal-sandbox-e2e.env";
const PREVIEW_ORIGIN = "https://sgl-website-mu1wfyuz3-zhanghanyue123s-projects.vercel.app";
const AMOUNT_CENTS = 100;

function parse(text) {
  return Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => {
    const index = line.indexOf("=");
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return [line.slice(0, index), value];
  }));
}

if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox" || process.env.PAYPAL_ENABLED === "true" || !process.env.DATABASE_URL) {
  throw new Error("Refusing E2E order creation outside disabled-payment Preview Sandbox.");
}
const paypal = parse(await readFile(WEBSITE_ENV, "utf8"));
const buyer = parse(await readFile(BUYER_ENV, "utf8"));
if (!paypal.PAYPAL_API_KEY || !paypal.PAYPAL_API_SECRET) throw new Error("Sandbox Business API credentials are missing.");
if (!buyer.PAYPAL_SANDBOX_BUYER_EMAIL || !buyer.PAYPAL_SANDBOX_BUYER_PASSWORD) throw new Error("Sandbox Buyer credentials are missing.");

const testOrderId = randomUUID();
const requestId = `sgl-sandbox-e2e-${createHash("sha256").update(testOrderId).digest("hex").slice(0, 32)}`;
const sql = postgres(process.env.DATABASE_URL, { ssl: "verify-full", max: 1, prepare: false, connect_timeout: 15 });
let paypalOrderId;
try {
  await sql`INSERT INTO paypal_sandbox_test_orders (test_order_id, expected_amount_cents, currency) VALUES (${testOrderId}, ${AMOUNT_CENTS}, 'USD')`;
  const basic = Buffer.from(`${paypal.PAYPAL_API_KEY}:${paypal.PAYPAL_API_SECRET}`).toString("base64");
  const tokenResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST", signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: "grant_type=client_credentials"
  });
  if (!tokenResponse.ok) throw new Error(`PayPal OAuth HTTP ${tokenResponse.status}`);
  const token = (await tokenResponse.json()).access_token;
  const orderResponse = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
    method: "POST", signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json", "PayPal-Request-Id": requestId, Prefer: "return=representation" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ reference_id: testOrderId, custom_id: testOrderId, invoice_id: testOrderId, amount: { currency_code: "USD", value: "1.00" } }],
      payment_source: { paypal: { experience_context: { brand_name: "Seagull Labs Sandbox", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", return_url: `${PREVIEW_ORIGIN}/checkout/paypal/return`, cancel_url: `${PREVIEW_ORIGIN}/cart` } } }
    })
  });
  const order = await orderResponse.json();
  if (!orderResponse.ok || !order.id) throw new Error(`PayPal create order HTTP ${orderResponse.status}: ${order.name || "unknown"} debug_id=${order.debug_id || "unavailable"}`);
  paypalOrderId = order.id;
  const approvalUrl = order.links?.find(link => link.rel === "payer-action" || link.rel === "approve")?.href;
  if (!approvalUrl || new URL(approvalUrl).hostname !== "www.sandbox.paypal.com") throw new Error("PayPal Sandbox approval URL is invalid.");
  await sql`UPDATE paypal_sandbox_test_orders SET paypal_order_id=${paypalOrderId}, updated_at=now() WHERE test_order_id=${testOrderId}`;
  await mkdir("/Users/hanyue/.config/sgl", { recursive: true, mode: 0o700 });
  await writeFile(STATE_FILE, [
    `TEST_ORDER_ID=${testOrderId}`,
    `PAYPAL_ORDER_ID=${paypalOrderId}`,
    `EXPECTED_AMOUNT_CENTS=${AMOUNT_CENTS}`,
    "CURRENCY=USD",
    `APPROVAL_URL=${approvalUrl}`,
    `REQUEST_ID=${requestId}`,
    ""
  ].join("\n"), { mode: 0o600 });
  await chmod(STATE_FILE, 0o600);
  console.info(JSON.stringify({ environment: "sandbox", databaseEnvironment: "preview", amount: "1.00 USD", paypalStatus: order.status, approvalUrl, stateFile: STATE_FILE }));
} catch (error) {
  if (!paypalOrderId) await sql`DELETE FROM paypal_sandbox_test_orders WHERE test_order_id=${testOrderId}`.catch(() => {});
  throw error;
} finally { await sql.end(); }
