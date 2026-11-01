import Image from "next/image";
import { pageMetadata } from "@/lib/seo";
import ProductCard from "@/components/ProductCard";
import { categories, getProductsByCategory } from "@/data/products";

export const metadata = pageMetadata("Shop Cycling Accessories & Lifestyle Goods — SGL", "Explore SGL bicycles, cycling accessories, bags, apparel, coffee and lifestyle goods. Browse USD prices and contact SGL for availability.", "/shop");


const categoryLabels = {
  "BIKES / FRAMES": "Frames",
  "BAGS & CARRY": "Bags & Carry",
  "WEAR & RIDE": "Wear & Ride",
  "ACCESSORIES": "Accessories",
  "STATION GOODS": "Station Goods"
} as const;

export default function ShopPage() {
  return (
    <section className="mx-auto max-w-sgl px-4 pb-16 pt-6 md:px-8 md:pt-8">
      <div className="relative isolate overflow-hidden border border-sglInk bg-sglInk text-sglCream">
        <Image src="/products/shop-ride-banner.webp" alt="Black and white photograph of a rider with a bicycle beside a city railing" width={2000} height={1326} priority sizes="(max-width: 767px) 100vw, 1280px" className="aspect-[2/1] w-full object-cover object-bottom" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 p-3 sm:p-6 md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.28em]">SGL Goods</p>
          <h1 className="mt-2 text-4xl font-black uppercase sm:text-5xl md:text-6xl">Shop</h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest sm:mt-3 sm:text-sm md:text-base">Made for everyday movement.</p>
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-lg leading-8 opacity-75">
        SGL goods for city riding, park loops, station stops and everyday
        movement. Explore bicycles, bags, wearables, coffee and small accessories made for
        the routes between work, parks, cafés and home.
      </p>

      <p className="mt-3 max-w-3xl text-base leading-7 opacity-60">
        Prices are shown in USD. Contact SGL to confirm current stock, product
        options, payment arrangements, delivery or Station pickup.
      </p>

      <div className="mt-10 grid gap-12">
        {categories.map((category, index) => {
          const categoryProducts = getProductsByCategory(category);
          const label =
            categoryLabels[category as keyof typeof categoryLabels] || category;

          return (
            <div key={category}>
              <div className="mb-5 flex items-center gap-4">
                <h2 className="text-2xl font-black uppercase">
                  {label}
                </h2>

                <div className="h-px flex-1 bg-sglInk/30" />

                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">
                  {categoryProducts.length} items
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>

              {index === 1 && (
                <figure className="mt-12 grid overflow-hidden border border-sglInk bg-sglPaper text-sglInk md:grid-cols-[0.7fr_1.3fr]">
                  <figcaption className="flex flex-col justify-between gap-8 p-6 md:p-10">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] opacity-60">After Dark</p>
                      <h3 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">Night routes.<br />Small wheels.</h3>
                    </div>
                    <p className="max-w-sm text-sm uppercase tracking-[0.18em] opacity-65">Ride after sunset. Refuel at the station.</p>
                  </figcaption>
                  <Image src="/events/calendar/night-ride-shadow.webp" alt="A rider standing with a bicycle beneath a street light at night" width={1280} height={1930} sizes="(max-width: 767px) 100vw, 65vw" className="max-h-[760px] w-full object-cover object-center" />
                </figure>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
