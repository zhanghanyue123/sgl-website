import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

if (process.env.PAYPAL_RELIABILITY_MIGRATION_TARGET !== "preview") {
  throw new Error("PAYPAL_RELIABILITY_MIGRATION_TARGET=preview is required");
}

const value = process.env.PREVIEW_DATABASE_URL;
const expectedDatabase = process.env.PREVIEW_DATABASE_NAME;
if (!value || !expectedDatabase) throw new Error("PREVIEW_DATABASE_URL and PREVIEW_DATABASE_NAME are required");

const target = new URL(value);
const actualDatabase = decodeURIComponent(target.pathname.replace(/^\//, ""));
if (!target.hostname.endsWith(".neon.tech") || target.hostname.includes("-pooler.")) {
  throw new Error("A direct Neon Preview connection is required");
}
if (actualDatabase !== expectedDatabase || /(^|[-_])(prod|production)([-_]|$)/i.test(actualDatabase)) {
  throw new Error("Preview database identity check failed");
}
target.searchParams.set("sslmode", "verify-full");

const files = ["0001_paypal_production_ops.sql", "0002_paypal_payment_reliability.sql"];
const sources = new Map();
for (const file of files) {
  const source = await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8");
  sources.set(file,{source,checksum:createHash("sha256").update(source).digest("hex")});
}

const sql = postgres(target.href,{ssl:"verify-full",max:1,connect_timeout:10,prepare:false});
try {
  await sql.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended('sgl:paypal-preview-ops:migration',0))`;
    const schema=await tx`SELECT 1 FROM information_schema.schemata WHERE schema_name='paypal_ops'`;
    const base=sources.get(files[0]);
    if (!schema.length) {
      await tx.unsafe(base.source);
      await tx`INSERT INTO paypal_ops.schema_migrations(version,checksum) VALUES(${files[0]},${base.checksum})`;
    } else {
      const trackedBase=await tx`SELECT checksum FROM paypal_ops.schema_migrations WHERE version=${files[0]}`;
      if (trackedBase[0]?.checksum !== base.checksum) throw new Error("PayPal OPS 0001 checksum mismatch");
    }
    const reliability=sources.get(files[1]);
    const tracked=await tx`SELECT checksum FROM paypal_ops.schema_migrations WHERE version=${files[1]}`;
    if (tracked.length) {
      if (tracked[0].checksum !== reliability.checksum) throw new Error("PayPal reliability migration checksum mismatch");
      return;
    }
    await tx.unsafe(reliability.source);
    await tx`INSERT INTO paypal_ops.schema_migrations(version,checksum) VALUES(${files[1]},${reliability.checksum})`;
  });
  console.log(JSON.stringify({environment:"preview",database:actualDatabase,migration:files[1],status:"applied_or_verified"}));
} finally {
  await sql.end({timeout:2});
}
