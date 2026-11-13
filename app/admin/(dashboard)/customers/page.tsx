import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import Link from "next/link";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { listAdminCustomers } from "@/lib/admin/orders";
import { hasPermission } from "@/lib/admin/permissions";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const session = await currentAdminWithPermission("customers:read");
  if (!session) return <PermissionDenied />;
  const params = await searchParams;
  const includePii = hasPermission(session.role, "customers:pii");
  const customers = await listAdminCustomers({ query: params.q, status: params.status, includePii });
  return <AdminPage title="Customers" eyebrow={`${customers.length} customer records`}>
    <form className="mb-5 grid gap-3 border border-sglInk bg-white p-4 md:grid-cols-[1fr_220px_auto]">
      <input name="q" defaultValue={params.q || ""} aria-label="Search customers" placeholder={includePii ? "Search name or email" : "Search name"} className="border border-sglInk p-3" />
      <select name="status" defaultValue={params.status || "all"} aria-label="Account status" className="border border-sglInk p-3"><option value="all">All customers</option><option value="active">Active accounts</option><option value="guest">Guest / CRM</option></select>
      <button className="border border-sglInk bg-sglAcid px-5 py-3 font-black uppercase">Filter</button>
    </form>
    {!includePii && <p className="mb-4 border border-sglInk bg-white p-3 text-sm font-bold">Contact details are restricted for this role.</p>}
    <div className="overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["Customer", "Account", "Locale", "Orders", "Paid orders", "Lifetime value", "Last login", "Created"].map((item) => <th key={item} className="p-3 uppercase">{item}</th>)}</tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-sglInk/20"><td className="p-3"><Link href={`/admin/customers/${customer.id}`} className="font-black underline">{customer.display_name || "Customer"}</Link><div className="text-xs opacity-60">{includePii ? customer.email || customer.phone || "No contact" : "Contact restricted"}</div><div className="mt-1 font-mono text-[10px] opacity-45">{customer.id}</div></td><td className="p-3"><span className="font-black">{customer.account_registered ? "Active" : "Guest / CRM"}</span><div className="text-xs opacity-60">{customer.account_registered ? "Email verified" : "No website login"}</div></td><td className="p-3">{customer.locale}</td><td className="p-3">{customer.order_count}</td><td className="p-3">{customer.paid_order_count}</td><td className="p-3 font-black">{money(customer.lifetime_value_cents, customer.currency)}</td><td className="p-3">{customer.last_login_at ? new Date(customer.last_login_at).toLocaleString("en-CA") : "—"}</td><td className="p-3">{new Date(customer.created_at).toLocaleDateString("en-CA")}</td></tr>)}</tbody></table>{customers.length === 0 && <p className="p-8 text-center font-bold opacity-60">No matching customer records.</p>}</div>
  </AdminPage>;
}
