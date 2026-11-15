import { getProduct } from "@/data/products";

export type CartLine = { slug: string; variant: number; quantity: number };
export type CartAddCommand = CartLine & { operationId: string };
export type CartAddResult = { lines: CartLine[]; status: "added" | "duplicate"; appliedOperations: Set<string> };
export const CART_STORAGE_KEY = "sgl-cart-v1";

export function cartLineKey(slug: string, variant: number) {
  return `${slug}:${variant}`;
}

export function validCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as CartLine;
  if (typeof line.slug !== "string" || !Number.isInteger(line.variant) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) return false;
  const product = getProduct(line.slug);
  if (!product || product.soldOut || line.variant < 0 || line.variant >= Math.max(1, product.variants.length)) return false;
  return !product.variants[line.variant]?.soldOut;
}

export function normalizeSavedCart(value: unknown) {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, CartLine>();
  value.filter(validCartLine).slice(0, 100).forEach((line) => unique.set(`${line.slug}:${line.variant}`, line));
  return Array.from(unique.values());
}

export function addCartLine(lines: CartLine[], line: CartLine) {
  if (!validCartLine(line)) throw new Error("Cart item is invalid.");
  const key = cartLineKey(line.slug, line.variant);
  const existing = lines.find(item => cartLineKey(item.slug, item.variant) === key);
  if (!existing) return [...lines, { ...line }];
  return lines.map(item => item === existing ? { ...item, quantity: Math.min(99, item.quantity + line.quantity) } : item);
}

export function applyCartAdd(lines: CartLine[], command: CartAddCommand, appliedOperations: ReadonlySet<string>): CartAddResult {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(command.operationId)) throw new Error("Cart operation ID is invalid.");
  if (appliedOperations.has(command.operationId)) return { lines, status: "duplicate", appliedOperations: new Set(appliedOperations) };
  const nextOperations = new Set(appliedOperations);
  nextOperations.add(command.operationId);
  return {
    lines: addCartLine(lines, command),
    status: "added",
    appliedOperations: nextOperations
  };
}

export function cartItemCount(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function persistCart(storage: Pick<Storage, "setItem">, lines: CartLine[]) {
  storage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
}
