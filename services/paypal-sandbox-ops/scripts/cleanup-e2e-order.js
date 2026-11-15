import { readFile } from "node:fs/promises";
import postgres from "postgres";

const STATE_FILE = "/Users/hanyue/.config/sgl/paypal-sandbox-e2e.env";

function parse(text) {
  return Object.fromEntries(text.split(/\r?\n/).filter(line => line.includes("=")).map(line => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1)];
  }));
}

if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox" || process.env.PAYPAL_ENABLED === "true" || !process.env.DATABASE_URL) {
  throw new Error("Refusing E2E cleanup outside disabled-payment Preview Sandbox.");
}

const state = parse(await readFile(STATE_FILE, "utf8"));
if (!state.TEST_ORDER_ID || !state.PAYPAL_ORDER_ID || !state.CAPTURE_ID) throw new Error("Sandbox E2E state is incomplete.");

const sql = postgres(process.env.DATABASE_URL, { ssl: "verify-full", max: 1, prepare: false, connect_timeout: 15 });
try {
  const result = await sql.begin(async tx => {
    const removedEvents = await tx`
      DELETE FROM paypal_sandbox_events
      WHERE resource_id IN (${state.PAYPAL_ORDER_ID}, ${state.CAPTURE_ID})
      RETURNING event_id
    `;
    const removedOrders = await tx`
      DELETE FROM paypal_sandbox_test_orders
      WHERE test_order_id=${state.TEST_ORDER_ID} AND paypal_order_id=${state.PAYPAL_ORDER_ID}
      RETURNING test_order_id
    `;
    return { removedEventCount: removedEvents.length, removedOrderCount: removedOrders.length };
  });

  const remainingEvents = await sql`
    SELECT count(*)::integer AS count FROM paypal_sandbox_events
    WHERE resource_id IN (${state.PAYPAL_ORDER_ID}, ${state.CAPTURE_ID})
  `;
  const remainingOrders = await sql`
    SELECT count(*)::integer AS count FROM paypal_sandbox_test_orders
    WHERE test_order_id=${state.TEST_ORDER_ID} OR paypal_order_id=${state.PAYPAL_ORDER_ID}
  `;
  console.info(JSON.stringify({
    ...result,
    remainingEventCount: remainingEvents[0].count,
    remainingOrderCount: remainingOrders[0].count,
    databaseEnvironment: "preview"
  }));
} finally {
  await sql.end();
}
