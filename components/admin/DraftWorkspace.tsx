"use client";
import { useState } from "react";
import type { ContentDraftModule, ContentDraftRecord, ContentDraftStatus } from "@/lib/content-drafts/types";
import { adminButton, adminInput } from "./AdminPage";

const statusLabel: Record<ContentDraftStatus, string> = { draft: "草稿", review: "待审核", approved: "已批准", published: "已发布" };

function DraftCard({ initial, module, canWrite, canApprove }: { initial: ContentDraftRecord; module: ContentDraftModule; canWrite: boolean; canApprove: boolean }) {
  const [draft, setDraft] = useState(initial); const [title, setTitle] = useState(initial.title);
  const [payload, setPayload] = useState(JSON.stringify(initial.payload, null, 2)); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function patch(input: { save?: boolean; nextStatus?: ContentDraftStatus }) {
    setBusy(true); setMessage(""); let parsed: Record<string, unknown> | undefined;
    if (input.save) { try { parsed = JSON.parse(payload); } catch { setMessage("JSON 格式错误"); setBusy(false); return; } }
    const response = await fetch(`/api/admin/content-drafts/${draft.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ module, expectedVersion: draft.version, ...(input.save ? { title, payload: parsed } : {}), ...(input.nextStatus ? { nextStatus: input.nextStatus } : {}) }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body.error || "操作失败"); setBusy(false); return; }
    setDraft(body.draft); setTitle(body.draft.title); setPayload(JSON.stringify(body.draft.payload, null, 2)); setBusy(false);
  }
  const editable = canWrite && (draft.status === "draft" || draft.status === "review");
  return <article className="border border-sglInk bg-white p-5 shadow-[4px_4px_0_#111]">
    <div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider opacity-55">{draft.kind} · v{draft.version}{draft.product_title ? ` · ${draft.product_title}` : ""}</p><input className={`${adminInput} mt-2 text-lg font-black`} value={title} disabled={!editable} onChange={(event) => setTitle(event.target.value)} /></div><span className="h-fit border border-sglInk px-3 py-1 text-xs font-black uppercase">{statusLabel[draft.status]}</span></div>
    <textarea className={`${adminInput} mt-4 min-h-96 font-mono text-xs`} value={payload} disabled={!editable} onChange={(event) => setPayload(event.target.value)} spellCheck={false} />
    <details className="mt-3 text-xs"><summary className="cursor-pointer font-black uppercase">生成依据与模型记录</summary><pre className="mt-2 overflow-x-auto bg-sglPaper p-3">{JSON.stringify({ source: draft.source_snapshot, generation: draft.generation_metadata }, null, 2)}</pre></details>
    <div className="mt-4 flex flex-wrap gap-2">
      {editable && <button className={adminButton} disabled={busy} onClick={() => patch({ save: true })}>保存编辑</button>}
      {canWrite && draft.status === "draft" && <button className={adminButton} disabled={busy} onClick={() => patch({ nextStatus: "review" })}>提交审核</button>}
      {canWrite && draft.status === "review" && <button className={`${adminButton} bg-white`} disabled={busy} onClick={() => patch({ nextStatus: "draft" })}>退回草稿</button>}
      {canApprove && draft.status === "review" && <button className={adminButton} disabled={busy} onClick={() => patch({ nextStatus: "approved" })}>批准</button>}
      {canApprove && draft.status === "approved" && <button className={`${adminButton} bg-white`} disabled={busy} onClick={() => patch({ nextStatus: "review" })}>重新审核</button>}
    </div>
    {draft.status === "approved" && <p className="mt-3 text-xs font-bold">外部发布默认关闭；批准不会发送邮件、发布社交媒体或修改商品页面。</p>}
    {message && <p className="mt-3 text-sm font-bold text-red-700">{message}</p>}
  </article>;
}

export default function DraftWorkspace({ drafts, module, canWrite, canApprove }: { drafts: ContentDraftRecord[]; module: ContentDraftModule; canWrite: boolean; canApprove: boolean }) {
  return <div className="space-y-5">{drafts.length === 0 && <p className="border border-sglInk bg-white p-6">暂无草稿。</p>}{drafts.map((draft) => <DraftCard key={draft.id} initial={draft} module={module} canWrite={canWrite} canApprove={canApprove} />)}</div>;
}
