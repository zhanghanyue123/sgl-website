"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { CART_STORAGE_KEY, normalizeSavedCart, validCartLine, type CartLine } from "@/lib/cart";
export type { CartLine } from "@/lib/cart";
const CartContext = createContext<{ lines: CartLine[]; ready: boolean; storageError: boolean; setQuantity: (slug: string, variant: number, quantity: number) => void; add: (slug: string, variant: number, quantity: number) => void } | null>(null);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      setLines(normalizeSavedCart(saved));
    } catch { setStorageError(true); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines)); } catch { setStorageError(true); }
  }, [lines, ready]);
  function setQuantity(slug: string, variant: number, quantity: number) {
    if (!ready || !Number.isInteger(quantity)) return;
    setLines(previous => quantity <= 0 ? previous.filter(line => line.slug !== slug || line.variant !== variant) : previous.map(line => line.slug === slug && line.variant === variant ? { ...line, quantity: Math.min(quantity, 99) } : line));
  }
  function add(slug: string, variant: number, quantity: number) {
    if (!ready || !validCartLine({ slug, variant, quantity })) return;
    setLines(previous => {
      const existing = previous.find(line => line.slug === slug && line.variant === variant);
      if (existing) return previous.map(line => line === existing ? { ...line, quantity: Math.min(99, line.quantity + quantity) } : line);
      return [...previous, { slug, variant, quantity }];
    });
  }
  return <CartContext.Provider value={{ lines, ready, storageError, setQuantity, add }}>{children}</CartContext.Provider>;
}
export function useCart() { const cart = useContext(CartContext); if (!cart) throw new Error("CartProvider missing"); return cart; }
