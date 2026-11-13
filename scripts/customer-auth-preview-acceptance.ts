import postgres from "postgres";

async function main() {
  if (process.env.SGL_PREVIEW_MIGRATION_APPROVAL !== "customer-auth-mvp") throw new Error("Preview acceptance marker is required");
  const source = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;
  if (!source) throw new Error("Preview direct database URL is not configured");
  const target = new URL(source); target.searchParams.set("sslmode", "verify-full");
  const sql = postgres(target.toString(), { ssl: "require", max: 1, prepare: false });
  const emails = ["customer-auth-preview-20261113@example.invalid", "customer-auth-concurrent-20261113@example.invalid"];
  try {
    const pending = await sql<Array<{ pending: number; superseded: number; verified: number }>>`
      SELECT count(*) FILTER (WHERE status='pending')::int AS pending,
        count(*) FILTER (WHERE status='superseded')::int AS superseded,
        count(*) FILTER (WHERE status='verified')::int AS verified
      FROM customer_pending_registrations WHERE email=ANY(${emails})`;
    const customer = await sql<Array<{ customers: number; sessions: number }>>`
      SELECT count(DISTINCT c.id)::int AS customers,count(DISTINCT s.id)::int AS sessions
      FROM customers c LEFT JOIN customer_sessions s ON s.customer_id=c.id
      WHERE lower(c.email)=ANY(${emails})`;
    const delivery = await sql<Array<{ status: string; total: number }>>`
      SELECT v.delivery_status AS status,count(*)::int AS total
      FROM customer_registration_verifications v JOIN customer_pending_registrations p ON p.id=v.pending_registration_id
      WHERE p.email=ANY(${emails}) GROUP BY v.delivery_status ORDER BY v.delivery_status`;
    console.log(JSON.stringify({ environment: "Preview", pending: pending[0], ownership: customer[0], delivery }));
  } finally { await sql.end({ timeout: 5 }); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Preview acceptance failed"); process.exitCode=1; });
