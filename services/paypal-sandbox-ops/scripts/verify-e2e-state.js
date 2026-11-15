import { readFile } from "node:fs/promises";
import postgres from "postgres";

function parse(text) { return Object.fromEntries(text.split(/\r?\n/).filter(line => line.includes("=")).map(line => { const i = line.indexOf("="); return [line.slice(0, i), line.slice(i + 1)]; })); }
if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox" || !process.env.DATABASE_URL) throw new Error("Refusing verification outside Preview Sandbox.");
const state = parse(await readFile("/Users/hanyue/.config/sgl/paypal-sandbox-e2e.env", "utf8"));
if (!state.TEST_ORDER_ID || !state.PAYPAL_ORDER_ID || !state.CAPTURE_ID) throw new Error("Sandbox E2E state is incomplete.");
const sql = postgres(process.env.DATABASE_URL, { ssl: "verify-full", max: 1, prepare: false, connect_timeout: 15 });
try {
  const orders = await sql`
    SELECT status, expected_amount_cents, currency, capture_id IS NOT DISTINCT FROM ${state.CAPTURE_ID} AS capture_matches
    FROM paypal_sandbox_test_orders
    WHERE test_order_id=${state.TEST_ORDER_ID} AND paypal_order_id=${state.PAYPAL_ORDER_ID}
  `;
  const events = await sql`
    SELECT event_type, status, delivery_count
    FROM paypal_sandbox_events
    WHERE resource_id IN (${state.PAYPAL_ORDER_ID}, ${state.CAPTURE_ID})
    ORDER BY received_at
  `;
  console.info(JSON.stringify({
    orderFound: orders.length === 1,
    orderStatus: orders[0]?.status || null,
    amount: orders.length ? `${(orders[0].expected_amount_cents / 100).toFixed(2)} ${orders[0].currency}` : null,
    captureAssociation: orders[0]?.capture_matches || false,
    durableEvents: events.map(row => ({ eventType: row.event_type, status: row.status, deliveryCount: row.delivery_count }))
  }));
} finally { await sql.end(); }
