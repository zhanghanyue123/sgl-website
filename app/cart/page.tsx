"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { getProduct } from "@/data/products";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n";

const copy: Record<Locale, {
  title: string; loading: string; empty: string; browse: string; each: string;
  quantity: string; remove: string; subtotal: string; note: string; unavailable: string;
  preparing: string; checkout: string; contact: string; storage: string; error: string; invalid: string;
}> = {
  en: { title: "Your cart", loading: "Loading your cart…", empty: "Your cart is empty.", browse: "Browse the shop →", each: "each", quantity: "Quantity", remove: "Remove", subtotal: "Subtotal", note: "All prices are shown in USD. Shipping and stock are confirmed before payment; adding an item does not reserve inventory.", unavailable: "Online payment is not available", preparing: "Preparing secure checkout…", checkout: "Checkout", contact: "Contact SGL to confirm an order", storage: "This browser cannot save the cart, so it may be lost when the page closes.", error: "Checkout is temporarily unavailable. Please try again later or contact SGL.", invalid: "The secure checkout address could not be verified. Please contact SGL." },
  "zh-CN": { title: "购物车", loading: "正在加载购物车…", empty: "购物车还是空的。", browse: "浏览商品 →", each: "每件", quantity: "数量", remove: "移除", subtotal: "商品小计", note: "所有价格均以美元（USD）显示。运费和库存将在付款前确认；加入购物车不会预留库存。", unavailable: "在线支付暂未开放", preparing: "正在准备安全支付…", checkout: "前往支付", contact: "联系 SGL 确认订单", storage: "浏览器无法保存购物车，关闭页面后可能丢失。", error: "暂时无法结账，请稍后重试或联系 SGL。", invalid: "无法验证安全支付地址，请联系 SGL。" },
  "ja-JP": { title: "ショッピングカート", loading: "カートを読み込んでいます…", empty: "カートは空です。", browse: "ショップを見る →", each: "1点", quantity: "数量", remove: "削除", subtotal: "小計", note: "価格はすべて米ドル（USD）表示です。送料と在庫は支払い前に確認され、カート追加では在庫は確保されません。", unavailable: "オンライン決済は現在利用できません", preparing: "安全な決済を準備しています…", checkout: "決済へ進む", contact: "SGLへ注文を確認する", storage: "このブラウザではカートを保存できないため、ページを閉じると失われる場合があります。", error: "現在決済を利用できません。後でもう一度お試しいただくか、SGLへお問い合わせください。", invalid: "安全な決済ページを確認できませんでした。SGLへお問い合わせください。" },
  "ko-KR": { title: "장바구니", loading: "장바구니를 불러오는 중…", empty: "장바구니가 비어 있습니다.", browse: "스토어 보기 →", each: "개당", quantity: "수량", remove: "삭제", subtotal: "소계", note: "모든 가격은 미국 달러(USD)로 표시됩니다. 배송비와 재고는 결제 전에 확인되며 장바구니 담기는 재고를 예약하지 않습니다.", unavailable: "온라인 결제를 현재 이용할 수 없습니다", preparing: "안전한 결제를 준비하는 중…", checkout: "결제하기", contact: "SGL에 주문 확인하기", storage: "이 브라우저는 장바구니를 저장할 수 없어 페이지를 닫으면 내용이 사라질 수 있습니다.", error: "현재 결제를 이용할 수 없습니다. 나중에 다시 시도하거나 SGL에 문의해 주세요.", invalid: "안전한 결제 주소를 확인할 수 없습니다. SGL에 문의해 주세요." }
};

export default function CartPage() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const c = copy[locale];
  const { lines, ready, storageError, setQuantity } = useCart();
  const paymentsEnabled = process.env.NEXT_PUBLIC_STORE_CHECKOUT_ENABLED === "true";
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const attempt = useRef({ cart: "", key: "" });

  async function checkout() {
    if (busy || !ready) return;
    setBusy(true);
    setCheckoutError("");
    const cart = JSON.stringify(lines);
    if (attempt.current.cart !== cart) attempt.current = { cart, key: crypto.randomUUID() };
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.current.key },
        body: JSON.stringify({ items: lines })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(c.error);
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error(c.invalid);
      window.location.assign(url.href);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : c.error);
      setBusy(false);
    }
  }

  const items = lines.flatMap((line) => {
    const product = getProduct(line.slug);
    return product ? [{ ...line, product, price: Math.round((product.variants[line.variant]?.price ?? product.price) * 100) }] : [];
  });
  const total = items.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return <section className="mx-auto max-w-sgl px-4 py-12 md:px-8">
    <h1 className="text-5xl font-black uppercase">{c.title}</h1>
    {!ready ? <p className="mt-8">{c.loading}</p> : !items.length ? <p className="mt-8">{c.empty} <Link href={localizedPath("/shop", locale)} className="underline">{c.browse}</Link></p> : <>
      <div className="mt-8 divide-y divide-sglInk border-y border-sglInk">{items.map((line) => <article key={`${line.slug}:${line.variant}`} className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div><Link className="text-xl font-black" href={localizedPath(`/shop/${line.slug}`, locale)}>{line.product.title}</Link><p>{line.product.variants[line.variant]?.options.map((option) => option.value).join(" / ")}</p><p>$ {(line.price / 100).toFixed(2)} / {c.each}</p></div>
        <div className="flex items-center gap-4"><label>{c.quantity} <select className="border border-sglInk bg-sglPaper p-2" value={line.quantity} onChange={(event) => setQuantity(line.slug, line.variant, Number(event.target.value))}>{Array.from({ length: 99 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label><button className="underline" aria-label={`${c.remove} ${line.product.title}`} onClick={() => setQuantity(line.slug, line.variant, 0)}>{c.remove}</button><strong>$ {(line.price * line.quantity / 100).toFixed(2)}</strong></div>
      </article>)}</div>
      <p className="mt-8 text-2xl font-black">{c.subtotal} $ {(total / 100).toFixed(2)}</p>
      <p className="mt-3">{c.note}</p>
      <button disabled={busy || !ready || !paymentsEnabled} onClick={checkout} className="mt-6 block border border-sglInk bg-sglInk p-4 font-bold text-sglCream disabled:opacity-50">{!paymentsEnabled ? c.unavailable : busy ? c.preparing : c.checkout}</button>
      {checkoutError && <p role="alert" className="mt-4">{checkoutError}</p>}
      <Link className="mt-6 inline-block border border-sglInk bg-sglAcid p-4 font-bold" href={localizedPath("/contact", locale)}>{c.contact}</Link>
    </>}
    {storageError && <p role="status" className="mt-5">{c.storage}</p>}
  </section>;
}
