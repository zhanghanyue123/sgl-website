import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { assertLiveMigrationTarget, assertSafeMigrationTarget, listMigrationFiles, migrationChecksum } from "../scripts/db-migrate";

test("migration runner requires explicit local or production target approval", () => {
  assert.deepEqual(assertSafeMigrationTarget({
    SGL_MIGRATION_TARGET: "local-sandbox",
    DATABASE_URL: "postgresql://tester:secret@127.0.0.1:55433/sgl_airwallex_test_acceptance",
    DATABASE_SSL: "disable"
  }), { mode: "local-sandbox", database: "sgl_airwallex_test_acceptance", port: 55433 });
  assert.deepEqual(assertSafeMigrationTarget({
    SGL_MIGRATION_TARGET: "production",
    DATABASE_URL: "postgresql://migrator:secret@db.internal.example:6432/sgl_commerce",
    DATABASE_SSL: "verify-full",
    SGL_MIGRATION_EXPECTED_DATABASE: "sgl_commerce",
    SGL_MIGRATION_EXPECTED_HOST: "db.internal.example",
    SGL_MIGRATION_APPROVAL: "production:sgl_commerce"
  }), { mode: "production", database: "sgl_commerce", port: 6432, host: "db.internal.example", tlsProof: "server" });
  assert.deepEqual(assertSafeMigrationTarget({
    SGL_MIGRATION_TARGET: "production",
    DATABASE_URL: "postgresql://migrator:secret@ep-safe.iad1.aws.neon.tech:5432/neondb?sslmode=verify-full",
    DATABASE_SSL: "verify-full",
    SGL_MIGRATION_EXPECTED_DATABASE: "neondb",
    SGL_MIGRATION_EXPECTED_HOST: "ep-safe.iad1.aws.neon.tech",
    SGL_MIGRATION_APPROVAL: "production:neondb",
    SGL_MIGRATION_TLS_PROXY: "neon"
  }), { mode: "production", database: "neondb", port: 5432, host: "ep-safe.iad1.aws.neon.tech", tlsProof: "neon-proxy" });

  for (const environment of [
    {},
    { SGL_MIGRATION_TARGET: "production", DATABASE_URL: "postgresql://example.invalid/sgl", DATABASE_SSL: "require" },
    { SGL_MIGRATION_TARGET: "local-sandbox", DATABASE_URL: "postgresql://127.0.0.1:5432/sgl_airwallex_test_acceptance", DATABASE_SSL: "disable" },
    { SGL_MIGRATION_TARGET: "local-sandbox", DATABASE_URL: "postgresql://127.0.0.1:55433/commerce", DATABASE_SSL: "disable" },
    { SGL_MIGRATION_TARGET: "local-sandbox", DATABASE_URL: "postgresql://db.example.test:55433/sgl_airwallex_test_acceptance", DATABASE_SSL: "disable" },
    { SGL_MIGRATION_TARGET: "local-sandbox", DATABASE_URL: "postgresql://127.0.0.1:55433/sgl_airwallex_test_acceptance", DATABASE_SSL: "require" },
    { SGL_MIGRATION_TARGET: "production", DATABASE_URL: "postgresql://db.internal.example:6432/sgl_commerce", DATABASE_SSL: "disable", SGL_MIGRATION_EXPECTED_DATABASE: "sgl_commerce", SGL_MIGRATION_EXPECTED_HOST: "db.internal.example", SGL_MIGRATION_APPROVAL: "production:sgl_commerce" },
    { SGL_MIGRATION_TARGET: "production", DATABASE_URL: "postgresql://db.internal.example:6432/sgl_commerce", DATABASE_SSL: "verify-full", SGL_MIGRATION_EXPECTED_DATABASE: "other", SGL_MIGRATION_EXPECTED_HOST: "db.internal.example", SGL_MIGRATION_APPROVAL: "production:sgl_commerce" }
    ,{ SGL_MIGRATION_TARGET: "production", DATABASE_URL: "postgresql://migrator:secret@ep-safe-pooler.iad1.aws.neon.tech:5432/neondb?sslmode=verify-full", DATABASE_SSL: "verify-full", SGL_MIGRATION_EXPECTED_DATABASE: "neondb", SGL_MIGRATION_EXPECTED_HOST: "ep-safe-pooler.iad1.aws.neon.tech", SGL_MIGRATION_APPROVAL: "production:neondb", SGL_MIGRATION_TLS_PROXY: "neon" }
    ,{ SGL_MIGRATION_TARGET: "production", DATABASE_URL: "postgresql://migrator:secret@ep-safe.iad1.aws.neon.tech:5432/neondb?sslmode=require", DATABASE_SSL: "verify-full", SGL_MIGRATION_EXPECTED_DATABASE: "neondb", SGL_MIGRATION_EXPECTED_HOST: "ep-safe.iad1.aws.neon.tech", SGL_MIGRATION_APPROVAL: "production:neondb", SGL_MIGRATION_TLS_PROXY: "neon" }
  ]) assert.throws(() => assertSafeMigrationTarget(environment));
  assert.throws(
    () => assertSafeMigrationTarget({
      SGL_MIGRATION_TARGET: "local-sandbox",
      DATABASE_URL: "not a URL containing secret-password",
      DATABASE_SSL: "disable"
    }),
    (error: unknown) => error instanceof Error && error.message === "DATABASE_URL is not a valid PostgreSQL URL"
  );
});

