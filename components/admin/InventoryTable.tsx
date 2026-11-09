"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminButton, adminInput } from "./AdminPage";

type InventoryRow = {
  row_id: string; variant_id: string | null; product_title: string; variant_title: string; sku: string | null;
  image_url: string | null; price_cents: number; currency: string; warehouse_id: string | null; warehouse_name: string | null;
  on_hand: number | null; reserved: number | null; available: number | null; updated_at: string | null; low_stock: boolean | null;
  inventory_status: "recorded" | "not_recorded";
};

type InventoryMovement = {
  id: string; product_title: string; variant_title: string; sku: string | null; warehouse_name: string | null;
  movement_type: string; delta_on_hand: number; on_hand_after: number; reason: string; actor_email: string | null; created_at: string;
};

type Workspace = {
  inventory: InventoryRow[];
  movements: InventoryMovement[];
  summary: {
    catalogue_products: number; catalogue_rows: number; sku_count: number; inventory_records: number; recorded_zero: number;
    without_inventory: number; total_on_hand: number; total_reserved: number; total_available: number; movement_records: number; updated_at: string | null;
  };
};

const numberOrNA = (value: number | null) => value === null ? <span className="font-bold text-black/45">N/A</span> : value.toLocaleString();

export default function InventoryTable({ workspace, canAdjust }: { workspace: Workspace; canAdjust: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState<InventoryRow | null>(null);
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "recorded" | "not_recorded" | "zero">("all");

  const rows = useMemo(() => workspace.inventory.filter((row) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || [row.product_title, row.variant_title, row.sku, row.warehouse_name].some((value) => value?.toLowerCase().includes(search));
    const matchesFilter = filter === "all" || (filter === "zero" ? row.inventory_status === "recorded" && row.on_hand === 0 : row.inventory_status === filter);
    return matchesSearch && matchesFilter;
  }), [filter, query, workspace.inventory]);

  async function adjust(row: InventoryRow) {
    if (!row.variant_id || !row.warehouse_id) return;
    setMessage("");
    const response = await fetch("/api/admin/inventory/adjust", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId: row.variant_id, warehouseId: row.warehouse_id, idempotencyKey: crypto.randomUUID(), deltaOnHand: Number(delta), reason }),
    });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Adjustment failed"); return; }
    setActive(null); setDelta(0); setReason(""); setMessage("Inventory adjusted, audited and reloaded."); router.refresh();
  }

  const cards = [
    ["Website products", workspace.summary.catalogue_products], ["Catalogue rows", workspace.summary.catalogue_rows],
    ["Assigned SKUs", workspace.summary.sku_count], ["Inventory records", workspace.summary.inventory_records],
    ["Not recorded", workspace.summary.without_inventory], ["Actual on hand", workspace.summary.inventory_records ? workspace.summary.total_on_hand : "N/A"],
  ];

  return <div className="space-y-8">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([label, value]) => <div key={label} className="border border-sglInk bg-white p-4"><p className="text-xs font-black uppercase tracking-wide text-black/55">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}</div>

    <section>
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-2xl font-black uppercase">Catalogue & stock</h2><p className="text-sm text-black/60">Missing inventory stays Not Recorded; a recorded quantity of zero stays 0.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><input className={`${adminInput} min-w-64`} aria-label="Search catalogue" placeholder="Search product, SKU or location" value={query} onChange={(event) => setQuery(event.target.value)} /><select className={adminInput} aria-label="Filter inventory status" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">All records</option><option value="recorded">Recorded stock</option><option value="not_recorded">Not recorded</option><option value="zero">Recorded zero</option></select></div>
      </div>
      <p className="mb-3 min-h-5 text-sm font-bold" role="status">{message}</p>
      <div className="overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["Product", "SKU", "Price", "On hand", "Reserved", "Available", "Location", "Status", "Updated", "Action"].map((item) => <th key={item} className="p-3 uppercase">{item}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.row_id} className="border-t border-sglInk/20 align-top">
        <td className="p-3"><div className="flex min-w-64 gap-3">{row.image_url ? <img src={row.image_url} alt="" className="h-14 w-14 border border-black/15 object-cover" /> : <div className="h-14 w-14 border border-dashed border-black/25 bg-black/5" />}<div><span className="font-black">{row.product_title}</span><div className="text-xs opacity-60">{row.variant_title}</div></div></div></td>
        <td className="p-3">{row.sku || <span className="font-bold text-black/45">Not assigned</span>}</td><td className="p-3">{row.currency} {(row.price_cents / 100).toFixed(2)}</td>
        <td className="p-3">{numberOrNA(row.on_hand)}</td><td className="p-3">{numberOrNA(row.reserved)}</td><td className="p-3 font-black">{numberOrNA(row.available)}</td>
        <td className="p-3">{row.warehouse_name || <span className="font-bold text-black/45">Not Recorded</span>}</td><td className="p-3 font-black uppercase">{row.inventory_status === "not_recorded" ? "Not Recorded" : row.available === 0 ? "0 · Out of stock" : row.low_stock ? "Low stock" : "Recorded"}</td><td className="p-3">{row.updated_at ? new Date(row.updated_at).toLocaleString("en-CA") : "N/A"}</td>
        <td className="p-3">{canAdjust && row.inventory_status === "recorded" && row.variant_id && row.warehouse_id ? <button className="font-black uppercase underline" onClick={() => setActive(row)}>Adjust</button> : <span className="text-xs font-bold uppercase text-black/35">Read only</span>}</td>
      </tr>)}</tbody></table></div>{!rows.length && <div className="border-x border-b border-sglInk bg-white p-8 text-center font-bold">No matching catalogue rows.</div>}
    </section>

    <section><div className="mb-3 flex items-end justify-between"><div><h2 className="text-2xl font-black uppercase">Stock movements</h2><p className="text-sm text-black/60">Only persisted receipts, issues, sales, returns and adjustments appear here.</p></div><p className="text-xs font-bold uppercase">{workspace.summary.movement_records} records</p></div>
      <div className="overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["Time", "Product / SKU", "Location", "Type", "On-hand change", "After", "Reason", "Operator"].map((item) => <th key={item} className="p-3 uppercase">{item}</th>)}</tr></thead><tbody>{workspace.movements.map((movement) => <tr key={movement.id} className="border-t border-sglInk/20"><td className="p-3">{new Date(movement.created_at).toLocaleString("en-CA")}</td><td className="p-3"><span className="font-black">{movement.product_title}</span><div className="text-xs opacity-60">{movement.sku || movement.variant_title}</div></td><td className="p-3">{movement.warehouse_name || "N/A"}</td><td className="p-3 uppercase">{movement.movement_type}</td><td className="p-3 font-black">{movement.delta_on_hand > 0 ? "+" : ""}{movement.delta_on_hand}</td><td className="p-3">{movement.on_hand_after}</td><td className="p-3">{movement.reason}</td><td className="p-3">{movement.actor_email || "System"}</td></tr>)}</tbody></table></div>
      {!workspace.movements.length && <div className="border-x border-b border-sglInk bg-white p-8 text-center"><p className="font-black uppercase">No recorded stock movements</p><p className="mt-1 text-sm text-black/55">No receipt, issue or adjustment has been persisted in this environment.</p></div>}
    </section>

    <p className="text-xs font-bold text-black/55">Inventory last updated: {workspace.summary.updated_at ? new Date(workspace.summary.updated_at).toLocaleString("en-CA") : "Not Recorded"}</p>
    {active && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><div className="w-full max-w-md border border-sglInk bg-[#efefec] p-6 shadow-[8px_8px_0_#111]"><h2 className="text-2xl font-black uppercase">Adjust inventory</h2><p className="mt-1 text-sm">{active.product_title} · {active.warehouse_name}</p><label className="mt-4 block text-sm font-bold">On-hand change<input className={adminInput} type="number" value={delta} onChange={(event) => setDelta(Number(event.target.value))} /></label><label className="mt-3 block text-sm font-bold">Reason<textarea className={adminInput} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} /></label><div className="mt-5 flex gap-3"><button type="button" className={adminButton} onClick={() => adjust(active)}>Record</button><button type="button" className="px-4 font-black uppercase" onClick={() => setActive(null)}>Cancel</button></div></div></div>}
  </div>;
}
