"use client";
import { useMemo, useState } from "react";
import { adminButton, adminInput } from "./AdminPage";

type ProductOption = { id: string; title: string; status: string };
export default function DraftGenerator({ module, products = [] }: { module: "product_content" | "marketing"; products?: ProductOption[] }) {
  const defaultWeek = useMemo(() => {
    const date = new Date(); const day = date.getDay() || 7; date.setDate(date.getDate() - day + 1);
    return date.toISOString().slice(0, 10);
  }, []);
  const [productId, setProductId] = useState(products[0]?.id || ""); const [weekStart, setWeekStart] = useState(defaultWeek);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function generate() {
    setBusy(true); setMessage("");
    const response = await fetch(module === "product_content" ? "/api/admin/content-drafts/generate" : "/api/admin/marketing-drafts/generate", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(module === "product_content" ? { productId } : { weekStart })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body.error || "生成失败"); setBusy(false); return; }
    window.location.reload();
  }
  return <section className="mb-6 border border-sglInk bg-white p-5 shadow-[4px_4px_0_#111]">
    <h2 className="text-xl font-black uppercase">生成新草稿</h2>
    <p className="mt-1 text-sm opacity-65">只保存草稿，不发布、不发送。未配置 LLM 时不会生成模拟结果。</p>
    <div className="mt-4 flex flex-wrap items-end gap-3">
      {module === "product_content" ? <label className="min-w-72 flex-1 text-xs font-black uppercase">商品<select className={`${adminInput} mt-1`} value={productId} onChange={(event) => setProductId(event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.title} · {product.status}</option>)}</select></label>
        : <label className="text-xs font-black uppercase">周开始日期<input className={`${adminInput} mt-1`} type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} /></label>}
      <button className={adminButton} disabled={busy || (module === "product_content" && !productId)} onClick={generate}>{busy ? "生成中…" : "生成草稿"}</button>
    </div>{message && <p className="mt-3 text-sm font-bold text-red-700">{message}</p>}
  </section>;
}
