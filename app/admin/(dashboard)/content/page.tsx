import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import DraftGenerator from "@/components/admin/DraftGenerator";
import DraftWorkspace from "@/components/admin/DraftWorkspace";
import { listAdminProducts } from "@/lib/admin/catalog";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { hasPermission } from "@/lib/admin/permissions";
import { listContentDrafts } from "@/lib/content-drafts/repository";

export const dynamic = "force-dynamic";
export default async function ProductContentPage() {
  const session = await currentAdminWithPermission("content:read"); if (!session) return <PermissionDenied />;
  const [drafts, products] = await Promise.all([listContentDrafts("product_content"), listAdminProducts()]);
  const canWrite = hasPermission(session.role, "content:write"); const canApprove = hasPermission(session.role, "content:approve");
  return <AdminPage title="产品内容 Agent" eyebrow="双语商品内容 · SEO · 小红书 · Instagram · Campaign">
    {canWrite && <DraftGenerator module="product_content" products={JSON.parse(JSON.stringify(products.map((item) => ({ id: item.id, title: item.title, status: item.status }))))} />}
    <DraftWorkspace drafts={JSON.parse(JSON.stringify(drafts))} module="product_content" canWrite={canWrite} canApprove={canApprove} />
  </AdminPage>;
}
