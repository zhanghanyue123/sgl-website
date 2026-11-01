import Image from "next/image";
import { pageMetadata } from "@/lib/seo";
import ProductCard from "@/components/ProductCard";
import { categories, getProductsByCategory } from "@/data/products";

export const metadata = pageMetadata("Shop Cycling Accessories & Lifestyle Goods — SGL", "Explore SGL cycling accessories, bags, apparel and lifestyle goods. Browse product details and USD prices, and contact our team for availability.", "/shop");


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
        <Image src="/products/shop-ride-banner.webp" alt="Black and white photograph of a rider with a bicycle beside a city railing" width={2000} height={1326} priority sizes="(max-width: 767px) 100vw, 1280px" className="h-[340px] w-full object-cover object-center md:h-[480px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.28em]">SGL Goods</p>
          <h1 className="mt-2 text-6xl font-black uppercase md:text-8xl">Shop</h1>
          <p className="mt-3 text-sm font-bold uppercase tracking-widest md:text-base">Made for everyday movement.</p>
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-lg leading-8 opacity-75">
        SGL goods for city riding, park loops, station stops and everyday
        movement. Explore frames, bags, wearables and small accessories made for
        the routes between work, parks, cafés and home.
      </p>

      <p className="mt-3 max-w-3xl text-base leading-7 opacity-60">
        城市骑行、日常补给、Station 停靠与轻量出行用品。商品购买入口将陆续接入
        淘宝、小程序与门店客服。
      </p>

      <div className="mt-10 grid gap-12">
        {categories.map((category) => {
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
            </div>
          );
        })}
      </div>
    </section>
  );
}