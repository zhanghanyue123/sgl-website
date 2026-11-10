import { notFound } from "next/navigation";
import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import AgentOperationsDashboard from "@/components/admin/AgentOperationsDashboard";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { getAgentOperations, type AgentId } from "@/lib/admin/agent-operations";

export const dynamic = "force-dynamic";
const agentIds = new Set<AgentId>(["retail", "hello", "fries", "seo"]);

export default async function AgentDetailPage({ params }: { params: Promise<{ agent: string }> }) {
  if (!await currentAdminWithPermission("agents:read")) return <PermissionDenied />;
  const { agent } = await params;
  if (!agentIds.has(agent as AgentId)) notFound();
  const data = await getAgentOperations();
  const snapshot = data.agents.find(item => item.id === agent);
  return <AdminPage title={snapshot?.name || "Agent"} eyebrow="Agent Operations · Read-only"><AgentOperationsDashboard data={data} focus={agent as AgentId} /></AdminPage>;
}
