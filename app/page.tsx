import { pageMetadata } from "@/lib/seo";
import Films from "@/components/Films";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { events } from "@/data/events";
import { storefrontProducts } from "@/data/products";

export const metadata = pageMetadata("The Seagull Labs (SGL) — Urban Lifestyle & Cycling", "Discover The Seagull Labs: cycling accessories, lifestyle goods, Shanghai station life and community adventures. Ride, refuel and explore with SGL.", "/");


export default function Home() {
  return (
    <div>
      <section className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto grid max-w-sgl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-24">
          <div>
            <p className="mb-5 inline-block border border-sglAcid px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-sglAcid">
              Urban riding / Station goods / Small adventures
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.92] tracking-tight md:text-8xl">
              Seagull Station keeps the city moving.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 opacity-85 md:text-xl">
              SGL is a city station for riding, coffee, light food, daily goods,
              community events and playful check-in missions. A small stop for
              people moving through parks, streets and everyday routes.
            </p>

            <p className="mt-5 max-w-2xl text-base leading-7 opacity-70 md:text-lg">
              城市里的骑行补给站。从公园路线、咖啡、轻食、商品到打卡任务，
              SGL 把日常运动变成一套可以被参与的生活系统。
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

          <div className="border border-sglCream bg-sglGraphite p-6">
            <div className="flex aspect-square flex-col justify-between border border-dashed border-sglCream/50 bg-sglInk p-6">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
                  Station System
                </p>
                <h2 className="mt-4 text-4xl font-black uppercase leading-none md:text-6xl">
                  Goods,
                  <br />
                  rides,
                  <br />
                  coffee,
                  <br />
                  routes.
                </h2>
              </div>

              <div>
                <p className="text-5xl">✦</p>
                <p className="mt-4 text-2xl font-black uppercase">
                  {storefrontProducts.length} goods online
                </p>
                <p className="mt-2 max-w-sm text-sm uppercase tracking-[0.2em] opacity-70">
                  Bags / socks / caps / station goods / riding accessories
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
              Shop
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase md:text-6xl">
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

        <ProductGrid limit={8} />
      </section>

      <section className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-3 md:px-8">
          <div className="md:col-span-1">
            <p className="text-sm font-black uppercase tracking-[0.28em]">
              Station
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase">
              A small stop for the city.
            </h2>
            <p className="mt-5 leading-7">
              咖啡、轻食、骑行补给、社群活动和未来的小程序任务系统，
              都从这个 Station 开始。
            </p>
          </div>

          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            <div className="border border-sglInk bg-sglCream p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
                01
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase">Ride</h3>
              <p className="mt-2 leading-7 opacity-80">
                Park loops, city routes, night rides and check-in missions.
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
                Characters, tasks, maps and a future real-world mini game.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
            Events
          </p>
          <h2 className="mt-2 text-4xl font-black uppercase md:text-6xl">
            Ride, drink, meet.
          </h2>
        </div>

        <div className="mb-8"><Films /></div>

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