import Link from "next/link";
import { AdminPage, PermissionDenied, adminButton } from "@/components/admin/AdminPage";
import { adminDashboardCounts } from "@/lib/admin/catalog";
import { currentAdminWithPermission } from "@/lib/admin/current";

export default async function AdminDashboardPage() {
  if (!await currentAdminWithPermission("dashboard:read")) return <PermissionDenied />;
  const counts = await adminDashboardCounts();
  const cards = [["Products", counts.products], ["Published", counts.published], ["Pending orders", counts.pending_orders], ["Paid / unfulfilled", counts.paid_unfulfilled], ["Low stock", counts.low_stock], ["Missing SKUs", counts.missing_skus]];
  return <AdminPage title="Dashboard" eyebrow="Production operations" action={<Link href="/admin/products/new" className={adminButton}>New product</Link>}><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([label, value]) => <div key={label} className="border border-sglInk bg-white p-5 shadow-[5px_5px_0_#111]"><p className="text-xs font-black uppercase tracking-wider opacity-60">{label}</p><p className="mt-3 text-5xl font-black">{value}</p></div>)}</div><div className="mt-8 border border-sglInk bg-white p-6"><h2 className="text-xl font-black uppercase">Operations status</h2><p className="mt-3 max-w-3xl leading-7">Catalogue, localization, variants, inventory, orders and customer records are available here. Payment capture remains webhook-only, and fulfillment work begins after a verified paid order.</p></div></AdminPage>;
}
