import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { listAdminCustomers } from "@/lib/admin/orders";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);
}

export default async function CustomersPage() {
  if (!await currentAdminWithPermission("customers:read")) return <PermissionDenied />;
  const customers = await listAdminCustomers();
  return <AdminPage title="Customers" eyebrow={`${customers.length} customer records`}>
    <div className="overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["Customer", "Locale", "Orders", "Paid orders", "Lifetime value", "Latest order", "Created"].map((item) => <th key={item} className="p-3 uppercase">{item}</th>)}</tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-sglInk/20"><td className="p-3"><span className="font-black">{customer.display_name || "Customer"}</span><div className="text-xs opacity-60">{customer.email || customer.phone || "No contact"}</div></td><td className="p-3">{customer.locale}</td><td className="p-3">{customer.order_count}</td><td className="p-3">{customer.paid_order_count}</td><td className="p-3 font-black">{money(customer.lifetime_value_cents, customer.currency)}</td><td className="p-3">{customer.latest_order_at ? new Date(customer.latest_order_at).toLocaleDateString("en-CA") : "—"}</td><td className="p-3">{new Date(customer.created_at).toLocaleDateString("en-CA")}</td></tr>)}</tbody></table>{customers.length === 0 && <p className="p-8 text-center font-bold opacity-60">No customer records have been created.</p>}</div>
  </AdminPage>;
}
