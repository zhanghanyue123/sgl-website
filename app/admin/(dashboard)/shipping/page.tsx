import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import ShippingQueue from "@/components/admin/ShippingQueue";
import ShipmentHistory from "@/components/admin/ShipmentHistory";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { listFulfillmentQueue, listShipments } from "@/lib/admin/fulfillment";

export default async function ShippingPage() {
  if (!await currentAdminWithPermission("shipping:write")) return <PermissionDenied />;
  const [queue, shipments] = await Promise.all([listFulfillmentQueue(), listShipments()]);
  return <AdminPage title="Shipping" eyebrow="Manual fulfillment">
    <ShippingQueue orders={queue} />
    <section className="mt-10"><h2 className="text-2xl font-black uppercase">Shipping history</h2><ShipmentHistory shipments={shipments} /></section>
  </AdminPage>;
}
