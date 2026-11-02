import InventoryTable from "@/components/admin/InventoryTable";
import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { listInventory } from "@/lib/admin/catalog";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { hasPermission } from "@/lib/admin/permissions";

export default async function InventoryPage() {
  const session = await currentAdminWithPermission("inventory:read");
  if (!session) return <PermissionDenied />;
  const rows = await listInventory();
  return <AdminPage title="Inventory" eyebrow="Atomic adjustments · no negative stock"><InventoryTable rows={JSON.parse(JSON.stringify(rows))} canAdjust={hasPermission(session.role, "inventory:adjust")} /></AdminPage>;
}
