export class StoreError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export type CheckoutItem = { slug: string; variant: number; quantity: number };
export function parseItems(value: unknown): CheckoutItem[] {
  if (!value || typeof value !== "object" || !("items" in value)) throw new StoreError(400, "购物车格式不正确。");
  const items = (value as { items: unknown }).items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) throw new StoreError(400, "请选择 1–50 个商品规格。");
  const seen = new Set<string>();
  return items.map(item => {
    if (!item || typeof item !== "object" || typeof item.slug !== "string" || !/^[a-z0-9-]{1,150}$/.test(item.slug) || !Number.isInteger(item.variant) || item.variant < 0 || item.variant > 1000 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new StoreError(400, "商品或数量不正确。");
    const id = `${item.slug}:${item.variant}`;
    if (seen.has(id)) throw new StoreError(400, "购物车有重复规格。");
    seen.add(id);
    return { slug: item.slug, variant: item.variant, quantity: item.quantity };
  });
}
export function parseRequestKey(key: string | null): string {
  if (!key || !/^[a-zA-Z0-9_-]{16,100}$/.test(key)) throw new StoreError(400, "缺少有效的结账请求编号。");
  return key;
}
export type Quote = { orderId: string; expiresAt: number; currency: string; amountTotal: number; shippingRateId: string; shippingAmount: number; allowedCountries: string[]; lines: { priceId: string; quantity: number; unitAmount: number }[] };
export function parseQuote(value: unknown): Quote {
  const q = value as Quote;
  if (!q || typeof q.orderId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(q.orderId) || !Number.isInteger(q.expiresAt) || q.expiresAt < Math.floor(Date.now() / 1000) + 1800 || q.expiresAt > Math.floor(Date.now() / 1000) + 86400 || !/^(usd|eur|cny|hkd)$/.test(q.currency) || !Number.isSafeInteger(q.amountTotal) || q.amountTotal <= 0 || !Number.isSafeInteger(q.shippingAmount) || q.shippingAmount < 0 || typeof q.shippingRateId !== "string" || !/^shr_/.test(q.shippingRateId) || !Array.isArray(q.allowedCountries) || !q.allowedCountries.length || q.allowedCountries.some(c => typeof c !== "string" || !/^[A-Z]{2}$/.test(c)) || !Array.isArray(q.lines) || !q.lines.length || q.lines.length > 50) throw new StoreError(502, "商店报价暂时不可用。");
  for (const line of q.lines) if (!line || typeof line.priceId !== "string" || !/^price_/.test(line.priceId) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99 || !Number.isSafeInteger(line.unitAmount) || line.unitAmount <= 0) throw new StoreError(502, "商品报价暂时不可用。");
  const total = q.lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, q.shippingAmount);
  if (!Number.isSafeInteger(total) || total !== q.amountTotal) throw new StoreError(502, "报价金额不一致。");
  return q;
}
