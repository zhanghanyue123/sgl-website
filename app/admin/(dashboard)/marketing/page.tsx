import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import DraftGenerator from "@/components/admin/DraftGenerator";
import DraftWorkspace from "@/components/admin/DraftWorkspace";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { hasPermission } from "@/lib/admin/permissions";
import { listContentDrafts } from "@/lib/content-drafts/repository";

export const dynamic = "force-dynamic";
export default async function MarketingPage() {
  const session = await currentAdminWithPermission("marketing:read"); if (!session) return <PermissionDenied />;
  const drafts = await listContentDrafts("marketing"); const canWrite = hasPermission(session.role, "marketing:write"); const canApprove = hasPermission(session.role, "marketing:approve");
  return <AdminPage title="Marketing Agent" eyebrow="周历 · 上新计划 · 推广建议 · 周报">
    {canWrite && <DraftGenerator module="marketing" />}
    <DraftWorkspace drafts={JSON.parse(JSON.stringify(drafts))} module="marketing" canWrite={canWrite} canApprove={canApprove} />
  </AdminPage>;
}
