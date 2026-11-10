import { getDb } from "@/lib/admin/db";

export type FriesDatabaseHealth = "connected" | "unconfigured" | "migration_required" | "unavailable";

export async function friesDatabaseHealth(environment: Readonly<Record<string, string | undefined>> = process.env): Promise<FriesDatabaseHealth> {
  if (!environment.DATABASE_URL?.trim()) return "unconfigured";
  try {
    const rows = await getDb()<Array<{ support_ready: boolean; outbox_ready: boolean; contact_ready: boolean; lease_columns: number }>>`
      SELECT
        to_regclass('public.support_conversations') IS NOT NULL
          AND to_regclass('public.support_tickets') IS NOT NULL AS support_ready,
        to_regclass('public.integration_outbox') IS NOT NULL AS outbox_ready,
        to_regclass('public.support_contact_submissions') IS NOT NULL AS contact_ready,
        (SELECT count(*)::int FROM information_schema.columns
          WHERE table_schema='public' AND table_name='integration_outbox'
            AND column_name IN ('source','lease_expires_at','leased_by_agent_client_id','lease_token_hash','acknowledged_at','ack_idempotency_key','max_attempts','failed_at','last_error_code')) AS lease_columns
    `;
    const row = rows[0];
    return row?.support_ready && row.outbox_ready && row.contact_ready && Number(row.lease_columns) === 9 ? "connected" : "migration_required";
  } catch { return "unavailable"; }
}
