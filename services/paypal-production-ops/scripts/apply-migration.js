import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const source = await readFile(new URL("../migrations/0001_paypal_production_ops.sql", import.meta.url), "utf8");
const checksum = createHash("sha256").update(source).digest("hex");
const url = process.env.PRODUCTION_DATABASE_URL;
if (!url) throw new Error("PRODUCTION_DATABASE_URL is required");
const parsed = new URL(url);
if (!parsed.hostname.endsWith(".neon.tech") || parsed.searchParams.get("sslmode") !== "verify-full") throw new Error("Production Neon verify-full URL required");
const sql = postgres(url, { ssl: "verify-full", max: 1, connect_timeout: 10, prepare: false });
try {
  await sql.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended('sgl:paypal-production-ops:migration',0))`;
    const schema = await tx`SELECT 1 FROM information_schema.schemata WHERE schema_name='paypal_ops'`;
    if (schema.length) {
      const tracked = await tx`SELECT checksum FROM paypal_ops.schema_migrations WHERE version='0001_paypal_production_ops.sql'`;
      if (tracked[0]?.checksum !== checksum) throw new Error("PayPal OPS migration checksum mismatch");
      return;
    }
    await tx.unsafe(source);
    await tx`INSERT INTO paypal_ops.schema_migrations(version,checksum) VALUES('0001_paypal_production_ops.sql',${checksum})`;
  });
  console.log(JSON.stringify({ migration: "0001_paypal_production_ops.sql", checksum, status: "applied_or_verified" }));
} finally { await sql.end({ timeout: 2 }); }
