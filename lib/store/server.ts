import Stripe from "stripe";
import { StoreError } from "./validation";
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !/^sk_(test|live)_/.test(key)) throw new StoreError(503, "在线支付尚未开放，请联系 SGL。");
  if (key.startsWith("sk_live_") && process.env.STRIPE_ALLOW_LIVE !== "true") throw new StoreError(503, "在线支付尚未开放，请联系 SGL。");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 12000 });
}
export function siteOrigin() {
  const origin = process.env.SITE_URL;
  if (!origin) throw new StoreError(503, "在线支付尚未开放，请联系 SGL。");
  const url = new URL(origin);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost"))) throw new StoreError(503, "网站地址配置不正确。");
  return url.origin;
}
export function assertOpsConfig() {
  const base = process.env.OPS_STORE_API_URL;
  if (!base || !process.env.OPS_STORE_API_TOKEN) throw new StoreError(503, "在线支付尚未开放，请联系 SGL。");
  const url = new URL(base);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new StoreError(503, "订单服务配置不正确。");
  return base.replace(/\/$/, "");
}
export async function opsRequest(path: string, body: unknown, requestKey: string): Promise<unknown> {
  const base = assertOpsConfig();
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(12000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPS_STORE_API_TOKEN}`, "Idempotency-Key": requestKey },
      body: JSON.stringify(body),
    });
  } catch { throw new StoreError(503, "订单服务暂时不可用，请稍后重试。"); }
  if (response.status === 409) throw new StoreError(409, "商品库存、报价或订单状态已变化，请刷新后重试。");
  if (!response.ok) throw new StoreError(503, "订单服务暂时不可用，请稍后重试。");
  try { return await response.json(); } catch { throw new StoreError(502, "订单服务返回了无效响应。"); }
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof StoreError ? error.message : "支付服务暂时不可用，请稍后重试。" }, { status: error instanceof StoreError ? error.status : 503 });
}
