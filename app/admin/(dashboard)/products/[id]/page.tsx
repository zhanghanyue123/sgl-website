import { notFound } from "next/navigation";
import ProductEditor from "@/components/admin/ProductEditor";
import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { getAdminProduct, listCategories } from "@/lib/admin/catalog";
import { currentAdminWithPermission } from "@/lib/admin/current";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await currentAdminWithPermission("products:read")) return <PermissionDenied />;
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProduct(id), listCategories()]);
  if (!product) notFound();
  return <AdminPage title="Edit product" eyebrow={`Immutable slug · ${String((product as Record<string, unknown>).slug)}`}><ProductEditor product={JSON.parse(JSON.stringify(product))} categories={JSON.parse(JSON.stringify(categories))} /></AdminPage>;
}
