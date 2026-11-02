import Link from "next/link";
import { AdminPage, PermissionDenied, adminButton } from "@/components/admin/AdminPage";
import { listAdminProducts } from "@/lib/admin/catalog";
import { currentAdminWithPermission } from "@/lib/admin/current";

export default async function ProductsPage() {
  if (!await currentAdminWithPermission("products:read")) return <PermissionDenied />;
  const products = await listAdminProducts();
  return <AdminPage title="Products" eyebrow={`${products.length} catalogue records`} action={<Link href="/admin/products/new" className={adminButton}>New product</Link>}><div className="overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["Product", "Category", "Status", "Price", "Variants", "SKU gaps", "Available", "Updated"].map((item) => <th key={item} className="p-3 uppercase">{item}</th>)}</tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-t border-sglInk/20"><td className="p-3"><Link className="font-black underline" href={`/admin/products/${product.id}`}>{product.title}</Link><div className="text-xs opacity-55">/{product.slug}</div></td><td className="p-3">{product.category}</td><td className="p-3 uppercase">{product.status}</td><td className="p-3">{product.currency} {(product.base_price_cents / 100).toFixed(2)}</td><td className="p-3">{product.variant_count}</td><td className="p-3">{product.missing_sku_count}</td><td className="p-3">{product.available}</td><td className="p-3">{new Date(product.updated_at).toLocaleDateString("en-CA")}</td></tr>)}</tbody></table></div></AdminPage>;
}
