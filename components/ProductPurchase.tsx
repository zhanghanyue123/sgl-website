"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Product } from "@/data/products";
import { useCartAdd } from "./useCartAdd";
import CartAddToast from "./CartAddToast";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n";
const purchaseCopy: Record<Locale, { options: string; option: string; quantity: string; add: string; adding: string; added: string; addedButton: string; error: string; cart: string; soldOut: string }> = {
  en: { options: "Options", option: "Option", quantity: "Quantity", add: "Add to cart", adding: "Adding…", added: "Added to cart.", addedButton: "Added to cart", error: "Could not add this item. Please try again.", cart: "View cart →", soldOut: "Sold out" },
  "zh-CN": { options: "规格", option: "选项", quantity: "数量", add: "加入购物车", adding: "正在加入…", added: "已加入购物车。", addedButton: "已加入购物车", error: "暂时无法加入购物车，请重试。", cart: "查看购物车 →", soldOut: "售罄" },
  "ja-JP": { options: "オプション", option: "選択", quantity: "数量", add: "カートに追加", adding: "追加中…", added: "カートに追加しました。", addedButton: "追加しました", error: "カートに追加できませんでした。もう一度お試しください。", cart: "カートを見る →", soldOut: "売り切れ" },
  "ko-KR": { options: "옵션", option: "옵션", quantity: "수량", add: "장바구니에 담기", adding: "담는 중…", added: "장바구니에 담았습니다.", addedButton: "장바구니에 담음", error: "장바구니에 담지 못했습니다. 다시 시도해 주세요.", cart: "장바구니 보기 →", soldOut: "품절" },
  "it-IT": { options: "Opzioni", option: "Opzione", quantity: "Quantità", add: "Aggiungi al carrello", adding: "Aggiunta…", added: "Aggiunto al carrello.", addedButton: "Aggiunto al carrello", error: "Impossibile aggiungere l’articolo. Riprova.", cart: "Vai al carrello →", soldOut: "Esaurito" }
};
export default function ProductPurchase({ product }: { product: Product }) {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const copy = purchaseCopy[locale];
  const cartAdd = useCartAdd();
  const firstAvailable = product.variants.findIndex((item) => !item.soldOut);
  const [variant, setVariant] = useState(firstAvailable >= 0 ? firstAvailable : 0);
  const [quantity, setQuantity] = useState(1);
  const price = product.variants[variant]?.price ?? product.price;
  const soldOut = product.soldOut || product.variants[variant]?.soldOut;
  return <div className="mt-8 border border-sglInk p-5">
    {product.variants.length > 1 && <label className="block font-bold">{copy.options}
      <select className="mt-3 w-full border border-sglInk bg-sglPaper p-3" value={variant} onChange={event => { setVariant(Number(event.target.value)); cartAdd.reset(); }}>
        {product.variants.map((option, index) => <option key={index} value={index} disabled={option.soldOut}>{option.options.map(item => item.value).join(" / ") || option.sku || `${copy.option} ${index + 1}`}{option.soldOut ? ` — ${copy.soldOut}` : ""}</option>)}
      </select>
    </label>}
    <p className="my-4 whitespace-nowrap text-2xl font-black">$ {price.toFixed(2)}</p>
    {!soldOut && <label className="block font-bold">{copy.quantity}
      <select className="ml-4 border border-sglInk bg-sglPaper p-2" value={quantity} onChange={event => { setQuantity(Number(event.target.value)); cartAdd.reset(); }}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
    </label>}
    <button disabled={!cartAdd.ready || soldOut || cartAdd.busy} aria-busy={cartAdd.busy} onClick={() => void cartAdd.submit(product.slug, variant, quantity)} className="mt-5 w-full border border-sglInk bg-sglAcid p-4 font-black disabled:opacity-50">{soldOut ? copy.soldOut : cartAdd.busy ? copy.adding : cartAdd.status === "added" ? copy.addedButton : copy.add}</button>
    <p aria-live="polite" className="mt-3">{cartAdd.status === "added" && <>{copy.added} <Link className="underline" href={localizedPath("/cart", locale)}>{copy.cart}</Link></>}{cartAdd.status === "error" && <span role="alert">{copy.error}</span>}</p>
    <CartAddToast status={cartAdd.status} message={copy.added} cartLabel={copy.cart} cartHref={localizedPath("/cart", locale)} />
  </div>;
}
