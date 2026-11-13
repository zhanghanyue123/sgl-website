"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { localeFromPath, localizedPath } from "@/lib/i18n";

export default function PayPalReturnPage() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const params = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState<"capturing" | "paid" | "pending" | "error">("capturing");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const paypalOrderId = params.get("token");
    if (!paypalOrderId) { setState("error"); return; }
    const key = `paypal-capture-${crypto.randomUUID()}`;
    fetch("/api/paypal/orders/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ paypalOrderId })
    }).then(async response => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("capture_failed");
      setState(result.paymentStatus === "paid" ? "paid" : "pending");
    }).catch(() => setState("error"));
  }, [params]);
  return <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
    <p className="text-sm font-bold uppercase tracking-[0.2em]">PayPal Sandbox</p>
    <h1 className="mt-3 text-4xl font-black uppercase">{state === "paid" ? "Payment confirmed" : state === "pending" ? "Payment pending" : state === "error" ? "Payment not confirmed" : "Confirming payment…"}</h1>
    <p className="mt-5 text-lg">{state === "paid" ? "PayPal and the SGL order service both confirmed this sandbox payment." : state === "pending" ? "PayPal is still processing this sandbox payment. The order will update only after verified provider confirmation." : state === "error" ? "We could not verify and persist this sandbox payment. No browser return is treated as proof of payment." : "Please keep this page open while SGL verifies the PayPal capture."}</p>
    <Link href={localizedPath("/shop", locale)} className="mt-8 inline-block border border-sglInk bg-sglAcid px-5 py-3 font-bold">Return to shop</Link>
  </section>;
}
