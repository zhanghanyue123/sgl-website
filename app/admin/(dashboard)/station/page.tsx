import { PermissionDenied } from "@/components/admin/AdminPage";
import StationOSWorkspace from "@/components/station-os/StationOSWorkspace";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { getStationAdminView } from "@/lib/integrations/station-admin";

export const dynamic = "force-dynamic";
const scope = { organizationId: "00000000-0000-4000-8000-000000000001", storeId: "00000000-0000-4000-8000-000000000004" };

export default async function StationAdminPage() {
  const session = await currentAdminWithPermission("station:read");
  if (!session) return <PermissionDenied />;
  const view = await getStationAdminView(scope);
  const data = view.data || { customers: [], tasks: [], operations: {} };
  return <StationOSWorkspace connected={view.connected} stale={view.stale} error={view.error} receivedAt={view.receivedAt} generatedAt={view.generatedAt}
    operations={data.operations || {}} customers={data.customers} tasks={data.tasks}
    commands={view.commands.map((row) => ({ ...row, created_at: new Date(row.created_at).toISOString(), delivered_at: row.delivered_at ? new Date(row.delivered_at).toISOString() : null, failed_at: row.failed_at ? new Date(row.failed_at).toISOString() : null }))}
    writable={false} operator={session.displayName} />;
}
