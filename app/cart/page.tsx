"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { getProduct } from "@/data/products";
export default function CartPage() {
  const { lines, ready, storageError, setQuantity } = useCart();
  const items = lines.flatMap(line => { const product = getProduct(line.slug); return product ? [{ ...line, product, price: Math.round((product.variants[line.variant]?.price ?? product.price) * 100) }] : []; });
  const total = items.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return <section className="mx-auto max-w-sgl px-4 py-12 md:px-8">
    <h1 className="text-5xl font-black uppercase">Your cart</h1>
    {!ready ? <p className="mt-8">正在加载购物车…</p> : !items.length ? <p className="mt-8">购物车还是空的。<Link href="/shop" className="underline">去逛逛 →</Link></p> : <>
      <div className="mt-8 divide-y divide-sglInk border-y border-sglInk">{items.map(line => <article key={`${line.slug}:${line.variant}`} className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div><Link className="text-xl font-black" href={`/shop/${line.slug}`}>{line.product.title}</Link><p>{line.product.variants[line.variant]?.options.map(option => option.value).join(" / ")}</p><p>¥ {(line.price / 100).toFixed(2)} / 件</p></div>
        <div className="flex items-center gap-4"><label>数量 <select className="border border-sglInk bg-sglPaper p-2" value={line.quantity} onChange={event => setQuantity(line.slug, line.variant, Number(event.target.value))}>{Array.from({ length: 99 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label><button className="underline" aria-label={`移除 ${line.product.title}`} onClick={() => setQuantity(line.slug, line.variant, 0)}>移除</button><strong>¥ {(line.price * line.quantity / 100).toFixed(2)}</strong></div>
      </article>)}</div>
      <p className="mt-8 text-2xl font-black">商品小计 ¥ {(total / 100).toFixed(2)}</p>
      <p className="mt-3">运费和库存需确认；购物车不会预留库存。</p>
      <Link className="mt-6 inline-block border border-sglInk bg-sglAcid p-4 font-bold" href="/contact">联系 SGL 确认订单</Link>
    </>}
    {storageError && <p role="status" className="mt-5">浏览器无法保存购物车，关闭页面后可能丢失。</p>}
  </section>;
}
