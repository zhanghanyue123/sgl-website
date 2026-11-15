import postgres from "postgres";

if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox" || !process.env.DATABASE_URL) {
  throw new Error("Refusing cleanup verification outside Preview Sandbox.");
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "verify-full", max: 1, prepare: false, connect_timeout: 15 });
try {
  const events = await sql`SELECT count(*)::integer AS count FROM paypal_sandbox_events`;
  const orders = await sql`SELECT count(*)::integer AS count FROM paypal_sandbox_test_orders`;
  console.info(JSON.stringify({
    databaseEnvironment: "preview",
    remainingSandboxEventRecords: events[0].count,
    remainingSandboxTestOrders: orders[0].count,
    clean: events[0].count === 0 && orders[0].count === 0
  }));
} finally {
  await sql.end();
}
