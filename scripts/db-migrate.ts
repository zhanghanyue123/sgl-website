import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ReservedSql, Sql } from "postgres";
import { closeDb, getDb } from "../lib/admin/db";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const migrationFilePattern = /^(\d{4})_[a-z0-9_]+\.sql$/;
const migrationLockName = "sgl:schema-migrations";

function normalizedAddress(value: string | null) {
  return value?.replace(/^::ffff:/, "").replace(/\/\d+$/, "") ?? null;
}

function isLoopbackAddress(value: string | null) {
  const address = normalizedAddress(value);
  return address === "127.0.0.1" || address === "::1";
}

function isPrivateContainerAddress(value: string | null) {
  const address = normalizedAddress(value);
  if (!address) return false;
  const octets = address.split(".").map(Number);
  if (octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    return octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168);
  }
  return /^f[cd][0-9a-f]{2}:/i.test(address);
}

type MigrationIdentity = {
  database: string;
  currentUser: string;
  databaseOwner: string;
  serverAddress: string | null;
  serverPort: number | null;
  versionNumber: number;
  inRecovery: boolean;
  sslActive: boolean;
};

export type MigrationTarget =
  | { mode: "local-sandbox" | "local-development"; database: string; port: number }
  | { mode: "production"; database: string; port: number; host: string; tlsProof: "server" | "neon-proxy" };

export type MigrationResult = {
  sessionPid: number;
  applied: string[];
  skipped: string[];
};

