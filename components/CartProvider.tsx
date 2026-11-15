"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { applyCartAdd, cartLineKey, CART_STORAGE_KEY, normalizeSavedCart, persistCart, type CartLine } from "@/lib/cart";
export type { CartLine } from "@/lib/cart";
type AddResult = { status: "added" | "duplicate" };
type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  storageError: boolean;
  setQuantity: (slug: string, variant: number, quantity: number) => void;
  add: (slug: string, variant: number, quantity: number, operationId: string) => Promise<AddResult>;
};
const CartContext = createContext<CartContextValue | null>(null);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const linesRef = useRef<CartLine[]>([]);
  const appliedOperations = useRef(new Set<string>());
  const pendingLines = useRef(new Set<string>());
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      const normalized = normalizeSavedCart(saved);
      linesRef.current = normalized;
      setLines(normalized);
    } catch { setStorageError(true); }
    setReady(true);
  }, []);

  function commit(next: CartLine[]) {
    try {
      persistCart(localStorage, next);
      linesRef.current = next;
      setLines(next);
    } catch (error) {
      setStorageError(true);
      throw error;
    }
  }

  function setQuantity(slug: string, variant: number, quantity: number) {
    if (!ready || !Number.isInteger(quantity)) return;
    const next = quantity <= 0
      ? linesRef.current.filter(line => line.slug !== slug || line.variant !== variant)
      : linesRef.current.map(line => line.slug === slug && line.variant === variant ? { ...line, quantity: Math.min(quantity, 99) } : line);
    try { commit(next); } catch { /* surfaced through storageError */ }
  }

  async function add(slug: string, variant: number, quantity: number, operationId: string): Promise<AddResult> {
    if (!ready) throw new Error("Cart is still loading.");
    const lineKey = cartLineKey(slug, variant);
    if (pendingLines.current.has(lineKey)) return { status: "duplicate" };
    pendingLines.current.add(lineKey);
    try {
      const result = applyCartAdd(linesRef.current, { slug, variant, quantity, operationId }, appliedOperations.current);
      if (result.status === "duplicate") return { status: result.status };
      commit(result.lines);
      appliedOperations.current = result.appliedOperations;
      if (appliedOperations.current.size > 200) appliedOperations.current.delete(appliedOperations.current.values().next().value!);
      return { status: result.status };
    } finally {
      pendingLines.current.delete(lineKey);
    }
  }
  return <CartContext.Provider value={{ lines, ready, storageError, setQuantity, add }}>{children}</CartContext.Provider>;
}
export function useCart() { const cart = useContext(CartContext); if (!cart) throw new Error("CartProvider missing"); return cart; }
