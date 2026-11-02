"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Product } from "@/data/products";
import { useCart } from "./CartProvider";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n";
const purchaseCopy: Record<Locale, { options: string; option: string; quantity: string; add: string; added: string; cart: string; soldOut: string }> = {
  en: { options: "Options", option: "Option", quantity: "Quantity", add: "Add to cart", added: "Added to cart.", cart: "View cart →", soldOut: "Sold out" },
  "zh-CN": { options: "规格", option: "选项", quantity: "数量", add: "加入购物车", added: "已加入购物车。", cart: "查看购物车 →", soldOut: "售罄" },
  "ja-JP": { options: "オプション", option: "選択", quantity: "数量", add: "カートに追加", added: "カートに追加しました。", cart: "カートを見る →", soldOut: "売り切れ" },
  "ko-KR": { options: "옵션", option: "옵션", quantity: "수량", add: "장바구니에 담기", added: "장바구니에 담았습니다.", cart: "장바구니 보기 →", soldOut: "품절" },
  "it-IT": { options: "Opzioni", option: "Opzione", quantity: "Quantità", add: "Aggiungi al carrello", added: "Aggiunto al carrello.", cart: "Vai al carrello →", soldOut: "Esaurito" }
};
export default function ProductPurchase({ product }: { product: Product }) {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const copy = purchaseCopy[locale];
  const { add, ready } = useCart();
  const firstAvailable = product.variants.findIndex((item) => !item.soldOut);
  const [variant, setVariant] = useState(firstAvailable >= 0 ? firstAvailable : 0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const price = product.variants[variant]?.price ?? product.price;
  const soldOut = product.soldOut || product.variants[variant]?.soldOut;
  return <div className="mt-8 border border-sglInk p-5">
    {product.variants.length > 0 && <label className="block font-bold">{copy.options}
      <select className="mt-3 w-full border border-sglInk bg-sglPaper p-3" value={variant} onChange={event => { setVariant(Number(event.target.value)); setAdded(false); }}>
        {product.variants.map((option, index) => <option key={index} value={index} disabled={option.soldOut}>{option.options.map(item => item.value).join(" / ") || option.sku || `${copy.option} ${index + 1}`}{option.soldOut ? ` — ${copy.soldOut}` : ""}</option>)}
      </select>
    </label>}
    <p className="my-4 whitespace-nowrap text-2xl font-black">$ {price.toFixed(2)}</p>
    {!soldOut && <label className="block font-bold">{copy.quantity}
      <select className="ml-4 border border-sglInk bg-sglPaper p-2" value={quantity} onChange={event => { setQuantity(Number(event.target.value)); setAdded(false); }}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
    </label>}
    <button disabled={!ready || soldOut} onClick={() => { add(product.slug, variant, quantity); setAdded(true); }} className="mt-5 w-full border border-sglInk bg-sglAcid p-4 font-black disabled:opacity-50">{soldOut ? copy.soldOut : copy.add}</button>
    <p aria-live="polite" className="mt-3">{added && <>{copy.added} <Link className="underline" href={localizedPath("/cart", locale)}>{copy.cart}</Link></>}</p>
  </div>;
}
