"use client";

import { useState } from "react";
import type { FulfillmentQueueOrder } from "@/lib/admin/fulfillment";
import { adminButton, adminInput } from "./AdminPage";

export default function ShippingQueue({ orders }: { orders: FulfillmentQueueOrder[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(orderId: string) {
    setMessage("Saving shipment…");
    const response = await fetch("/api/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, carrier, trackingNumber, trackingUrl, addressConfirmed: confirmed })
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error || "Shipment could not be saved.");
    setMessage("Shipment recorded. Notification is queued until a provider accepts it.");
    window.location.reload();
  }

  return <><p className="mb-3 min-h-5 text-sm font-bold" role="status">{message}</p><div className="grid gap-4">{orders.map((order) => <article key={order.id} className="border border-sglInk bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-black">{order.order_number}</h2><p className="mt-1">{order.customer_name || order.recipient_name || "Customer"} · {order.customer_email || "Email missing"}</p><address className="mt-3 text-sm not-italic opacity-75">{order.recipient_name}<br />{order.line1}{order.line2 ? `, ${order.line2}` : ""}<br />{[order.city, order.region, order.postal_code].filter(Boolean).join(", ")} {order.country_code}</address></div><button className={adminButton} onClick={() => setActive(active === order.id ? null : order.id)}>Prepare shipment</button></div>{active === order.id && <div className="mt-5 grid gap-3 border-t border-sglInk/20 pt-5 md:grid-cols-3"><label className="text-sm font-bold">Carrier<input className={adminInput} value={carrier} onChange={(event) => setCarrier(event.target.value)} /></label><label className="text-sm font-bold">Tracking number<input className={adminInput} value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} /></label><label className="text-sm font-bold">Tracking URL (optional)<input className={adminInput} type="url" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} /></label><label className="flex items-center gap-2 text-sm font-bold md:col-span-2"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> I confirmed the customer and shipping address</label><button className={adminButton} disabled={!confirmed || !carrier.trim() || !trackingNumber.trim()} onClick={() => submit(order.id)}>Mark shipped</button></div>}</article>)}</div>{orders.length === 0 && <p className="border border-sglInk bg-white p-8 text-center font-bold opacity-60">No paid orders are waiting for shipment.</p>}</>;
}
