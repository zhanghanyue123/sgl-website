import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images[0] || "/products/placeholder-bag.svg";
  const useInsetComposition = product.slug === "pin";

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block overflow-hidden border border-sglInk bg-sglPaper transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#111111]"
    >
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden border-b border-sglInk bg-[#ededeb]">
        <Image
          src={image}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className={useInsetComposition ? "object-contain p-8 mix-blend-darken" : "object-cover mix-blend-darken"}
        />
      </div>

      <div className="p-5">
        {product.soldOut && <p className="mb-3 inline-block border border-sglInk bg-sglInk px-3 py-1 text-xs font-black uppercase tracking-wide text-sglCream">Sold out</p>}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-60">
              {product.category}
            </p>

            <h3 className="mt-2 text-xl font-black leading-tight">
              {product.title}
            </h3>
          </div>

          <p className="shrink-0 whitespace-nowrap border border-sglInk bg-sglAcid px-3 py-1 text-sm font-black">
            $ {product.priceLabel}
          </p>
        </div>
      </div>
    </Link>
  );
}
