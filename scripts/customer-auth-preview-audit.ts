import postgres from "postgres";

async function main() {
  if (process.env.SGL_PREVIEW_MIGRATION_APPROVAL !== "customer-auth-mvp") throw new Error("Preview audit marker is required");
  const source = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;
  if (!source) throw new Error("Preview direct database URL is not configured");
  const target = new URL(source);
  if (!target.hostname.endsWith(".neon.tech") || target.hostname.includes("-pooler.")) throw new Error("Preview audit requires the direct Neon endpoint");
  target.searchParams.set("sslmode", "verify-full");
  const sql = postgres(target.toString(), { ssl: "require", max: 1, prepare: false });
  try {
    const identity = await sql<Array<{ database: string }>>`SELECT current_database() AS database`;
    const migrations = await sql<Array<{ version: string; checksum: string | null }>>`SELECT version,checksum FROM schema_migrations ORDER BY version`;
    const columns = await sql<Array<{ table_name: string; column_name: string; is_nullable: string }>>`
      SELECT table_name,column_name,is_nullable FROM information_schema.columns
      WHERE table_schema='public' AND table_name IN ('customers','customer_credentials','customer_sessions','customer_email_verifications','customer_pending_registrations')
      ORDER BY table_name,ordinal_position`;
    console.log(JSON.stringify({ environment: "Preview", database: identity[0]?.database, migrations, columns }));
  } finally { await sql.end({ timeout: 5 }); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Preview schema audit failed"); process.exitCode = 1; });
