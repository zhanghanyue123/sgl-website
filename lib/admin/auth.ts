import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDb, toJson } from "./db";
import { type AdminPermission, type AdminRole, hasPermission, isAdminRole } from "./permissions";
import { createSessionToken, hashNetworkValue, hashPassword, hashToken, normalizeEmail, safeOrigin, verifyPassword } from "./security";

export const ADMIN_COOKIE = "sgl_admin_session";
const SESSION_HOURS = 12;
const dummyHash = hashPassword("InvalidAccountPassword123", "sgl-invalid-account-salt");

export type AdminSession = {
  sessionId: string;
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
  expiresAt: Date;
};

export class AdminAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function authenticateAdmin(emailInput: string, password: string, request: Request) {
  const db = getDb();
  const email = normalizeEmail(emailInput);
  const rows = await db<{
    id: string; email: string; display_name: string; password_hash: string; password_salt: string;
    role: string; active: boolean; failed_login_count: number; locked_until: Date | null;
  }[]>`SELECT id, email, display_name, password_hash, password_salt, role, active, failed_login_count, locked_until
      FROM admin_users WHERE lower(email) = ${email} LIMIT 1`;
  const user = rows[0];
  const fallback = await dummyHash;
  const valid = await verifyPassword(password, user?.password_salt || fallback.salt, user?.password_hash || fallback.hash);
  const now = new Date();

  if (!user || !user.active || (user.locked_until && user.locked_until > now) || !valid || !isAdminRole(user.role)) {
    if (user) {
      const failures = user.failed_login_count + 1;
      const lockedUntil = failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await db`UPDATE admin_users SET failed_login_count = ${failures}, locked_until = ${lockedUntil}, updated_at = now() WHERE id = ${user.id}`;
    }
    throw new AdminAuthError(401, "Invalid email or password");
  }

  const token = createSessionToken();
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  await db.begin(async (tx) => {
    await tx`UPDATE admin_users SET failed_login_count = 0, locked_until = NULL, last_login_at = now(), updated_at = now() WHERE id = ${user.id}`;
    await tx`INSERT INTO admin_sessions (id, user_id, token_hash, expires_at, ip_hash, user_agent)
      VALUES (${sessionId}, ${user.id}, ${hashToken(token)}, ${expiresAt}, ${hashNetworkValue(forwarded)}, ${userAgent})`;
    await tx`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, after_data, ip_hash)
      VALUES (${randomUUID()}, ${user.id}, 'admin.login', 'admin_session', ${sessionId}, ${tx.json({ role: user.role })}, ${hashNetworkValue(forwarded)})`;
  });
  return { token, expiresAt };
}

export async function getAdminSession(token?: string | null): Promise<AdminSession | null> {
  if (!token) return null;
  const db = getDb();
  const rows = await db<{
    session_id: string; user_id: string; email: string; display_name: string; role: string; expires_at: Date;
  }[]>`SELECT s.id AS session_id, u.id AS user_id, u.email, u.display_name, u.role, s.expires_at
      FROM admin_sessions s
      JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = ${hashToken(token)} AND s.revoked_at IS NULL AND s.expires_at > now() AND u.active = true
      LIMIT 1`;
  const row = rows[0];
  if (!row || !isAdminRole(row.role)) return null;
  return { sessionId: row.session_id, userId: row.user_id, email: row.email, displayName: row.display_name, role: row.role, expiresAt: new Date(row.expires_at) };
}

export async function requireAdmin(request: NextRequest, permission: AdminPermission, mutation = false) {
  if (mutation && !safeOrigin(request)) throw new AdminAuthError(403, "Invalid request origin");
  const session = await getAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!session) throw new AdminAuthError(401, "Authentication required");
  if (!hasPermission(session.role, permission)) throw new AdminAuthError(403, "Permission denied");
  return session;
}

export async function revokeAdminSession(token?: string | null) {
  if (!token) return;
  const db = getDb();
  await db`UPDATE admin_sessions SET revoked_at = now() WHERE token_hash = ${hashToken(token)} AND revoked_at IS NULL`;
}

export async function writeAudit(input: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  request?: Request;
  requestId?: string | null;
}) {
  const db = getDb();
  const forwarded = input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  await db`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, before_data, after_data, request_id, ip_hash)
    VALUES (${randomUUID()}, ${input.actorUserId}, ${input.action}, ${input.entityType}, ${input.entityId},
      ${input.before == null ? null : db.json(toJson(input.before))}, ${input.after == null ? null : db.json(toJson(input.after))},
      ${input.requestId || null}, ${hashNetworkValue(forwarded)})`;
}

export const adminCookieOptions = (expiresAt: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  expires: expiresAt
});
