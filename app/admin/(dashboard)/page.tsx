import Link from "next/link";
import { AdminPage, PermissionDenied, adminButton } from "@/components/admin/AdminPage";
import { adminDashboardCounts } from "@/lib/admin/catalog";
import { currentAdminWithPermission } from "@/lib/admin/current";

export default async function AdminDashboardPage() {
  if (!await currentAdminWithPermission("dashboard:read")) return <PermissionDenied />;
  const counts = await adminDashboardCounts();
  const cards = [["Products", counts.products], ["Published", counts.published], ["Missing SKUs", counts.missing_skus], ["Low stock", counts.low_stock], ["Admin users", counts.users]];
  return <AdminPage title="Dashboard" eyebrow="Production operations" action={<Link href="/admin/products/new" className={adminButton}>New product</Link>}><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value]) => <div key={label} className="border border-sglInk bg-white p-5 shadow-[5px_5px_0_#111]"><p className="text-xs font-black uppercase tracking-wider opacity-60">{label}</p><p className="mt-3 text-5xl font-black">{value}</p></div>)}</div><div className="mt-8 border border-sglInk bg-white p-6"><h2 className="text-xl font-black uppercase">Phase 2 scope</h2><p className="mt-3 max-w-3xl leading-7">Catalogue, localization, variants, SKU data, inventory and audited staff actions are available here. Orders, shipping, customers and payments are staged for later phases.</p></div></AdminPage>;
}
