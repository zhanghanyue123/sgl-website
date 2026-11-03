import AgentActionReview from "@/components/admin/AgentActionReview";
import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { listAllAgentActions } from "@/lib/agent/service";

export default async function AgentActionsPage() {
  const session = await currentAdminWithPermission("agents:read"); if (!session) return <PermissionDenied />;
  const rows = await listAllAgentActions();
  const canApprove = Boolean(await currentAdminWithPermission("agents:approve"));
  return <AdminPage title="Agent actions" eyebrow="Proposals only · no automatic execution"><div className="space-y-4">{rows.length === 0 && <p className="border border-sglInk bg-white p-6">No agent proposals yet.</p>}{rows.map((row) => <article key={row.id} className="border border-sglInk bg-white p-5 shadow-[4px_4px_0_#111]"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider opacity-60">{row.client_name} · {new Date(row.requested_at).toLocaleString("en-GB")}</p><h2 className="mt-1 text-xl font-black uppercase">{row.action_type.replaceAll("_", " ")}</h2><p className="mt-1 font-mono text-xs">{row.target_type}: {row.target_id}</p></div><span className="border border-sglInk px-3 py-1 text-xs font-black uppercase">{row.status}</span></div><pre className="mt-4 overflow-x-auto bg-sglPaper p-3 text-xs">{JSON.stringify(row.payload, null, 2)}</pre>{row.review_note && <p className="mt-3 text-sm"><strong>Review:</strong> {row.review_note} {row.reviewer_email ? `· ${row.reviewer_email}` : ""}</p>}{row.status === "pending" && canApprove && <AgentActionReview id={row.id} />}</article>)}</div></AdminPage>;
}
