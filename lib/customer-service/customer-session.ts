import type { NextRequest } from "next/server";
import { getDb } from "@/lib/admin/db";
import { hashToken } from "@/lib/admin/security";

export const CUSTOMER_COOKIE = "sgl_customer_session";

export type CommerceCustomerSession = {
  sessionId: string;
  customerId: string;
  emailVerified: boolean;
};

export async function readCommerceCustomerSession(request: NextRequest): Promise<CommerceCustomerSession | null> {
  const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const rows = await getDb()<Array<{ session_id: string; customer_id: string; email_verified: boolean }>>`
    SELECT s.id AS session_id, s.customer_id, (c.email_verified_at IS NOT NULL) AS email_verified
    FROM customer_sessions s
    JOIN customer_credentials c ON c.customer_id = s.customer_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
    LIMIT 1`;
  const row = rows[0];
  return row ? { sessionId: row.session_id, customerId: row.customer_id, emailVerified: row.email_verified } : null;
}
