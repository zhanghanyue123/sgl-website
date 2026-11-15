import { authorizePayPalOps, paypalOpsDb } from "@/lib/payments/paypal/ops";
import { errorResponse } from "@/lib/store/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    authorizePayPalOps(request);
    const sql = paypalOpsDb();
    const rows = await sql<{ scoped: boolean }[]>`SELECT
      current_user='sgl_paypal_ops_runtime'
      AND NOT has_table_privilege(current_user,'public.customers','select')
      AND NOT has_table_privilege(current_user,'public.inventory_levels','update')
      AND NOT has_table_privilege(current_user,'public.refunds','update')
      AND has_function_privilege(current_user,'paypal_ops.register_order(uuid,text,integer,text,text,text)','execute')
      AND has_function_privilege(current_user,'paypal_ops.capture_context(text)','execute')
      AND has_function_privilege(current_user,'paypal_ops.save_capture(text,text,text,integer,text,text)','execute')
      AND has_function_privilege(current_user,'paypal_ops.save_webhook(text,text,text,text,text,text,integer,text)','execute')
      AND has_function_privilege(current_user,'paypal_ops.save_capture_v2(text,text,text,integer,text,text,timestamptz,text)','execute')
      AND has_function_privilege(current_user,'paypal_ops.save_webhook_v2(text,text,text,text,text,text,text,text,integer,text,timestamptz)','execute') AS scoped`;
    if (!rows[0]?.scoped) return Response.json({ connected: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
    return Response.json({ connected: true, roleScoped: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
