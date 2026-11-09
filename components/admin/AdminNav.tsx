import Link from "next/link";
import type { AdminSession } from "@/lib/admin/auth";
import { type AdminPermission, hasPermission } from "@/lib/admin/permissions";
import LogoutButton from "./LogoutButton";

type NavItem = readonly [label: string, href: string, permission: AdminPermission];
type NavGroup = { label: string; items: readonly NavItem[] };

const groups: readonly NavGroup[] = [
  { label: "Overview", items: [["Business Overview", "/admin", "dashboard:read"]] },
  { label: "Commerce", items: [
    ["Products & SKU", "/admin/products", "products:read"],
    ["Website Inventory", "/admin/inventory", "inventory:read"],
    ["Orders", "/admin/orders", "orders:read"],
    ["Shipping", "/admin/shipping", "shipping:write"],
    ["Payments", "/admin/payments", "payments:read"],
  ] },
  { label: "Station Operations", items: [["Station Workspace", "/admin/station", "station:read"]] },
  { label: "Agent Operations", items: [
    ["Agent Overview", "/admin/agents", "agents:read"],
    ["Pending Approvals", "/admin/agent-actions", "agents:read"],
  ] },
  { label: "Customers & CRM", items: [["Customers", "/admin/customers", "customers:read"]] },
  { label: "System", items: [
    ["Settings", "/admin/settings", "settings:read"],
    ["Audit", "/admin/audit", "audit:read"],
  ] },
] as const;

export default function AdminNav({ session }: { session: AdminSession }) {
  return <aside className="border-b border-sglInk bg-sglInk text-sglCream lg:min-h-screen lg:border-b-0 lg:border-r">
    <div className="p-5 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
      <Link href="/admin" className="text-2xl font-black uppercase text-sglAcid">SGL Admin</Link>
      <p className="mt-2 text-xs uppercase tracking-wide opacity-65">{session.displayName} · {session.role}</p>
      <nav className="mt-6 space-y-5">
        {groups.map((group) => {
          const items = group.items.filter(([, , permission]) => hasPermission(session.role, permission));
          if (!items.length) return null;
          return <section key={group.label} aria-label={group.label}>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[.2em] text-sglAcid/75">{group.label}</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-black uppercase sm:grid-cols-3 lg:grid-cols-1">
              {items.map(([label, href]) => <Link key={href} href={href} className="border border-white/20 px-3 py-2 hover:border-sglAcid hover:text-sglAcid">{label}</Link>)}
            </div>
          </section>;
        })}
      </nav>
      <LogoutButton />
    </div>
  </aside>;
}
