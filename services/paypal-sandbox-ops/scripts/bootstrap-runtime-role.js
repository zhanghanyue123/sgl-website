import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import postgres from "postgres";

const ROLE = "paypal_sandbox_ops_runtime";
const TABLE = "paypal_sandbox_events";
const MIGRATIONS = ["0001_paypal_sandbox_events.sql", "0002_paypal_sandbox_test_orders.sql"];

if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox" || !process.env.DATABASE_URL) {
  throw new Error("Refusing role bootstrap outside the Preview Sandbox environment.");
}

const adminUrl = new URL(process.env.DATABASE_URL);
if (adminUrl.protocol !== "postgres:" && adminUrl.protocol !== "postgresql:") throw new Error("Preview database URL is invalid.");
const password = randomBytes(32).toString("hex");
const migrations = await Promise.all(MIGRATIONS.map(async name => {
  const body = await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8");
  return { name, body, checksum: createHash("sha256").update(body).digest("hex") };
}));
const sql = postgres(adminUrl.href, { ssl: "verify-full", max: 1, prepare: false, connect_timeout: 15 });

try {
  await sql.begin(async tx => {
    await tx`
      CREATE TABLE IF NOT EXISTS paypal_sandbox_ops_migrations (
        migration_name text PRIMARY KEY,
        checksum text NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$'),
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    for (const migration of migrations) {
      const registered = await tx`SELECT checksum FROM paypal_sandbox_ops_migrations WHERE migration_name = ${migration.name}`;
      if (registered.length && registered[0].checksum !== migration.checksum) throw new Error(`Sandbox OPS migration checksum mismatch: ${migration.name}`);
      if (!registered.length) {
        await tx.unsafe(migration.body);
        await tx`INSERT INTO paypal_sandbox_ops_migrations (migration_name, checksum) VALUES (${migration.name}, ${migration.checksum})`;
      }
    }
    const existing = await tx`SELECT 1 FROM pg_roles WHERE rolname = ${ROLE}`;
    if (!existing.length) await tx.unsafe(`CREATE ROLE ${ROLE} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION`);
    else await tx.unsafe(`ALTER ROLE ${ROLE} WITH PASSWORD '${password}'`);
    await tx.unsafe(`REVOKE ALL ON TABLE ${TABLE} FROM ${ROLE}`);
    await tx.unsafe(`REVOKE ALL ON TABLE paypal_sandbox_ops_migrations FROM ${ROLE}`);
    await tx.unsafe(`REVOKE CREATE ON SCHEMA public FROM ${ROLE}`);
    await tx.unsafe(`GRANT USAGE ON SCHEMA public TO ${ROLE}`);
    await tx.unsafe(`GRANT SELECT, INSERT, UPDATE ON TABLE ${TABLE} TO ${ROLE}`);
    await tx.unsafe(`REVOKE ALL ON TABLE paypal_sandbox_test_orders FROM ${ROLE}`);
    await tx.unsafe(`GRANT EXECUTE ON FUNCTION apply_paypal_sandbox_event(text,text,text,text,integer,text) TO ${ROLE}`);
  });

  const runtimeUrl = new URL(adminUrl.href);
  runtimeUrl.username = ROLE;
  runtimeUrl.password = password;
  const runtime = postgres(runtimeUrl.href, { ssl: "verify-full", max: 1, prepare: false, connect_timeout: 15 });
  try {
    const identity = await runtime`SELECT current_user AS current_user, current_database() AS database_name`;
    if (identity[0].current_user !== ROLE) throw new Error("Runtime role identity verification failed.");
    await runtime`SELECT event_id FROM paypal_sandbox_events LIMIT 0`;
    const privileges = await runtime`
      SELECT table_name,
             has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'SELECT') AS can_select,
             has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'INSERT') AS can_insert,
             has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'UPDATE') AS can_update,
             has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'DELETE') AS can_delete
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const unexpected = privileges.filter(row => row.table_name !== TABLE && (row.can_select || row.can_insert || row.can_update || row.can_delete));
    const target = privileges.find(row => row.table_name === TABLE);
    if (unexpected.length || !target?.can_select || !target.can_insert || !target.can_update || target.can_delete) {
      throw new Error("Runtime role privilege verification failed.");
    }
    const functions = await runtime`SELECT has_function_privilege(current_user, 'apply_paypal_sandbox_event(text,text,text,text,integer,text)', 'EXECUTE') AS can_execute`;
    if (!functions[0]?.can_execute) throw new Error("Runtime projection-function privilege verification failed.");
  } finally { await runtime.end(); }

  const child = spawnSync("vercel", ["env", "add", "DATABASE_URL", "production", "--sensitive", "--force"], {
    cwd: new URL("..", import.meta.url), input: runtimeUrl.href, encoding: "utf8", env: process.env
  });
  if (child.status !== 0) throw new Error(`Vercel environment update failed: ${child.stderr.replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[REDACTED]")}`);
  console.info(JSON.stringify({ migrations: migrations.map(({ name, checksum }) => ({ name, checksum })), role: ROLE, table: TABLE, runtimePrivileges: ["SELECT", "INSERT", "UPDATE", "EXECUTE:apply_paypal_sandbox_event"], databaseEnvironment: "preview", vercelEnvironmentUpdated: true }));
} finally {
  await sql.end();
}
