"use client";
import { useState } from "react";
import { adminButton, adminInput } from "./AdminPage";

export default function AgentActionReview({ id }: { id: string }) {
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function review(status: "approved" | "rejected") {
    if (note.trim().length < 3) { setMessage("Add a review note first."); return; }
    setBusy(true); setMessage("");
    const response = await fetch(`/api/admin/agent-actions/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, note }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body.error || "Review failed"); setBusy(false); return; }
    window.location.reload();
  }
  return <div className="mt-3 space-y-2"><input className={adminInput} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required review note" maxLength={1000} />
    <div className="flex flex-wrap gap-2"><button className={adminButton} disabled={busy} onClick={() => review("approved")}>Approve proposal</button><button className={`${adminButton} bg-white`} disabled={busy} onClick={() => review("rejected")}>Reject</button></div>
    {message && <p className="text-xs font-bold text-red-700">{message}</p>}</div>;
}
