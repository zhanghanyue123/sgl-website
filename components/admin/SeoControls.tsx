"use client";
import { useState } from "react";
import { adminButton, adminInput } from "./AdminPage";

export function SeoAuditControl() {
  const [baseUrl, setBaseUrl] = useState("https://www.theseagulllabs.com"); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function run() { setBusy(true); setMessage(""); const response = await fetch("/api/admin/seo/audits", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ baseUrl, maxPages: 100 }) }); const body = await response.json().catch(() => ({})); setMessage(response.ok ? `完成：${body.run.pages} pages / ${body.run.issues} issues` : body.error || "审计失败"); setBusy(false); }
  return <section className="border border-sglInk bg-white p-5"><h2 className="text-xl font-black uppercase">手动只读审计</h2><div className="mt-3 flex gap-3"><input className={adminInput} value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /><button className={adminButton} disabled={busy} onClick={run}>运行</button></div>{message && <p className="mt-3 text-sm font-bold">{message}</p>}<p className="mt-2 text-xs">仅允许配置过的来源；不会修改页面、robots、canonical 或 URL。</p></section>;
}

export function SeoProposalControl() {
  const [pageUrl, setPageUrl] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function generate() { setBusy(true); setMessage(""); const response = await fetch("/api/admin/seo/proposals/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pageUrl }) }); const body = await response.json().catch(() => ({})); setMessage(response.ok ? "优化建议草稿已创建，请刷新页面审核。" : body.error || "生成失败"); setBusy(false); }
  return <section className="border border-sglInk bg-white p-5"><h2 className="text-xl font-black uppercase">生成优化建议</h2><div className="mt-3 flex gap-3"><input className={adminInput} placeholder="已有 crawl evidence 的完整 URL" value={pageUrl} onChange={(event) => setPageUrl(event.target.value)} /><button className={adminButton} disabled={busy || !pageUrl} onClick={generate}>生成草稿</button></div>{message && <p className="mt-3 text-sm font-bold">{message}</p>}<p className="mt-2 text-xs">LLM 未配置时明确失败；不会生成伪数据，也不会自动发布。</p></section>;
}
