import Link from "next/link";
import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { listAdminOrders } from "@/lib/admin/orders";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);
}

export default async function OrdersPage() {
  if (!await currentAdminWithPermission("orders:read")) return <PermissionDenied />;
  const orders = await listAdminOrders();
  return <AdminPage title="Orders" eyebrow={`${orders.length} recent records`}>
    <div className="overflow-x-auto border border-sglInk bg-white">
      <table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="bg-sglInk text-white"><tr>{["Order", "Customer", "Items", "Total", "Order", "Payment", "Fulfillment", "Created"].map((item) => <th key={item} className="p-3 uppercase">{item}</th>)}</tr></thead>
        <tbody>{orders.map((order) => <tr key={order.id} className="border-t border-sglInk/20">
          <td className="p-3"><Link className="font-black underline" href={`/admin/orders/${order.id}`}>{order.order_number}</Link></td>
          <td className="p-3"><span className="font-bold">{order.customer_name || "Guest"}</span><div className="text-xs opacity-60">{order.customer_email || "Contact pending"}</div></td>
          <td className="p-3">{order.item_count}</td>
          <td className="p-3 font-black">{money(order.total_cents, order.currency)}</td>
          <td className="p-3 uppercase">{order.order_status.replaceAll("_", " ")}</td>
          <td className="p-3 uppercase">{order.payment_status.replaceAll("_", " ")}</td>
          <td className="p-3 uppercase">{order.fulfillment_status.replaceAll("_", " ")}</td>
          <td className="p-3">{new Date(order.created_at).toLocaleString("en-CA")}</td>
        </tr>)}</tbody>
      </table>
      {orders.length === 0 && <p className="p-8 text-center font-bold opacity-60">No orders have been created.</p>}
    </div>
  </AdminPage>;
}
