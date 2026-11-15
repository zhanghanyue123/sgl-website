"use client";

import { useRef, useState } from "react";
import { useCart } from "./CartProvider";

export type CartAddStatus = "idle" | "loading" | "added" | "error";

function nextPaint() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

export function useCartAdd() {
  const { add, ready } = useCart();
  const [status, setStatus] = useState<CartAddStatus>("idle");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const operationId = useRef<string | undefined>(undefined);

  async function submit(slug: string, variant: number, quantity: number) {
    if (!ready || pending.current) return false;
    pending.current = true;
    operationId.current ||= crypto.randomUUID();
    setError("");
    setStatus("loading");
    try {
      await nextPaint();
      const result = await add(slug, variant, quantity, operationId.current);
      if (result.status === "duplicate") return false;
      operationId.current = undefined;
      setStatus("added");
      return true;
    } catch {
      setError("add_failed");
      setStatus("error");
      return false;
    } finally {
      pending.current = false;
    }
  }

  function reset() {
    if (pending.current) return;
    operationId.current = undefined;
    setError("");
    setStatus("idle");
  }

  return { submit, reset, status, error, busy: status === "loading", ready };
}
