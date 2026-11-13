"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function VerifyEmailClient({ token }: { token: string }) {
  const started = useRef(false);
  const [status, setStatus] = useState<"working" | "verified" | "failed">("working");
  const [message, setMessage] = useState("Verifying your email…");
  useEffect(() => {
    if (started.current) return; started.current = true;
    fetch("/api/customer/verify-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "Verification failed"); setStatus("verified"); setMessage("Your email is verified. You can now log in."); })
      .catch(error => { setStatus("failed"); setMessage(error instanceof Error ? error.message : "Verification failed"); });
  }, [token]);
  return <div className="mt-8 border border-sglInk bg-white p-6"><p role="status" aria-live="polite" className="font-bold">{message}</p>{status === "verified" && <Link href="/login" className="mt-5 inline-block border border-sglInk bg-sglAcid px-5 py-3 font-black uppercase">Log in</Link>}</div>;
}
