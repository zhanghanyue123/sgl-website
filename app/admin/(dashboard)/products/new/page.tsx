import ProductEditor from "@/components/admin/ProductEditor";
import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { listCategories } from "@/lib/admin/catalog";
import { currentAdminWithPermission } from "@/lib/admin/current";

export default async function NewProductPage() {
  if (!await currentAdminWithPermission("products:write")) return <PermissionDenied />;
  return <AdminPage title="New product" eyebrow="All five locales required"><ProductEditor categories={JSON.parse(JSON.stringify(await listCategories()))} /></AdminPage>;
}