test("migration runner verifies the live PostgreSQL identity before applying SQL", () => {
  const expected = { mode: "local-sandbox" as const, database: "sgl_airwallex_test_acceptance", port: 55433 };
  const identity = {
    database: expected.database,
    currentUser: "sandbox_owner",
    databaseOwner: "sandbox_owner",
    serverAddress: "127.0.0.1",
    serverPort: expected.port,
    versionNumber: 160004,
    inRecovery: false,
    sslActive: false
  };
  assert.doesNotThrow(() => assertLiveMigrationTarget(expected, identity));
  assert.doesNotThrow(() => assertLiveMigrationTarget(expected, {
    ...identity,
    serverAddress: "172.19.0.2/32",
    serverPort: 5432
  }));
  assert.throws(() => assertLiveMigrationTarget(expected, { ...identity, database: "production" }));
  assert.throws(() => assertLiveMigrationTarget(expected, { ...identity, databaseOwner: "other" }));
  assert.throws(() => assertLiveMigrationTarget(expected, { ...identity, serverAddress: "203.0.113.10" }));
  assert.throws(() => assertLiveMigrationTarget(expected, { ...identity, serverPort: 5432 }));
  assert.throws(() => assertLiveMigrationTarget(expected, { ...identity, versionNumber: 150000 }));
  assert.throws(() => assertLiveMigrationTarget(expected, { ...identity, inRecovery: true }));

  const production = { mode: "production" as const, database: "sgl_commerce", port: 6432, host: "db.internal.example", tlsProof: "server" as const };
  assert.doesNotThrow(() => assertLiveMigrationTarget(production, {
    ...identity,
    database: "sgl_commerce",
    serverAddress: "10.0.0.4",
    serverPort: 6432,
    sslActive: true
  }));
  assert.throws(() => assertLiveMigrationTarget(production, {
    ...identity,
    database: "sgl_commerce",
    serverAddress: "10.0.0.4",
    serverPort: 6432,
    sslActive: false
  }), /TLS/);
  assert.doesNotThrow(() => assertLiveMigrationTarget({ ...production, host: "ep-safe.iad1.aws.neon.tech", port: 5432, tlsProof: "neon-proxy" }, {
    ...identity,
    database: "sgl_commerce",
    serverAddress: "10.0.0.4",
    serverPort: 5432,
    sslActive: false
  }));
});

test("migration checksums are deterministic and detect source changes", () => {
  assert.equal(migrationChecksum("SELECT 1;"), migrationChecksum("SELECT 1;"));
  assert.notEqual(migrationChecksum("SELECT 1;"), migrationChecksum("SELECT 2;"));
  assert.match(migrationChecksum("SELECT 1;"), /^[0-9a-f]{64}$/);
});

test("migration files require deterministic contiguous ordering", async () => {
  const valid = await mkdtemp(path.join(os.tmpdir(), "sgl-migrations-valid-"));
  await writeFile(path.join(valid, "0002_second.sql"), "SELECT 2;");
  await writeFile(path.join(valid, "0001_first.sql"), "SELECT 1;");
  assert.deepEqual(await listMigrationFiles(valid), ["0001_first.sql", "0002_second.sql"]);

  const gap = await mkdtemp(path.join(os.tmpdir(), "sgl-migrations-gap-"));
  await writeFile(path.join(gap, "0001_first.sql"), "SELECT 1;");
  await writeFile(path.join(gap, "0003_third.sql"), "SELECT 3;");
  await assert.rejects(() => listMigrationFiles(gap), /expected 0002/);
});
