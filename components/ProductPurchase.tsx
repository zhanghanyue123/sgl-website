"use client";
import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/products";
import { useCart } from "./CartProvider";
export default function ProductPurchase({ product }: { product: Product }) {
  const { add, ready } = useCart();
  const [variant, setVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const price = product.variants[variant]?.price ?? product.price;
  return <div className="mt-8 border border-sglInk p-5">
    {product.variants.length > 0 && <label className="block font-bold">Options / 规格
      <select className="mt-3 w-full border border-sglInk bg-sglPaper p-3" value={variant} onChange={event => { setVariant(Number(event.target.value)); setAdded(false); }}>
        {product.variants.map((option, index) => <option key={index} value={index}>{option.options.map(item => item.value).join(" / ") || option.sku || `Option ${index + 1}`}</option>)}
      </select>
    </label>}
    <p className="my-4 text-2xl font-black">¥ {price.toFixed(2)}</p>
    <label className="block font-bold">Quantity / 数量
      <select className="ml-4 border border-sglInk bg-sglPaper p-2" value={quantity} onChange={event => { setQuantity(Number(event.target.value)); setAdded(false); }}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
    </label>
    <button disabled={!ready} onClick={() => { add(product.slug, variant, quantity); setAdded(true); }} className="mt-5 w-full border border-sglInk bg-sglAcid p-4 font-black disabled:opacity-50">ADD TO CART / 加入购物车</button>
    <p aria-live="polite" className="mt-3">{added && <>已加入购物车。<Link className="underline" href="/cart">查看购物车 →</Link></>}</p>
  </div>;
}
