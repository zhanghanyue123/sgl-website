import { randomBytes } from "node:crypto";
import postgres from "postgres";

const ownerUrl = process.env.PRODUCTION_DATABASE_URL;
if (!ownerUrl) throw new Error("PRODUCTION_DATABASE_URL is required");
const parsed = new URL(ownerUrl);
if (!parsed.hostname.endsWith(".neon.tech") || parsed.searchParams.get("sslmode") !== "verify-full") throw new Error("Production Neon verify-full URL required");
const role = "sgl_paypal_ops_runtime";
const password = randomBytes(36).toString("base64url");
const sql = postgres(ownerUrl, { ssl: "verify-full", max: 1, connect_timeout: 10, prepare: false });
try {
  const exists = await sql`SELECT 1 FROM pg_roles WHERE rolname=${role}`;
  const ddl = await sql`SELECT format(${exists.length ? "ALTER ROLE %I LOGIN PASSWORD %L" : "CREATE ROLE %I LOGIN PASSWORD %L"},${role},${password}) statement`;
  await sql.unsafe(ddl[0].statement);
  const db = parsed.pathname.slice(1);
  const connect = await sql`SELECT format('GRANT CONNECT ON DATABASE %I TO %I',${db},${role}) statement`;
  await sql.unsafe(connect[0].statement);
  await sql.unsafe(`GRANT USAGE ON SCHEMA paypal_ops TO ${role}`);
  await sql.unsafe(`GRANT EXECUTE ON FUNCTION paypal_ops.register_order(uuid,text,integer,text,text,text) TO ${role}`);
  await sql.unsafe(`GRANT EXECUTE ON FUNCTION paypal_ops.capture_context(text) TO ${role}`);
  await sql.unsafe(`GRANT EXECUTE ON FUNCTION paypal_ops.save_capture(text,text,text,integer,text,text) TO ${role}`);
  await sql.unsafe(`GRANT EXECUTE ON FUNCTION paypal_ops.save_webhook(text,text,text,text,text,text,integer,text) TO ${role}`);
  await sql.unsafe(`ALTER ROLE ${role} SET statement_timeout='10s'`);
  await sql.unsafe(`ALTER ROLE ${role} SET idle_in_transaction_session_timeout='10s'`);
  const runtime = new URL(ownerUrl);
  runtime.username = role;
  runtime.password = password;
  console.log(JSON.stringify({ role, runtimeDatabaseUrl: runtime.href, rotated: exists.length > 0 }));
} finally { await sql.end({ timeout: 2 }); }
