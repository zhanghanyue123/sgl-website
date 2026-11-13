import { readFile } from "node:fs/promises";
import postgres from "postgres";

if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox" || !process.env.DATABASE_URL) {
  throw new Error("Refusing migration outside the Preview Sandbox environment.");
}
const sql = postgres(process.env.DATABASE_URL, { ssl: "verify-full", max: 1, prepare: false });
try {
  const migration = await readFile(new URL("../migrations/0001_paypal_sandbox_events.sql", import.meta.url), "utf8");
  await sql.begin(async transaction => { await transaction.unsafe(migration); });
  console.info("Preview Sandbox OPS migration 0001 applied.");
} finally { await sql.end(); }
