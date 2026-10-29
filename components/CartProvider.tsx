"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getProduct } from "@/data/products";
export type CartLine = { slug: string; variant: number; quantity: number };
const CartContext = createContext<{ lines: CartLine[]; ready: boolean; storageError: boolean; setQuantity: (slug: string, variant: number, quantity: number) => void; add: (slug: string, variant: number, quantity: number) => void } | null>(null);
const key = "sgl-cart-v1";
function validLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as CartLine;
  if (typeof line.slug !== "string" || !Number.isInteger(line.variant) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) return false;
  const product = getProduct(line.slug);
  return !!product && line.variant >= 0 && line.variant < Math.max(1, product.variants.length);
}
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(saved)) {
        const unique = new Map<string, CartLine>();
        saved.filter(validLine).slice(0, 100).forEach(line => unique.set(`${line.slug}:${line.variant}`, line));
        setLines(Array.from(unique.values()));
      }
    } catch { setStorageError(true); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify(lines)); } catch { setStorageError(true); }
  }, [lines, ready]);
  function setQuantity(slug: string, variant: number, quantity: number) {
    if (!ready || !Number.isInteger(quantity)) return;
    setLines(previous => quantity <= 0 ? previous.filter(line => line.slug !== slug || line.variant !== variant) : previous.map(line => line.slug === slug && line.variant === variant ? { ...line, quantity: Math.min(quantity, 99) } : line));
  }
  function add(slug: string, variant: number, quantity: number) {
    if (!ready || !validLine({ slug, variant, quantity })) return;
    setLines(previous => {
      const existing = previous.find(line => line.slug === slug && line.variant === variant);
      if (existing) return previous.map(line => line === existing ? { ...line, quantity: Math.min(99, line.quantity + quantity) } : line);
      return [...previous, { slug, variant, quantity }];
    });
  }
  return <CartContext.Provider value={{ lines, ready, storageError, setQuantity, add }}>{children}</CartContext.Provider>;
}
export function useCart() { const cart = useContext(CartContext); if (!cart) throw new Error("CartProvider missing"); return cart; }
