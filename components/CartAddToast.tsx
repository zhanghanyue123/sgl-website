"use client";

import Link from "next/link";
import type { CartAddStatus } from "./useCartAdd";

export default function CartAddToast({ status, message, cartLabel, cartHref }: {
  status: CartAddStatus;
  message: string;
  cartLabel: string;
  cartHref: string;
}) {
  if (status !== "added") return null;
  return <div role="status" aria-live="polite" className="fixed bottom-5 left-4 right-4 z-[80] border-2 border-sglInk bg-sglInk p-4 text-sglCream shadow-[6px_6px_0_#d6ff00] sm:left-auto sm:right-6 sm:w-80">
    <p className="font-black uppercase">{message}</p>
    <Link className="mt-2 inline-block font-bold text-sglAcid underline" href={cartHref}>{cartLabel}</Link>
  </div>;
}
