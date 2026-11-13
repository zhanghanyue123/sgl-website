import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/admin/db";
import { createSessionToken, hashPassword, hashToken, normalizeEmail, validatePassword, verifyPassword } from "@/lib/admin/security";
import { deliverVerificationEmail } from "./email";
import { cleanDisplayName, customerAuthRateKey, customerNetworkHash, requireCustomerOrigin } from "./security";
import { CustomerAuthError, type CustomerSession } from "./types";

export const CUSTOMER_COOKIE = "sgl_customer_session";
const SESSION_DAYS = 7;
const REGISTRATION_HOURS = 24;
const dummyHash = hashPassword("InvalidCustomerPassword123", "sgl-invalid-customer-salt");

function normalizedCustomerEmail(value: string) {
  const email = normalizeEmail(value);
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) throw new CustomerAuthError(400, "Enter a valid email address");
  return email;
}

async function consumeAuthLimit(request: Request, email: string, action: "register" | "login" | "verify", limit: number) {
  const rows = await getDb()<{ request_count: number }[]>`
    INSERT INTO customer_auth_rate_limits(key_hash,action,window_started_at,request_count)
    VALUES(${customerAuthRateKey(request, email)},${action},date_trunc('hour',now()),1)
    ON CONFLICT(key_hash,action,window_started_at) DO UPDATE
      SET request_count=customer_auth_rate_limits.request_count+1
    RETURNING request_count`;
  if ((rows[0]?.request_count || 1) > limit) throw new CustomerAuthError(429, "Too many attempts. Please try again later.");
}

export async function registerCustomer(input: { email: string; password: string; displayName?: unknown }, request: Request) {
  requireCustomerOrigin(request);
  const email = normalizedCustomerEmail(input.email);
  try { validatePassword(input.password); } catch (error) { throw new CustomerAuthError(400, error instanceof Error ? error.message : "Invalid password"); }
  await consumeAuthLimit(request, email, "register", 5);
  const displayName = cleanDisplayName(input.displayName);
  const { hash, salt } = await hashPassword(input.password);
  const pendingId = randomUUID();
  const verificationId = randomUUID();
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REGISTRATION_HOURS * 3600_000);
  const db = getDb();

  await db.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${email},0))`;
    const existingAccount = await tx<{ exists: boolean }[]>`
      SELECT EXISTS(SELECT 1 FROM customers c JOIN customer_credentials cc ON cc.customer_id=c.id WHERE lower(c.email)=${email}) AS exists`;
    if (existingAccount[0]?.exists) return;
    await tx`UPDATE customer_pending_registrations SET status='superseded',updated_at=now()
      WHERE lower(email)=${email} AND status='pending'`;
    await tx`INSERT INTO customer_pending_registrations(id,email,display_name,password_hash,password_salt,expires_at)
      VALUES(${pendingId},${email},${displayName},${hash},${salt},${expiresAt})`;
    await tx`INSERT INTO customer_registration_verifications(id,pending_registration_id,token_hash,expires_at)
      VALUES(${verificationId},${pendingId},${tokenHash},${expiresAt})`;
  });

  const accountExists = await db<{ exists: boolean }[]>`
    SELECT EXISTS(SELECT 1 FROM customers c JOIN customer_credentials cc ON cc.customer_id=c.id WHERE lower(c.email)=${email}) AS exists`;
  if (accountExists[0]?.exists) return { accepted: true, deliveryStatus: "suppressed" as const };

  const delivery = await deliverVerificationEmail({ email, token });
  await db`UPDATE customer_registration_verifications SET delivery_status=${delivery.status},delivery_error=${delivery.error}
    WHERE id=${verificationId}`;
  return { accepted: true, deliveryStatus: delivery.status };
}

export async function verifyCustomerEmail(token: string, request: Request) {
  requireCustomerOrigin(request);
  if (!token || token.length > 200) throw new CustomerAuthError(400, "Verification link is invalid or expired");
  await consumeAuthLimit(request, hashToken(token), "verify", 20);
  const db = getDb();
  return db.begin(async (tx) => {
    const rows = await tx<{ verification_id: string; pending_id: string; email: string; display_name: string | null; password_hash: string; password_salt: string }[]>`
      SELECT v.id AS verification_id,p.id AS pending_id,p.email,p.display_name,p.password_hash,p.password_salt
      FROM customer_registration_verifications v
      JOIN customer_pending_registrations p ON p.id=v.pending_registration_id
      WHERE v.token_hash=${hashToken(token)} AND v.used_at IS NULL AND v.expires_at>now()
        AND p.status='pending' AND p.expires_at>now()
      FOR UPDATE OF v,p`;
    const pending = rows[0];
    if (!pending) throw new CustomerAuthError(400, "Verification link is invalid or expired");
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${pending.email},0))`;
    const existing = await tx<{ id: string; has_credentials: boolean }[]>`
      SELECT c.id,EXISTS(SELECT 1 FROM customer_credentials cc WHERE cc.customer_id=c.id) AS has_credentials
      FROM customers c WHERE lower(c.email)=${pending.email} FOR UPDATE`;
    if (existing[0]?.has_credentials) {
      await tx`UPDATE customer_registration_verifications SET used_at=now() WHERE id=${pending.verification_id}`;
      await tx`UPDATE customer_pending_registrations SET status='superseded',updated_at=now() WHERE id=${pending.pending_id}`;
      return { verified: true, alreadyActive: true };
    }
    const customerId = existing[0]?.id || randomUUID();
    if (!existing[0]) {
      await tx`INSERT INTO customers(id,email,display_name,membership_status)
        VALUES(${customerId},${pending.email},${pending.display_name},'member')`;
    } else {
      await tx`UPDATE customers SET display_name=COALESCE(display_name,${pending.display_name}),
        membership_status=CASE WHEN membership_status='guest' THEN 'member' ELSE membership_status END,updated_at=now()
        WHERE id=${customerId}`;
    }
    await tx`INSERT INTO customer_credentials(customer_id,password_hash,password_salt,email_verified_at)
      VALUES(${customerId},${pending.password_hash},${pending.password_salt},now())`;
    await tx`UPDATE customer_registration_verifications SET used_at=now() WHERE id=${pending.verification_id}`;
    await tx`UPDATE customer_pending_registrations SET status='verified',verified_at=now(),updated_at=now() WHERE id=${pending.pending_id}`;
    await tx`INSERT INTO customer_account_events(id,customer_id,event_type,entity_type,entity_id)
      VALUES(${randomUUID()},${customerId},'account.email_verified','customer',${customerId})`;
    return { verified: true, alreadyActive: false };
  });
}

