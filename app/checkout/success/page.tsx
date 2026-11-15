import Link from "next/link";
import CheckoutStatus from "@/components/payments/CheckoutStatus";
export default async function CheckoutReturn({ searchParams }: { searchParams: Promise<{ status_token?: string }> }) {
  const token = (await searchParams).status_token;
  return <section data-content-section="success.status" className="mx-auto max-w-sgl px-4 py-20 md:px-8">
    <h1 className="text-4xl font-black">Order received</h1>
    <p className="mt-6 max-w-xl leading-8">The payment result is still being confirmed. This page does not prove that payment has completed; rely on the payment confirmation and SGL order notice.</p>
    {token && /^[A-Za-z0-9_.-]{20,300}$/.test(token) ? <CheckoutStatus token={token}/> : null}
    <div className="mt-8 flex gap-6"><Link className="underline" href="/shop">Continue shopping</Link><Link className="underline" href="/contact">Contact SGL</Link></div>
  </section>;
}
