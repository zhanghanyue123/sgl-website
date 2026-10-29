import Link from "next/link";
export default function CheckoutReturn() {
  return <section className="mx-auto max-w-sgl px-4 py-20 md:px-8">
    <h1 className="text-4xl font-black">Thank you / 感谢订购</h1>
    <p className="mt-6 max-w-xl leading-8">支付结果正在确认。此页面不代表订单已付款；请以支付确认和 SGL 的订单通知为准。</p>
    <div className="mt-8 flex gap-6"><Link className="underline" href="/shop">继续浏览商品</Link><Link className="underline" href="/contact">联系 SGL</Link></div>
  </section>;
}