async function createSession(customerId: string, request: Request) {
  const token = createSessionToken();
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const db = getDb();
  await db.begin(async (tx) => {
    await tx`INSERT INTO customer_sessions(id,customer_id,token_hash,expires_at,user_agent,ip_hash)
      VALUES(${id},${customerId},${hashToken(token)},${expiresAt},${request.headers.get("user-agent")?.slice(0,500)||null},${customerNetworkHash(request)})`;
    await tx`UPDATE customer_credentials SET last_login_at=now(),failed_login_count=0,locked_until=NULL,updated_at=now() WHERE customer_id=${customerId}`;
    await tx`INSERT INTO customer_account_events(id,customer_id,event_type,entity_type,entity_id)
      VALUES(${randomUUID()},${customerId},'account.login','customer_session',${id})`;
  });
  return { token, expiresAt };
}

export async function loginCustomer(emailInput: string, password: string, request: Request) {
  requireCustomerOrigin(request);
  const email = normalizedCustomerEmail(emailInput);
  await consumeAuthLimit(request, email, "login", 10);
  const db = getDb();
  const rows = await db<{ customer_id:string;password_hash:string;password_salt:string;failed_login_count:number;locked_until:Date|null }[]>`
    SELECT cc.customer_id,cc.password_hash,cc.password_salt,cc.failed_login_count,cc.locked_until
    FROM customer_credentials cc JOIN customers c ON c.id=cc.customer_id
    WHERE lower(c.email)=${email} AND cc.email_verified_at IS NOT NULL LIMIT 1`;
  const row = rows[0];
  const fallback = await dummyHash;
  const valid = await verifyPassword(password, row?.password_salt || fallback.salt, row?.password_hash || fallback.hash);
  if (!row || !valid || (row.locked_until && row.locked_until > new Date())) {
    if (row) await db`UPDATE customer_credentials SET failed_login_count=failed_login_count+1,
      locked_until=CASE WHEN failed_login_count+1>=5 THEN now()+interval '15 minutes' ELSE locked_until END,updated_at=now()
      WHERE customer_id=${row.customer_id}`;
    throw new CustomerAuthError(401, "Invalid email or password");
  }
  return createSession(row.customer_id, request);
}

export async function getCustomerSession(token?: string | null): Promise<CustomerSession | null> {
  if (!token) return null;
  const rows = await getDb()<Array<{session_id:string;customer_id:string;email:string;display_name:string|null;expires_at:Date}>>`
    SELECT s.id AS session_id,s.customer_id,c.email,c.display_name,s.expires_at
    FROM customer_sessions s JOIN customers c ON c.id=s.customer_id
    JOIN customer_credentials cc ON cc.customer_id=c.id
    WHERE s.token_hash=${hashToken(token)} AND s.revoked_at IS NULL AND s.expires_at>now()
      AND cc.email_verified_at IS NOT NULL LIMIT 1`;
  const row = rows[0];
  return row ? { sessionId:row.session_id,customerId:row.customer_id,email:row.email,displayName:row.display_name,expiresAt:new Date(row.expires_at) } : null;
}

export async function requireCustomer(request: NextRequest) {
  const session = await getCustomerSession(request.cookies.get(CUSTOMER_COOKIE)?.value);
  if (!session) throw new CustomerAuthError(401, "Authentication required");
  return session;
}

export async function revokeCustomerSession(token?: string | null) {
  if (!token) return;
  await getDb()`UPDATE customer_sessions SET revoked_at=now() WHERE token_hash=${hashToken(token)} AND revoked_at IS NULL`;
}

export const customerCookieOptions = (expiresAt: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  expires: expiresAt,
  priority: "high" as const
});
