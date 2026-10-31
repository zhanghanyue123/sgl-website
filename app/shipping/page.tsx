import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Sales, Shipping & Returns — The Seagull Labs", "Read SGL ordering and delivery information: USD pricing, stock confirmation, shipping enquiries, station pickup and help with returns or damaged items.", "/shipping");

const sections = [
  { title: "Ordering & availability", text: "For an order enquiry, email the product name, size or colour, quantity and destination to hello@theseagulllabs.com. Please confirm current stock and payment arrangements with our team before paying. Adding a product to your cart does not reserve stock." },
  { title: "Prices & payment", text: "Website shop prices are displayed in US dollars (USD). They are product prices, not a delivered quote. Confirm the final total, payment currency, delivery charge and any applicable taxes with our team before placing your order. Online card checkout is not currently available." },
  { title: "Delivery destinations & charges", text: "Contact us with your country, city and postal code to check whether delivery is available for your order. Shipping charges depend on the destination and parcel. A list of supported destinations and standard delivery rates is not yet published; please request a quote before ordering." },
  { title: "Dispatch & delivery times", text: "Ask our team for a dispatch estimate and the available shipping service when confirming your order. We do not currently publish a standard dispatch or arrival timeframe. Please confirm timing with us before ordering for a specific date." },
  { title: "International orders", text: "For overseas delivery, ask which taxes or import charges are included in your quote and which, if any, are payable on arrival. Confirm these costs before accepting the order." },
  { title: "Station pickup", text: "Ask our team whether your chosen item can be collected at Seagull Station in Shanghai. Confirm stock, the collection address and a pickup time before visiting." },
  { title: "Returns, exchanges & order support", text: "Please request the applicable return and exchange terms before purchasing. To discuss a return, exchange, cancellation, incorrect item or damage, email your order reference and a description of the issue. For damage, include photographs if available. Contact us for the correct return instructions before sending anything back. This information does not limit any rights that apply under applicable law." }
];

export default function ShippingPage() {
  return <section className="mx-auto max-w-sgl px-4 py-16 md:px-8">
    <p className="text-sm font-black uppercase tracking-[0.25em] opacity-60">Customer information</p>
    <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-none md:text-7xl">Sales, shipping &amp; returns</h1>
    <p className="mt-6 max-w-3xl text-lg leading-8 opacity-75">Planning an order? Here is what to check with the SGL team, from product availability to delivery and after-sales support.</p>
    <div className="mt-10 grid gap-6 md:grid-cols-2">{sections.map(section => <article key={section.title} className="border border-sglInk bg-sglPaper p-6"><h2 className="text-2xl font-black uppercase">{section.title}</h2><p className="mt-4 leading-7 opacity-80">{section.text}</p></article>)}</div>
    <div className="mt-10 flex flex-wrap gap-4"><a href="mailto:hello@theseagulllabs.com" className="border border-sglInk bg-sglAcid px-6 py-3 font-bold">Ask about an order</a><Link href="/shop" className="border border-sglInk px-6 py-3 font-bold">Back to Shop</Link></div>
  </section>;
}
