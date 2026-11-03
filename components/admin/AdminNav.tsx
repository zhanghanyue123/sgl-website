import Link from "next/link";
import type { AdminSession } from "@/lib/admin/auth";
import { type AdminPermission, hasPermission } from "@/lib/admin/permissions";
import LogoutButton from "./LogoutButton";

const links: readonly [string, string, AdminPermission][] = [
  ["Dashboard", "/admin", "dashboard:read"], ["Products", "/admin/products", "products:read"], ["Inventory", "/admin/inventory", "inventory:read"],
  ["Orders", "/admin/orders", "orders:read"], ["Shipping", "/admin/shipping", "shipping:write"], ["Customers", "/admin/customers", "customers:read"],
  ["Payments", "/admin/payments", "payments:read"], ["Agent actions", "/admin/agent-actions", "agents:read"],
  ["Settings", "/admin/settings", "settings:read"], ["Audit", "/admin/audit", "audit:read"]
] as const;

export default function AdminNav({ session }: { session: AdminSession }) {
  return <aside className="border-b border-sglInk bg-sglInk text-sglCream lg:min-h-screen lg:border-b-0 lg:border-r">
    <div className="p-5 lg:sticky lg:top-0"><Link href="/admin" className="text-2xl font-black uppercase text-sglAcid">SGL Admin</Link><p className="mt-2 text-xs uppercase tracking-wide opacity-65">{session.displayName} · {session.role}</p>
      <nav className="mt-6 grid grid-cols-2 gap-2 text-sm font-black uppercase sm:grid-cols-3 lg:grid-cols-1">{links.filter(([, , permission]) => hasPermission(session.role, permission)).map(([label, href]) => <Link key={href} href={href} className="border border-white/20 px-3 py-2 hover:border-sglAcid hover:text-sglAcid">{label}</Link>)}</nav>
      <LogoutButton />
    </div>
  </aside>;
}
