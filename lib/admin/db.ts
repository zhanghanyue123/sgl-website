import postgres, { type JSONValue, type Sql } from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sglAdminDb: Sql | undefined;
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Sql {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!globalThis.__sglAdminDb) {
    globalThis.__sglAdminDb = postgres(process.env.DATABASE_URL, {
      max: Number(process.env.DATABASE_POOL_SIZE || 5),
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
      prepare: false
    });
  }
  return globalThis.__sglAdminDb;
}

export async function closeDb() {
  if (globalThis.__sglAdminDb) {
    await globalThis.__sglAdminDb.end({ timeout: 5 });
    globalThis.__sglAdminDb = undefined;
  }
}

export function toJson(value: unknown): JSONValue {
  return JSON.parse(JSON.stringify(value)) as JSONValue;
}
