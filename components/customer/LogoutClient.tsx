"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutClient() {
  const router = useRouter(); const started = useRef(false); const [message, setMessage] = useState("Signing out…");
  useEffect(() => {
    if (started.current) return; started.current = true;
    fetch("/api/customer/session", { method: "DELETE" })
      .then(response => { if (!response.ok) throw new Error(); setMessage("Signed out."); router.replace("/"); router.refresh(); })
      .catch(() => setMessage("Sign out failed. Please try again."));
  }, [router]);
  return <p role="status" className="mt-8 font-bold" aria-live="polite">{message}</p>;
}
