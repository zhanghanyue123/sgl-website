import InventoryTable from "@/components/admin/InventoryTable";
import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { getInventoryWorkspace } from "@/lib/admin/catalog";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { hasPermission } from "@/lib/admin/permissions";

export default async function InventoryPage() {
  const session = await currentAdminWithPermission("inventory:read");
  if (!session) return <PermissionDenied />;
  const workspace = await getInventoryWorkspace();
  return <AdminPage title="Catalogue & Inventory" eyebrow="Website catalogue · recorded stock only"><InventoryTable workspace={JSON.parse(JSON.stringify(workspace))} canAdjust={hasPermission(session.role, "inventory:adjust")} /></AdminPage>;
}
