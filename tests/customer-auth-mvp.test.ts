import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { customerRequestOriginAllowed, cleanDisplayName } from "../lib/customer-auth/security";
import { hasPermission } from "../lib/admin/permissions";

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("customer mutations accept only the configured global or current Preview origin", () => {
  const previousSite = process.env.SITE_URL; const previousPreview = process.env.VERCEL_URL;
  process.env.SITE_URL = "https://www.theseagulllabs.com"; process.env.VERCEL_URL = "membership-preview.example";
  assert.equal(customerRequestOriginAllowed(new Request("https://www.theseagulllabs.com/api/customer/register", { headers: { origin: "https://www.theseagulllabs.com" } })), true);
  assert.equal(customerRequestOriginAllowed(new Request("https://membership-preview.example/api/customer/register", { headers: { origin: "https://membership-preview.example" } })), true);
  assert.equal(customerRequestOriginAllowed(new Request("https://www.theseagulllabs.com/api/customer/register", { headers: { origin: "https://evil.example" } })), false);
  if (previousSite === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = previousSite;
  if (previousPreview === undefined) delete process.env.VERCEL_URL; else process.env.VERCEL_URL = previousPreview;
});

test("customer names strip controls and remain bounded", () => {
  assert.equal(cleanDisplayName(" A\u0000B "), "AB");
  assert.equal(cleanDisplayName(""), null);
  assert.throws(() => cleanDisplayName("x".repeat(121)));
});

test("pending registration has no customer ownership or session relationship", async () => {
  const migration = await source("db/migrations/0014_customer_auth_mvp.sql");
  const auth = await source("lib/customer-auth/auth.ts");
  const route = await source("app/api/customer/register/route.ts");
  assert.match(migration, /CREATE TABLE customer_pending_registrations/);
  assert.doesNotMatch(migration.match(/CREATE TABLE customer_pending_registrations[\s\S]*?;\n/)?.[0] || "", /customer_id/);
  assert.match(auth, /status='pending'[\s\S]*FOR UPDATE OF v,p/);
  assert.match(auth, /pg_advisory_xact_lock/);
  assert.match(auth, /JOIN customer_credentials cc ON cc\.customer_id=c\.id/);
  assert.doesNotMatch(route, /cookies\.set|CUSTOMER_COOKIE/);
});

test("customer identity is linked only inside verified token transaction", async () => {
  const auth = await source("lib/customer-auth/auth.ts");
  const verificationStart = auth.indexOf("export async function verifyCustomerEmail");
  const loginStart = auth.indexOf("export async function loginCustomer");
  const verification = auth.slice(verificationStart, loginStart);
  assert.match(verification, /token_hash=\$\{hashToken\(token\)\}/);
  assert.match(verification, /INSERT INTO customers/);
  assert.match(verification, /INSERT INTO customer_credentials/);
  assert.match(verification, /UPDATE customer_email_verifications SET used_at=now\(\)/);
  const registration = auth.slice(auth.indexOf("export async function registerCustomer"), verificationStart);
  assert.doesNotMatch(registration, /INSERT INTO customers/);
  assert.doesNotMatch(registration, /\bcreateSession\(/);
});

test("only verified credentials can create or restore a session", async () => {
  const auth = await source("lib/customer-auth/auth.ts");
  assert.match(auth, /WHERE lower\(c\.email\)=\$\{email\} AND cc\.email_verified_at IS NOT NULL/);
  assert.match(auth, /cc\.email_verified_at IS NOT NULL LIMIT 1/);
  assert.match(auth, /revoked_at=now\(\)/);
  assert.match(auth, /sameSite: "strict"/);
  assert.match(auth, /httpOnly: true/);
});

test("migration enforces normalized uniqueness and hashed session tokens", async () => {
  const migration = await source("db/migrations/0014_customer_auth_mvp.sql");
  assert.match(migration, /UNIQUE INDEX customer_pending_registrations_email_unique/);
  assert.match(migration, /token_hash text NOT NULL UNIQUE/);
  assert.match(migration, /customer_id uuid PRIMARY KEY REFERENCES customers/);
  assert.match(migration, /email_verified_at timestamptz NOT NULL/);
  assert.doesNotMatch(migration, /CREATE TABLE customers/);
});

test("Viewer customer access excludes PII while Owner and Admin may be authorized", () => {
  assert.equal(hasPermission("owner", "customers:pii"), true);
  assert.equal(hasPermission("admin", "customers:pii"), true);
  assert.equal(hasPermission("viewer", "customers:pii"), false);
  assert.equal(hasPermission("support", "customers:pii"), false);
});

test("admin customer queries preserve order ownership and gate contact fields", async () => {
  const repository = await source("lib/admin/orders.ts");
  const detail = await source("app/admin/(dashboard)/customers/[id]/page.tsx");
  assert.match(repository, /CASE WHEN \$\{includePii\} THEN c\.email ELSE NULL END/);
  assert.match(repository, /FROM orders WHERE customer_id=\$\{id\}/);
  assert.match(detail, /customer\.pii\.viewed/);
});

test("guest checkout remains available and customer auth does not modify checkout", async () => {
  const checkout = await source("app/api/checkout/route.ts");
  const auth = await source("lib/customer-auth/auth.ts");
  assert.match(checkout, /export async function POST/);
  assert.doesNotMatch(checkout, /requireCustomer|CUSTOMER_COOKIE/);
  assert.doesNotMatch(auth, /UPDATE orders|INSERT INTO orders|Airwallex|Stripe/i);
});

test("verification delivery is server-only and never returns the token", async () => {
  const email = await source("lib/customer-auth/email.ts");
  const route = await source("app/api/customer/register/route.ts");
  assert.match(email, /CUSTOMER_EMAIL_DELIVERY_TOKEN/);
  assert.doesNotMatch(email, /NEXT_PUBLIC/);
  assert.doesNotMatch(route, /token/);
  assert.doesNotMatch(route, /deliveryStatus|suppressed|accountExists/);
});

test("Preview migration helper is explicit, direct-Neon-only and contains no credential", async () => {
  const helper = await source("scripts/customer-auth-preview-migrate.ts");
  assert.match(helper, /SGL_PREVIEW_MIGRATION_APPROVAL/);
  assert.match(helper, /DATABASE_URL_UNPOOLED/);
  assert.match(helper, /hostname\.endsWith\("\.neon\.tech"\)/);
  assert.match(helper, /hostname\.includes\("-pooler\."\)/);
  assert.doesNotMatch(helper, /postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/);
});
