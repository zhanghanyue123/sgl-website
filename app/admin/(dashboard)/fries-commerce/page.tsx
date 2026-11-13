import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { listCommerceToolActivity } from "@/lib/customer-service/commerce-tools";

export default async function FriesCommercePage() {
  const session = await currentAdminWithPermission("agents:read");
  if (!session) return <PermissionDenied />;
  const rows = await listCommerceToolActivity();
  return <AdminPage title="Fries commerce" eyebrow="Read-only shopping assistant activity">
    <div className="overflow-x-auto border border-sglInk bg-white">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-sglInk text-white"><tr>{["Time","Tool","Audience","Result","Entity"].map(item=><th key={item} className="p-3 uppercase">{item}</th>)}</tr></thead>
        <tbody>{rows.map((row:any)=><tr key={row.id} className="border-t border-sglInk/20"><td className="p-3">{new Date(row.created_at).toLocaleString("en-GB")}</td><td className="p-3 font-mono text-xs">{row.tool_name}</td><td className="p-3 uppercase">{row.audience}</td><td className="p-3 uppercase">{row.outcome}</td><td className="p-3 font-mono text-xs">{row.entity_type ? `${row.entity_type}: ${row.entity_id || "—"}` : "—"}</td></tr>)}</tbody>
      </table>
      {rows.length===0&&<p className="p-8 text-center font-bold opacity-60">No commerce queries have been recorded.</p>}
    </div>
  </AdminPage>;
}
