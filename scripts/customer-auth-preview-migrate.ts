import path from "node:path";
import { closeDb, getDb } from "../lib/admin/db";
import { applyMigrations, assertSafeMigrationTarget } from "./db-migrate";

async function main() {
  if (process.env.SGL_PREVIEW_MIGRATION_APPROVAL !== "customer-auth-mvp") {
    throw new Error("SGL_PREVIEW_MIGRATION_APPROVAL=customer-auth-mvp is required");
  }
  const source = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;
  if (!source) throw new Error("Preview unpooled database URL is not configured");
  const target = new URL(source);
  if (!target.hostname.endsWith(".neon.tech") || target.hostname.includes("-pooler.")) {
    throw new Error("Customer auth Preview migration requires the direct Neon endpoint");
  }
  const database = decodeURIComponent(target.pathname.replace(/^\//, ""));
  if (!database) throw new Error("Preview database name is missing");
  target.searchParams.set("sslmode", "verify-full");
  process.env.DATABASE_URL = target.toString();
  process.env.DATABASE_SSL = "verify-full";
  process.env.SGL_MIGRATION_TARGET = "production";
  process.env.SGL_MIGRATION_EXPECTED_DATABASE = database;
  process.env.SGL_MIGRATION_EXPECTED_HOST = target.hostname;
  process.env.SGL_MIGRATION_APPROVAL = `production:${database}`;
  process.env.SGL_MIGRATION_TLS_PROXY = "neon";

  const db = getDb();
  const before = await db<Array<{ database: string; migration_count: number }>>`
    SELECT current_database() AS database,(SELECT count(*)::int FROM schema_migrations) AS migration_count`;
  console.log(JSON.stringify({ environment: "Preview", database: before[0]?.database, migrationsBefore: before[0]?.migration_count }));
  const result = await applyMigrations({
    db,
    directory: path.join(process.cwd(), "db", "migrations"),
    expectedTarget: assertSafeMigrationTarget(),
    log: console.log
  });
  console.log(JSON.stringify({ environment: "Preview", applied: result.applied, skipped: result.skipped.length }));
  await closeDb();
}

main().catch(async (error) => { console.error(error instanceof Error ? error.message : "Preview migration failed"); await closeDb(); process.exitCode = 1; });
