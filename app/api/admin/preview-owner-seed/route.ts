import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/admin/db";
import { hashPassword, normalizeEmail, verifyPassword } from "@/lib/admin/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") return false;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const expected = process.env.SGL_PREVIEW_BOOTSTRAP_TOKEN || "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const email = normalizeEmail(process.env.SGL_PREVIEW_OWNER_EMAIL || "");
  const password = process.env.SGL_PREVIEW_OWNER_PASSWORD || "";
  if (email !== "owner@theseagulllabs.com" || !password) {
    return NextResponse.json({ error: "Preview seed is not configured" }, { status: 503 });
  }

  const db = getDb();
  const database = await db<{ database_name: string }[]>`SELECT current_database() AS database_name`;
  const existing = await db<{
    id: string; role: string; active: boolean; locked_until: Date | null;
    password_hash: string; password_salt: string;
  }[]>`SELECT id, role, active, locked_until, password_hash, password_salt
      FROM admin_users WHERE lower(email) = ${email} LIMIT 1`;

  if (existing[0]) {
    const passwordValid = await verifyPassword(password, existing[0].password_salt, existing[0].password_hash);
    return NextResponse.json({
      environment: process.env.VERCEL_ENV,
      databaseName: database[0].database_name,
      created: false,
      role: existing[0].role,
      active: existing[0].active,
      locked: Boolean(existing[0].locked_until && existing[0].locked_until > new Date()),
      seedPasswordValid: passwordValid,
      passwordAlgorithm: "scrypt",
    });
  }

  const credentials = await hashPassword(password);
  await db.begin(async (tx) => {
    await tx`INSERT INTO admin_users (id, email, display_name, password_hash, password_salt, role)
      VALUES (${randomUUID()}, ${email}, 'SGL Preview Owner', ${credentials.hash}, ${credentials.salt}, 'owner')`;
    await tx`UPDATE admin_users SET active = false, updated_at = now()
      WHERE lower(email) = 'owner-preview@theseagulllabs.com'`;
    await tx`UPDATE admin_sessions SET revoked_at = now()
      WHERE user_id IN (SELECT id FROM admin_users WHERE lower(email) = 'owner-preview@theseagulllabs.com')
        AND revoked_at IS NULL`;
  });
  return NextResponse.json({
    environment: process.env.VERCEL_ENV,
    databaseName: database[0].database_name,
    created: true,
    role: "owner",
    active: true,
    locked: false,
    seedPasswordValid: true,
    passwordAlgorithm: "scrypt",
  }, { status: 201 });
}