export function assertSafeMigrationTarget(
  environment: Readonly<Record<string, string | undefined>> = process.env
): MigrationTarget {
  const mode = environment.SGL_MIGRATION_TARGET;
  if (mode !== "local-sandbox" && mode !== "local-development" && mode !== "production") {
    throw new Error("SGL_MIGRATION_TARGET must explicitly select local-sandbox, local-development, or production");
  }
  if (!environment.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  let target: URL;
  try {
    target = new URL(environment.DATABASE_URL);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL URL");
  }
  if (target.protocol !== "postgres:" && target.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use postgres:// or postgresql://");
  }
  const database = decodeURIComponent(target.pathname.replace(/^\//, ""));
  if (!target.port) throw new Error("DATABASE_URL must include an explicit PostgreSQL port");
  if (mode === "production") {
    if (loopbackHosts.has(target.hostname) || environment.DATABASE_SSL !== "verify-full") {
      throw new Error("Production migrations require a non-loopback host and DATABASE_SSL=verify-full");
    }
    if (environment.SGL_MIGRATION_EXPECTED_DATABASE !== database ||
      environment.SGL_MIGRATION_EXPECTED_HOST !== target.hostname) {
      throw new Error("Production database and host must match the explicit migration expectations");
    }
    if (environment.SGL_MIGRATION_APPROVAL !== `production:${database}`) {
      throw new Error("Production migration approval marker is missing");
    }
    const proxy = environment.SGL_MIGRATION_TLS_PROXY;
    if (proxy !== undefined && proxy !== "neon") {
      throw new Error("SGL_MIGRATION_TLS_PROXY supports only the explicitly verified neon proxy");
    }
    if (proxy === "neon") {
      if (!target.hostname.endsWith(".neon.tech") || target.hostname.includes("-pooler.")) {
        throw new Error("Neon migration TLS proof requires a direct .neon.tech connection");
      }
      if (target.searchParams.get("sslmode") !== "verify-full") {
        throw new Error("Neon migration TLS proof requires sslmode=verify-full");
      }
    }
    return { mode, database, port: Number(target.port), host: target.hostname,
      tlsProof: proxy === "neon" ? "neon-proxy" : "server" };
  } else {
    if (!loopbackHosts.has(target.hostname) || target.port === "5432") {
      throw new Error("Local migrations require an explicit non-default loopback PostgreSQL port");
    }
    if (environment.DATABASE_SSL !== "disable") {
      throw new Error("Local migration targets must set DATABASE_SSL=disable");
    }
    if (mode === "local-sandbox" && !/^sgl_airwallex_test_[a-z0-9_]+$/.test(database)) {
      throw new Error("Sandbox migration database name must start with sgl_airwallex_test_");
    }
    if (mode === "local-development" && database !== "sgl_web_commerce_dev") {
      throw new Error("Local development migrations are restricted to sgl_web_commerce_dev");
    }
    return { mode, database, port: Number(target.port) };
  }
}

export function assertLiveMigrationTarget(
  expected: ReturnType<typeof assertSafeMigrationTarget>,
  identity: MigrationIdentity
) {
  if (identity.database !== expected.database || !identity.currentUser ||
    identity.currentUser !== identity.databaseOwner) {
    throw new Error("Connected database identity does not match the approved migration target");
  }
  if (expected.mode === "production") {
    if (!identity.sslActive && expected.tlsProof !== "neon-proxy") {
      throw new Error("Production migration connection is not using TLS");
    }
    if (identity.serverPort !== expected.port) {
      throw new Error("Connected production PostgreSQL port does not match DATABASE_URL");
    }
  } else {
    if (!isLoopbackAddress(identity.serverAddress) && !isPrivateContainerAddress(identity.serverAddress)) {
      throw new Error("Connected PostgreSQL server is not local or on a private container network");
    }
    if (!identity.serverPort || identity.serverPort < 1 || identity.serverPort > 65535 ||
      (isLoopbackAddress(identity.serverAddress) && identity.serverPort !== expected.port)) {
      throw new Error("Connected PostgreSQL port does not match DATABASE_URL");
    }
  }
  if (identity.versionNumber < 160000 || identity.inRecovery) {
    throw new Error("A writable local PostgreSQL 16 or newer server is required");
  }
}

export function migrationChecksum(source: string) {
  return createHash("sha256").update(source).digest("hex");
}

export async function listMigrationFiles(directory: string) {
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  if (files.length === 0) throw new Error("No migration files were found");
  let previousSequence = 0;
  for (const file of files) {
    const match = migrationFilePattern.exec(file);
    if (!match) throw new Error(`Invalid migration filename: ${file}`);
    const sequence = Number(match[1]);
    if (sequence !== previousSequence + 1) {
      throw new Error(`Migration sequence must be contiguous; expected ${String(previousSequence + 1).padStart(4, "0")}, found ${file}`);
    }
    previousSequence = sequence;
  }
  return files;
}

async function readIdentity(connection: ReservedSql): Promise<MigrationIdentity & { sessionPid: number }> {
  const rows = await connection<{
    database: string;
    current_user_name: string;
    database_owner: string;
    server_address: string | null;
    server_port: number | null;
    version_number: number;
    in_recovery: boolean;
    session_pid: number;
    ssl_active: boolean;
  }[]>`SELECT current_database() AS database,current_user AS current_user_name,
    pg_get_userbyid(d.datdba) AS database_owner,inet_server_addr()::text AS server_address,
    inet_server_port() AS server_port,current_setting('server_version_num')::int AS version_number,
    pg_is_in_recovery() AS in_recovery,pg_backend_pid() AS session_pid,
    EXISTS(SELECT 1 FROM pg_stat_ssl WHERE pid=pg_backend_pid() AND ssl) AS ssl_active
    FROM pg_database d WHERE d.datname=current_database()`;
  const identity = rows[0];
  if (!identity) throw new Error("Connected database identity could not be verified");
  return {
    database: identity.database,
    currentUser: identity.current_user_name,
    databaseOwner: identity.database_owner,
    serverAddress: identity.server_address,
    serverPort: identity.server_port,
    versionNumber: identity.version_number,
    inRecovery: identity.in_recovery,
    sslActive: identity.ssl_active,
    sessionPid: identity.session_pid
  };
}

async function inReservedTransaction<T>(connection: ReservedSql, operation: () => Promise<T>) {
  await connection.unsafe("BEGIN");
  try {
    const result = await operation();
    await connection.unsafe("COMMIT");
    return result;
  } catch (error) {
    try {
      await connection.unsafe("ROLLBACK");
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], "Migration failed and its transaction could not be rolled back");
    }
    throw error;
  }
}

export async function applyMigrations(options: {
  db: Sql;
  directory: string;
  expectedTarget: MigrationTarget;
  acceptLegacyChecksums?: boolean;
  log?: (message: string) => void;
}): Promise<MigrationResult> {
  const files = await listMigrationFiles(options.directory);
  const connection = await options.db.reserve();
  const appliedFiles: string[] = [];
  const skippedFiles: string[] = [];
  let lockAcquired = false;
  let operationError: unknown;
  try {
    const identity = await readIdentity(connection);
    assertLiveMigrationTarget(options.expectedTarget, identity);
    await connection`SELECT pg_advisory_lock(hashtextextended(${migrationLockName},0))`;
    lockAcquired = true;
    await connection`CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      checksum text,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`;
    await connection`ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum text`;

    const sources = new Map<string, { source: string; checksum: string }>();
    for (const file of files) {
      const source = await readFile(path.join(options.directory, file), "utf8");
      sources.set(file, { source, checksum: migrationChecksum(source) });
    }
    const tracked = await connection<{ version: string; checksum: string | null }[]>`
      SELECT version,checksum FROM schema_migrations ORDER BY version`;
    const knownFiles = new Set(files);
    for (const row of tracked) {
      if (!knownFiles.has(row.version)) {
        throw new Error(`Database records an unknown migration: ${row.version}`);
      }
    }
    const trackedByVersion = new Map(tracked.map((row) => [row.version, row]));
    let pendingSeen = false;
    const legacyChecksums: Array<{ file: string; checksum: string }> = [];
    for (const file of files) {
      const row = trackedByVersion.get(file);
      if (!row) {
        pendingSeen = true;
        continue;
      }
      if (pendingSeen) throw new Error(`Migration tracking has a gap before ${file}`);
      const expectedChecksum = sources.get(file)?.checksum;
      if (!expectedChecksum) throw new Error(`Migration source could not be loaded: ${file}`);
      if (row.checksum === null) {
        if (!options.acceptLegacyChecksums) {
          throw new Error(`Migration ${file} has no checksum; review it before explicit legacy checksum adoption`);
        }
        legacyChecksums.push({ file, checksum: expectedChecksum });
      } else if (row.checksum !== expectedChecksum) {
        throw new Error(`Migration checksum mismatch: ${file}`);
      }
    }
    if (legacyChecksums.length > 0) {
      await inReservedTransaction(connection, async () => {
        for (const legacy of legacyChecksums) {
          await connection`UPDATE schema_migrations SET checksum=${legacy.checksum}
            WHERE version=${legacy.file} AND checksum IS NULL`;
        }
      });
    }

    for (const file of files) {
      if (trackedByVersion.has(file)) {
        skippedFiles.push(file);
        options.log?.(`skip ${file}`);
        continue;
      }
      const migration = sources.get(file);
      if (!migration) throw new Error(`Migration source could not be loaded: ${file}`);
      await inReservedTransaction(connection, async () => {
        await connection.unsafe(migration.source);
        await connection`INSERT INTO schema_migrations(version,checksum) VALUES(${file},${migration.checksum})`;
      });
      appliedFiles.push(file);
      options.log?.(`applied ${file}`);
    }
    return { sessionPid: identity.sessionPid, applied: appliedFiles, skipped: skippedFiles };
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    try {
      if (lockAcquired) {
        const unlocked = await connection<{ unlocked: boolean }[]>`
          SELECT pg_advisory_unlock(hashtextextended(${migrationLockName},0)) AS unlocked`;
        if (!unlocked[0]?.unlocked && operationError === undefined) {
          throw new Error("Migration advisory lock was not owned by the reserved session");
        }
      }
    } catch (unlockError) {
      if (operationError === undefined) throw unlockError;
    } finally {
      connection.release();
    }
  }
}

async function main() {
  const safeTarget = assertSafeMigrationTarget();
  return applyMigrations({
    db: getDb(),
    directory: path.join(process.cwd(), "db", "migrations"),
    expectedTarget: safeTarget,
    acceptLegacyChecksums: process.env.SGL_ACCEPT_LEGACY_MIGRATION_CHECKSUMS === "true",
    log: console.log
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(closeDb).catch(async (error) => {
    const value = error && typeof error === "object" ? error as { name?: unknown; code?: unknown } : {};
    const errorName = typeof value.name === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(value.name)
      ? value.name : "Error";
    const errorCode = typeof value.code === "string" && /^[A-Z0-9]{1,16}$/.test(value.code)
      ? value.code : undefined;
    console.error(JSON.stringify({ event: "db.migrate.failed", errorName, ...(errorCode ? { errorCode } : {}) }));
    await closeDb();
    process.exitCode = 1;
  });
}
