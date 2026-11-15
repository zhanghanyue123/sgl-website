import { getDb } from "@/lib/admin/db";
import { verifyCheckoutStatusToken } from "@/lib/payments/airwallex/status-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Status token is required" }, { status: 400 });
  let identity: ReturnType<typeof verifyCheckoutStatusToken>;
  try {
    identity = verifyCheckoutStatusToken(token);
  } catch {
    return Response.json({ error: "Status is unavailable" }, { status: 503 });
  }
  if (!identity) return Response.json({ error: "Status was not found" }, { status: 404 });
  try {
    const rows = await getDb()<{
      order_status: string;
      order_payment_status: string;
      payment_status: string;
      provider_status: string | null;
      updated_at: Date;
    }[]>`SELECT o.order_status,o.payment_status AS order_payment_status,p.status AS payment_status,
        p.provider_status,p.updated_at
      FROM orders o JOIN payments p ON p.order_id=o.id
      WHERE o.id=${identity.orderId} AND p.id=${identity.paymentId}
        AND p.provider='airwallex' AND p.environment='sandbox' LIMIT 1`;
    const row = rows[0];
    if (!row) return Response.json({ error: "Status was not found" }, { status: 404 });
    return Response.json({
      orderStatus: row.order_status,
      paymentStatus: row.order_payment_status,
      providerPaymentStatus: row.payment_status,
      providerStatus: row.provider_status,
      updatedAt: new Date(row.updated_at).toISOString()
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return Response.json({ error: "Status is unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
