"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!configured || busy) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error || "Sign in failed");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return <form onSubmit={submit} className="mt-8 grid gap-5">
    <label className="grid gap-2 text-sm font-black uppercase tracking-wide">Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="border border-sglInk bg-white px-4 py-3 font-normal normal-case" /></label>
    <label className="grid gap-2 text-sm font-black uppercase tracking-wide">Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="border border-sglInk bg-white px-4 py-3 font-normal normal-case" /></label>
    {!configured && <p role="alert" className="border border-amber-700 bg-amber-100 p-4">DATABASE_URL is not configured. Complete the Phase 2 database setup before signing in.</p>}
    {error && <p role="alert" className="border border-red-700 bg-red-50 p-4">{error}</p>}
    <button disabled={!configured || busy} className="border border-sglInk bg-sglInk px-5 py-4 font-black uppercase text-sglCream disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
  </form>;
}
