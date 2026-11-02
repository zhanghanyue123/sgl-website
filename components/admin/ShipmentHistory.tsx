"use client";

import { useState } from "react";
import type { FulfillmentShipment } from "@/lib/admin/fulfillment";
import { adminButton } from "./AdminPage";

export default function ShipmentHistory({ shipments }: { shipments: FulfillmentShipment[] }) {
  const [message, setMessage] = useState("");
  async function update(shipmentId: string, status: "delivered" | "cancelled") {
    setMessage("Updating shipment…");
    const response = await fetch("/api/admin/shipping", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shipmentId, status }) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error || "Shipment could not be updated.");
    window.location.reload();
  }
  return <><p className="mt-3 min-h-5 text-sm font-bold" role="status">{message}</p><div className="mt-4 overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["Order", "Carrier", "Tracking", "Status", "Dispatched", "Staff", "Action"].map(item => <th key={item} className="p-3 uppercase">{item}</th>)}</tr></thead><tbody>{shipments.map(shipment => <tr key={shipment.id} className="border-t border-sglInk/20"><td className="p-3 font-black">{shipment.order_number}</td><td className="p-3">{shipment.carrier}</td><td className="p-3">{shipment.tracking_url ? <a className="underline" href={shipment.tracking_url} target="_blank" rel="noreferrer">{shipment.tracking_number}</a> : shipment.tracking_number}</td><td className="p-3 uppercase">{shipment.status}</td><td className="p-3">{shipment.dispatched_at ? new Date(shipment.dispatched_at).toLocaleString("en-CA") : "—"}</td><td className="p-3">{shipment.actor_email}</td><td className="p-3">{shipment.status === "shipped" && <div className="flex gap-2"><button className={adminButton} onClick={() => update(shipment.id, "delivered")}>Delivered</button><button className="px-3 font-black uppercase underline" onClick={() => update(shipment.id, "cancelled")}>Cancel parcel</button></div>}</td></tr>)}</tbody></table></div></>;
}
