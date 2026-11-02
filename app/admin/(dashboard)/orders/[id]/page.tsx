import { notFound } from "next/navigation";
import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { getAdminOrder } from "@/lib/admin/orders";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await currentAdminWithPermission("orders:read")) return <PermissionDenied />;
  const { id } = await params;
  const result = await getAdminOrder(id);
  if (!result) notFound();
  const { order, items, addresses, events } = result;
  const cards = [
    ["Order", order.order_status],
    ["Payment", order.payment_status],
    ["Fulfillment", order.fulfillment_status],
    ["Total", money(order.total_cents, order.currency)]
  ];
  return <AdminPage title={order.order_number} eyebrow={`Created ${new Date(order.created_at).toLocaleString("en-CA")}`}>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="border border-sglInk bg-white p-5"><p className="text-xs font-black uppercase opacity-60">{label}</p><p className="mt-2 text-2xl font-black uppercase">{String(value).replaceAll("_", " ")}</p></div>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
      <section className="border border-sglInk bg-white p-5"><h2 className="text-xl font-black uppercase">Items</h2><div className="mt-4 divide-y divide-sglInk/15">{items.map((item) => <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]"><div><p className="font-black">{item.product_title}</p><p className="text-sm opacity-60">{item.variant_title}{item.sku ? ` · ${item.sku}` : ""}</p></div><p className="font-black">{item.quantity} × {money(item.unit_price_cents, item.currency)} = {money(item.line_total_cents, item.currency)}</p></div>)}</div></section>
      <section className="border border-sglInk bg-white p-5"><h2 className="text-xl font-black uppercase">Customer</h2><p className="mt-4 font-black">{order.customer_name || order.customer_display_name || "Guest checkout"}</p><p className="mt-1 text-sm">{order.customer_email || "Contact not captured"}</p>{addresses.map((address) => <address key={address.id} className="mt-5 border-t border-sglInk/15 pt-4 text-sm not-italic"><p className="mb-1 font-black uppercase">{address.address_type}</p><p>{address.recipient_name}</p><p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p><p>{[address.city, address.region, address.postal_code].filter(Boolean).join(", ")}</p><p>{address.country_code}</p></address>)}</section>
    </div>
    <section className="mt-6 border border-sglInk bg-white p-5"><h2 className="text-xl font-black uppercase">Order timeline</h2><div className="mt-4 divide-y divide-sglInk/15">{events.map((event) => <div key={event.id} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto]"><div><p className="font-black">{event.event_type}</p><p className="text-xs uppercase opacity-60">{event.actor_type}{event.actor_email ? ` · ${event.actor_email}` : ""}</p></div><time className="text-sm">{new Date(event.created_at).toLocaleString("en-CA")}</time></div>)}</div></section>
  </AdminPage>;
}
