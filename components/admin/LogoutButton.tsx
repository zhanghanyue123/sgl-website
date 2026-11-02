"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button disabled={busy} onClick={async () => { setBusy(true); await fetch("/api/admin/session", { method: "DELETE" }); router.replace("/admin/login"); router.refresh(); }} className="mt-6 w-full border border-sglCream px-3 py-2 text-sm font-black uppercase disabled:opacity-50">{busy ? "Signing out…" : "Sign out"}</button>;
}
