import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/admin/db";
import { hashPassword, normalizeEmail } from "@/lib/admin/security";

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
  if (!email || !password) return NextResponse.json({ error: "Preview seed is not configured" }, { status: 503 });

  const db = getDb();
  const existing = await db<{ id: string; role: string; active: boolean }[]>`
    SELECT id, role, active FROM admin_users WHERE lower(email) = ${email} LIMIT 1
  `;
  if (existing[0]) {
    return NextResponse.json({ created: false, role: existing[0].role, active: existing[0].active });
  }

  const credentials = await hashPassword(password);
  await db`INSERT INTO admin_users (id, email, display_name, password_hash, password_salt, role)
    VALUES (${randomUUID()}, ${email}, 'SGL Preview Owner', ${credentials.hash}, ${credentials.salt}, 'owner')`;
  return NextResponse.json({ created: true, role: "owner", active: true }, { status: 201 });
}
