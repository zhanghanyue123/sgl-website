import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Stockists & Retail Enquiries — The Seagull Labs", "Contact SGL for current retail availability, Shanghai Station pickup, wholesale and retail partnership enquiries.", "/stockists");

export default function StockistsPage() {
  return <section>
    <div className="border-b border-sglInk bg-sglInk text-sglCream"><div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-sglAcid">Find SGL</p>
      <h1 className="mt-4 text-5xl font-black uppercase md:text-6xl">Stockists</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 opacity-80">Contact SGL for current retail availability, Station pickup and wholesale or retail partnership enquiries.</p>
    </div></div>
    <div className="mx-auto grid max-w-sgl gap-6 px-4 py-16 md:grid-cols-3 md:px-8">
      <article className="border border-sglInk bg-sglPaper p-6"><p className="text-xs font-bold uppercase tracking-widest opacity-60">Direct from SGL</p><h2 className="mt-4 text-3xl font-black uppercase">Online enquiries</h2><p className="mt-4 leading-7">Browse the collection and contact our team to confirm availability and delivery options for your location.</p><Link href="/shop" className="mt-6 inline-block font-bold underline">Explore the collection</Link></article>
      <article className="border border-sglInk bg-sglAcid p-6"><p className="text-xs font-bold uppercase tracking-widest">Shanghai, China</p><h2 className="mt-4 text-3xl font-black uppercase">Seagull Station</h2><p className="mt-4 leading-7">China, Shanghai, Pudong New Area, Jinyan Road &amp; Dongxiu Road Plaza, L1. Ask about Station pickup and available goods, and confirm opening hours and your item before visiting.</p><Link href="/station" className="mt-6 inline-block font-bold underline">Discover the station</Link></article>
      <article className="border border-sglInk bg-sglPaper p-6"><p className="text-xs font-bold uppercase tracking-widest opacity-60">Retail partners</p><h2 className="mt-4 text-3xl font-black uppercase">Find a stockist</h2><p className="mt-4 leading-7">A public stockist directory is not currently available. Email your city and the product you are looking for to enquire about local availability.</p><a href="mailto:hello@theseagulllabs.com?subject=Stockist%20enquiry" className="mt-6 inline-block font-bold underline">Ask our team</a></article>
    </div>
    <div className="border-t border-sglInk bg-sglFog"><div className="mx-auto max-w-sgl px-4 py-12 md:px-8"><h2 className="text-3xl font-black uppercase">Become a stockist</h2><p className="mt-4 max-w-3xl leading-7">Run a bike shop, lifestyle store or community space? Tell us about your store, location, website and the SGL products you are interested in.</p><a href="mailto:hello@theseagulllabs.com?subject=Wholesale%20and%20retail%20partnership" className="mt-6 inline-block border border-sglInk bg-sglInk px-6 py-3 font-bold text-sglCream">Wholesale &amp; retail enquiries</a></div></div>
  </section>;
}
