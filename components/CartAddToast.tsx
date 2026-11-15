"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import type { CartAddStatus } from "./useCartAdd";

export default function CartAddToast({ status, message, cartLabel, cartHref }: {
  status: CartAddStatus;
  message: string;
  cartLabel: string;
  cartHref: string;
}) {
  if (status !== "added") return null;
  return createPortal(<div role="status" aria-live="polite" className="fixed bottom-5 left-4 right-4 z-[80] max-w-[calc(100vw-2rem)] border-2 border-sglInk bg-white p-4 text-sglInk shadow-[6px_6px_0_#111111] sm:left-auto sm:right-6 sm:w-80">
    <p className="font-black uppercase">{message}</p>
    <Link className="mt-2 inline-block font-bold text-sglInk underline" href={cartHref}>{cartLabel}</Link>
  </div>, document.body);
}
