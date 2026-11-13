"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CustomerAuthForm({ mode }: { mode: "register" | "login" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const endpoint = mode === "register" ? "/api/customer/register" : "/api/customer/session";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password"), name: data.get("name") })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed");
      if (mode === "login") { router.push("/"); router.refresh(); return; }
      setMessage("If this email can be registered, a verification link will arrive shortly. Check your inbox to activate the account.");
      event.currentTarget.reset();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="mt-8 space-y-5 border border-sglInk bg-white p-6" noValidate>
    {mode === "register" && <label className="block text-sm font-bold uppercase">Name <span className="font-normal normal-case opacity-60">(optional)</span><input name="name" autoComplete="name" maxLength={120} className="mt-2 w-full border border-sglInk p-3 font-normal normal-case" /></label>}
    <label className="block text-sm font-bold uppercase">Email<input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-2 w-full border border-sglInk p-3 font-normal normal-case" /></label>
    <label className="block text-sm font-bold uppercase">Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={12} maxLength={200} className="mt-2 w-full border border-sglInk p-3 font-normal normal-case" /></label>
    {mode === "register" && <p className="text-sm opacity-65">Use 12–200 characters with upper-case, lower-case and numeric characters.</p>}
    <button disabled={busy} className="w-full border border-sglInk bg-sglAcid px-5 py-3 font-black uppercase disabled:opacity-50">{busy ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}</button>
    {message && <p role="status" className="text-sm font-bold" aria-live="polite">{message}</p>}
    <p className="text-sm">{mode === "register" ? <>Already registered? <Link className="underline" href="/login">Log in</Link></> : <>Need an account? <Link className="underline" href="/register">Register</Link></>}</p>
  </form>;
}
