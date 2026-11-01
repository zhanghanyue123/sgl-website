import Link from "next/link";
export default function CheckoutReturn() {
  return <section className="mx-auto max-w-sgl px-4 py-20 md:px-8">
    <h1 className="text-4xl font-black">Order received</h1>
    <p className="mt-6 max-w-xl leading-8">The payment result is still being confirmed. This page does not prove that payment has completed; rely on the payment confirmation and SGL order notice.</p>
    <div className="mt-8 flex gap-6"><Link className="underline" href="/shop">Continue shopping</Link><Link className="underline" href="/contact">Contact SGL</Link></div>
  </section>;
}
