import { getProduct } from "@/data/products";

export type CartLine = { slug: string; variant: number; quantity: number };
export const CART_STORAGE_KEY = "sgl-cart-v1";

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
