"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminButton, adminInput } from "./AdminPage";

export default function InventoryTable({ rows, canAdjust }: { rows: any[]; canAdjust: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  async function adjust(variantId: string) {
    setMessage("");
    const response = await fetch("/api/admin/inventory/adjust", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ variantId, deltaOnHand: Number(delta), reason }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Adjustment failed"); return; }
    setActive(null); setDelta(0); setReason(""); setMessage("Inventory adjusted and recorded."); router.refresh();
  }
  return <><p className="mb-3 min-h-5 text-sm font-bold" role="status">{message}</p><div className="overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["Product / variant", "SKU", "On hand", "Reserved", "Available", "Threshold", "State", "Action"].map((item) => <th key={item} className="p-3 uppercase">{item}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.variant_id} className="border-t border-sglInk/20"><td className="p-3"><span className="font-black">{row.product_title}</span><div className="text-xs opacity-60">{row.variant_title}</div></td><td className="p-3">{row.sku || <span className="opacity-50">Not assigned</span>}</td><td className="p-3">{row.on_hand}</td><td className="p-3">{row.reserved}</td><td className="p-3 font-black">{row.available}</td><td className="p-3">{row.low_stock_threshold}</td><td className="p-3 font-black uppercase">{row.available === 0 ? "Sold out" : row.low_stock ? "Low stock" : "Ready"}</td><td className="p-3">{canAdjust && <button className="font-black uppercase underline" onClick={() => setActive(active === row.variant_id ? null : row.variant_id)}>Adjust</button>}</td></tr>)}</tbody></table></div>{active && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><div className="w-full max-w-md border border-sglInk bg-[#efefec] p-6 shadow-[8px_8px_0_#111]"><h2 className="text-2xl font-black uppercase">Adjust inventory</h2><label className="mt-4 block text-sm font-bold">On-hand change<input className={adminInput} type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} /></label><label className="mt-3 block text-sm font-bold">Reason<textarea className={adminInput} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></label><div className="mt-5 flex gap-3"><button type="button" className={adminButton} onClick={() => adjust(active)}>Record</button><button type="button" className="px-4 font-black uppercase" onClick={() => setActive(null)}>Cancel</button></div></div></div>}</>;
}
