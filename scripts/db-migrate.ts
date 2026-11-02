import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { closeDb, getDb } from "../lib/admin/db";

async function main() {
  const db = getDb();
  await db`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  const directory = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const applied = await db`SELECT version FROM schema_migrations WHERE version = ${file} LIMIT 1`;
    if (applied[0]) {
      console.log(`skip ${file}`);
      continue;
    }
    const source = await readFile(path.join(directory, file), "utf8");
    await db.begin(async (tx) => {
      await tx.unsafe(source);
      await tx`INSERT INTO schema_migrations (version) VALUES (${file}) ON CONFLICT (version) DO NOTHING`;
    });
    console.log(`applied ${file}`);
  }
}

main().then(closeDb).catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exitCode = 1;
});
