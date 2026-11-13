import Link from "next/link";
import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { getAdminCustomer } from "@/lib/admin/orders";
import { hasPermission } from "@/lib/admin/permissions";
import { writeAudit } from "@/lib/admin/auth";

function money(cents: number, currency: string) { return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100); }

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await currentAdminWithPermission("customers:read");
  if (!session) return <PermissionDenied />;
  const { id } = await params;
  const includePii = hasPermission(session.role, "customers:pii");
  const result = await getAdminCustomer(id, includePii);
  if (!result) return <AdminPage title="Customer not found"><Link href="/admin/customers" className="underline">Back to customers</Link></AdminPage>;
  if (includePii) await writeAudit({ actorUserId: session.userId, action: "customer.pii.viewed", entityType: "customer", entityId: id, after: { fields: ["email", "phone"] } });
  const customer = result.customer as any;
  return <AdminPage title={customer.display_name || "Customer"} eyebrow={customer.id}>
    <Link href="/admin/customers" className="mb-5 inline-block font-bold underline">← Customers</Link>
    <dl className="grid gap-px border border-sglInk bg-sglInk md:grid-cols-2">{[
      ["Email", includePii ? customer.email || "Not recorded" : "Restricted"], ["Phone", includePii ? customer.phone || "Not recorded" : "Restricted"],
      ["Locale", customer.locale], ["Account", customer.account_registered ? "Active — email verified" : "Guest / CRM"],
      ["Registered", customer.email_verified_at ? new Date(customer.email_verified_at).toLocaleString("en-CA") : "No website account"],
      ["Last login", customer.last_login_at ? new Date(customer.last_login_at).toLocaleString("en-CA") : "Never"]
    ].map(([label,value]) => <div key={label} className="bg-white p-4"><dt className="text-xs font-black uppercase opacity-60">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl>
    <h2 className="mt-8 text-2xl font-black uppercase">Orders</h2>
    <div className="mt-3 overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["Order", "Status", "Payment", "Fulfillment", "Total", "Created"].map(label => <th key={label} className="p-3 uppercase">{label}</th>)}</tr></thead><tbody>{result.orders.map((order:any) => <tr key={order.id} className="border-t border-sglInk/20"><td className="p-3 font-black">{order.order_number}</td><td className="p-3">{order.order_status}</td><td className="p-3">{order.payment_status}</td><td className="p-3">{order.fulfillment_status}</td><td className="p-3">{money(order.total_cents,order.currency)}</td><td className="p-3">{new Date(order.created_at).toLocaleDateString("en-CA")}</td></tr>)}</tbody></table>{result.orders.length===0 && <p className="p-6 text-center font-bold opacity-60">No orders linked to this Customer ID.</p>}</div>
  </AdminPage>;
}
