import { getDb } from "@/lib/admin/db";

declare global {
  // eslint-disable-next-line no-var
  var __sglRateLimitSchema: Promise<void> | undefined;
}

export type DatabaseRateLimitConsumer = (
  key: string,
  limit: number,
  windowMs: number
) => Promise<boolean>;

async function ensureRateLimitSchema() {
  if (!globalThis.__sglRateLimitSchema) {
    const db = getDb();
    globalThis.__sglRateLimitSchema = db.begin(async (tx) => {
      await tx.unsafe("SET LOCAL statement_timeout = '5000ms'");
      await tx`SELECT pg_advisory_xact_lock(53474, 5005)`;
      await tx.unsafe(`
        CREATE TABLE IF NOT EXISTS public_rate_limit_buckets (
          bucket_key text PRIMARY KEY,
          request_count integer NOT NULL DEFAULT 1,
          reset_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now(),
          CHECK (length(bucket_key) BETWEEN 8 AND 160),
          CHECK (request_count >= 1)
        )
      `);
      await tx.unsafe(`
        CREATE INDEX IF NOT EXISTS public_rate_limit_buckets_reset_idx
          ON public_rate_limit_buckets(reset_at)
      `);
      await tx.unsafe(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await tx`
        INSERT INTO schema_migrations (version)
        VALUES ('0005_public_rate_limits.sql')
        ON CONFLICT (version) DO NOTHING
      `;
    }).then(() => undefined).catch((error) => {
      globalThis.__sglRateLimitSchema = undefined;
      throw error;
    });
  }
  return globalThis.__sglRateLimitSchema;
}

/**
 * Atomically consumes a shared rate-limit bucket in PostgreSQL.
 * The bucket key contains only the request scope and a SHA-256 address hash.
 */
export const consumeDatabaseRateLimit: DatabaseRateLimitConsumer = async (
  key,
  limit,
  windowMs
) => {
  await ensureRateLimitSchema();
  const db = getDb();
  return db.begin(async (tx) => {
    await tx.unsafe("SET LOCAL statement_timeout = '2500ms'");
    const rows = await tx`
      INSERT INTO public_rate_limit_buckets (
        bucket_key,
        request_count,
        reset_at,
        updated_at
      ) VALUES (
        ${key},
        1,
        now() + (${windowMs}::bigint * interval '1 millisecond'),
        now()
      )
      ON CONFLICT (bucket_key) DO UPDATE SET
        request_count = CASE
          WHEN public_rate_limit_buckets.reset_at <= now() THEN 1
          ELSE LEAST(public_rate_limit_buckets.request_count + 1, ${limit + 1})
        END,
        reset_at = CASE
          WHEN public_rate_limit_buckets.reset_at <= now()
            THEN now() + (${windowMs}::bigint * interval '1 millisecond')
          ELSE public_rate_limit_buckets.reset_at
        END,
        updated_at = now()
      RETURNING request_count
    `;
    return Number(rows[0]?.request_count) <= limit;
  });
};
