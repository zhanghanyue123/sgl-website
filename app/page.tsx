import { pageMetadata } from "@/lib/seo";
import Films from "@/components/Films";
import Link from "next/link";
import Image from "next/image";
import ProductGrid from "@/components/ProductGrid";
import { events } from "@/data/events";
import { storefrontProducts } from "@/data/products";

export const metadata = pageMetadata("The Seagull Labs — Cycling Goods, Station Life & City Stories", "Discover SGL products, cycling culture, photography, characters, Seagull Station and community life in Shanghai.", "/");


export default function Home() {
  return (
    <div>
      <section data-content-section="home.hero" className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto grid max-w-sgl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-24">
          <div>
            <p className="mb-5 inline-block border border-sglAcid px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-sglAcid">
              Urban riding / Station goods / Small adventures
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.92] tracking-tight md:text-6xl">
              Seagull Station keeps the city moving.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 opacity-85 md:text-xl">
              The Seagull Labs brings together product design, cycling culture,
              photography, original characters and a real Shanghai Station for
              coffee, drinks, goods and community life. City missions and AR
              interactions carry that world into its next chapter.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="border border-sglAcid bg-sglAcid px-6 py-3 font-black uppercase tracking-wide text-sglInk"
              >
                Shop Goods
              </Link>

              <Link
                href="/station"
                className="border border-sglCream px-6 py-3 font-black uppercase tracking-wide"
              >
                Visit Station
              </Link>

              <Link
                href="/events"
                className="border border-sglCream px-6 py-3 font-black uppercase tracking-wide"
              >
                Join Ride
              </Link>
            </div>
          </div>

          <div className="border border-sglCream bg-sglGraphite p-3 md:p-4">
            <div className="overflow-hidden border border-sglCream/60 bg-[#e4cca0]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/home/wheel-deal.webp"
                  alt="Wheel Deal Seagull cycling illustration"
                  fill
                  sizes="(max-width: 767px) 100vw, 42vw"
                  className="object-contain"
                  priority
                />
                <p className="absolute left-4 top-4 border border-sglInk bg-sglAcid px-3 py-2 text-xs font-black uppercase tracking-[0.24em] text-sglInk md:left-5 md:top-5">
                  Station System
                </p>
              </div>

              <div className="grid gap-5 border-t border-sglCream/60 bg-sglInk p-5 text-sglCream md:grid-cols-[1fr_auto] md:items-end md:p-6">
                <div>
                  <h2 className="text-3xl font-black uppercase leading-[0.95] md:text-4xl">
                    Goods, rides,<br />coffee, routes.
                  </h2>
                  <p className="mt-4 max-w-md text-xs uppercase leading-5 tracking-[0.18em] opacity-65">
                    Bags / socks / caps / station goods / riding accessories
                  </p>
                </div>

                <div className="flex items-end gap-3 md:block md:text-right">
                  <p className="text-5xl font-black leading-none text-sglAcid">
                    {storefrontProducts.length}
                  </p>
                  <p className="pb-1 text-xs font-black uppercase tracking-[0.18em] md:mt-2 md:pb-0">
                    Goods online
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-content-section="home.shop" className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
              Shop
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase md:text-5xl">
              Station goods
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 opacity-70">
              Everyday products for city riding, park loops, station stops and
              small adventures.
            </p>
          </div>

          <Link href="/shop" className="border-b border-sglInk font-black uppercase">
            View all
          </Link>
        </div>

        <ProductGrid limit={9} />
      </section>

      <section data-content-section="home.station" className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-3 md:px-8">
          <div className="md:col-span-1">
            <p className="text-sm font-black uppercase tracking-[0.28em]">
              Station
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase">
              A small stop for the city.
            </h2>
            <p className="mt-5 leading-7">
              Coffee, drinks, riding essentials, community events and city missions
              all begin at Seagull Station.
            </p>
          </div>

          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            <div className="border border-sglInk bg-sglCream p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
                01
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase">Ride</h3>
              <p className="mt-2 leading-7 opacity-80">
                Park loops, city routes, night rides and shared time on two wheels.
              </p>
            </div>

            <div className="border border-sglInk bg-sglCream p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
                02
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase">Refuel</h3>
              <p className="mt-2 leading-7 opacity-80">
                Coffee, drinks, light food and station-style supplies.
              </p>
            </div>

            <div className="border border-sglInk bg-sglCream p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
                03
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase">Play</h3>
              <p className="mt-2 leading-7 opacity-80">
                Original characters, city missions and AR interactions now in development.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section data-content-section="home.events" className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
            Events
          </p>
          <h2 className="mt-2 text-4xl font-black uppercase md:text-5xl">
            Ride, drink, meet.
          </h2>
        </div>

        <div className="mb-8 border border-sglInk bg-black text-sglCream">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs font-black uppercase tracking-[0.24em] md:px-6">
            <span className="border border-sglAcid bg-sglAcid px-3 py-1 text-sglInk">SGL Film</span>
            <span>Story 001 — Shanghai</span>
          </div>
          <Films src="/videos/shanghai.mp4" title="Story 001 — Shanghai" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {events.map((event) => (
            <div key={event.title} className="border border-sglInk bg-sglCream p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
                {event.date}
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase">
                {event.title}
              </h3>
              <p className="mt-2 leading-7 opacity-80">{event.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
