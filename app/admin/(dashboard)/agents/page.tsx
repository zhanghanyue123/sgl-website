import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import AgentOperationsDashboard from "@/components/admin/AgentOperationsDashboard";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { getAgentOperations } from "@/lib/admin/agent-operations";

export const dynamic = "force-dynamic";

export default async function AgentOperationsPage() {
  if (!await currentAdminWithPermission("agents:read")) return <PermissionDenied />;
  const data = await getAgentOperations();
  return <AdminPage title="Agent Operations" eyebrow="Retail · Hello · Fries · Read-only"><AgentOperationsDashboard data={data} /></AdminPage>;
}
