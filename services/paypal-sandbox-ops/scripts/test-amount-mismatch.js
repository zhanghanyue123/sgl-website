import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

function parse(text) { return Object.fromEntries(text.split(/\r?\n/).filter(line => line.includes("=")).map(line => { const i=line.indexOf("="); return [line.slice(0,i),line.slice(i+1)]; })); }
if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox" || !process.env.DATABASE_URL) throw new Error("Refusing mismatch test outside Preview Sandbox.");
const secure = parse(await readFile("/Users/hanyue/.config/sgl/paypal-sandbox-webhook.env", "utf8"));
if (!secure.PREVIEW_OPS_TOKEN) throw new Error("OPS token is missing.");
const testOrderId = randomUUID();
const paypalOrderId = `TESTORDER${randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`;
const captureId = `TESTCAPTURE${randomUUID().replaceAll("-", "").slice(0, 18).toUpperCase()}`;
const eventId = `WH-MISMATCH-${randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`;
const event = { id: eventId, event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: captureId, status: "COMPLETED", amount: { value: "2.00", currency_code: "USD" }, supplementary_data: { related_ids: { order_id: paypalOrderId } } } };
const sql = postgres(process.env.DATABASE_URL, { ssl: "verify-full", max: 1, prepare: false, connect_timeout: 15 });
try {
  await sql`INSERT INTO paypal_sandbox_test_orders (test_order_id,paypal_order_id,expected_amount_cents,currency) VALUES (${testOrderId},${paypalOrderId},100,'USD')`;
  const response = await fetch("https://sgl-paypal-sandbox-ops.vercel.app/api/paypal/events", { method: "POST", headers: { Authorization: `Bearer ${secure.PREVIEW_OPS_TOKEN}`, "Content-Type": "application/json", "Idempotency-Key": eventId }, body: JSON.stringify({ environment: "sandbox", event, payloadSha256: createHash("sha256").update(JSON.stringify(event)).digest("hex") }) });
  const ack = await response.json();
  const rows = await sql`SELECT status,capture_id FROM paypal_sandbox_test_orders WHERE test_order_id=${testOrderId}`;
  if (!response.ok || ack.orderSyncStatus !== "amount_mismatch" || rows[0]?.status !== "amount_mismatch" || rows[0]?.capture_id !== null) throw new Error("Amount mismatch was not safely rejected.");
  console.info(JSON.stringify({ opsHttp: response.status, eventPersisted: ack.persisted === true, paymentProjection: ack.orderSyncStatus, orderStatus: rows[0].status, captureApplied: false }));
} finally {
  await sql`DELETE FROM paypal_sandbox_events WHERE event_id=${eventId}`.catch(() => {});
  await sql`DELETE FROM paypal_sandbox_test_orders WHERE test_order_id=${testOrderId}`.catch(() => {});
  await sql.end();
}
