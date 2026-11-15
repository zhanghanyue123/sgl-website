"use client";

import { useEffect, useState } from "react";

type Status = {
  orderStatus: string;
  paymentStatus: string;
  providerPaymentStatus: string;
  providerStatus: string | null;
};

export default function CheckoutStatus({ token }: { token: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const poll = async () => {
      try {
        const response = await fetch(`/api/checkout/status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("status unavailable");
        const next = await response.json() as Status;
        if (cancelled) return;
        setStatus(next);
        setUnavailable(false);
        if (!["paid", "partially_refunded", "refunded", "disputed"].includes(next.paymentStatus) && attempts++ < 20) {
          timer = setTimeout(poll, 3000);
        }
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  if (status && ["paid", "partially_refunded", "refunded", "disputed"].includes(status.paymentStatus)) {
    return <p className="mt-4 font-bold" role="status">Payment verified by the SGL order ledger.</p>;
  }
  if (status?.orderStatus === "payment_review") {
    return <p className="mt-4 font-bold" role="status">Payment was verified but needs human review before fulfillment.</p>;
  }
  return <p className="mt-4" role="status">{unavailable ? "Payment status is temporarily unavailable." : "Waiting for the verified payment webhook…"}</p>;
}
