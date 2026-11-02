import { randomUUID } from "node:crypto";
import { closeDb, getDb } from "../lib/admin/db";
import { adminRoles, isAdminRole } from "../lib/admin/permissions";
import { hashPassword, normalizeEmail } from "../lib/admin/security";

async function main() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL || "");
  const password = process.env.ADMIN_PASSWORD || "";
  const displayName = (process.env.ADMIN_NAME || "SGL Admin").trim();
  const role = process.env.ADMIN_ROLE || "owner";
  if (!email || !email.includes("@")) throw new Error("Set ADMIN_EMAIL to a valid address");
  if (!isAdminRole(role)) throw new Error(`ADMIN_ROLE must be one of: ${adminRoles.join(", ")}`);
  const credentials = await hashPassword(password);
  const db = getDb();
  const existing = await db`SELECT id FROM admin_users WHERE lower(email) = ${email} LIMIT 1`;
  if (existing[0]) throw new Error("An administrator with this email already exists");
  const id = randomUUID();
  await db`INSERT INTO admin_users (id, email, display_name, password_hash, password_salt, role)
    VALUES (${id}, ${email}, ${displayName}, ${credentials.hash}, ${credentials.salt}, ${role})`;
  console.log(`Created ${role} administrator ${email}`);
}

main().then(closeDb).catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exitCode = 1;
});
