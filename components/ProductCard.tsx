import Link from "next/link";
import type { Product } from "@/data/products";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images[0] || "/products/placeholder-bag.svg";

  return (
    <Link href={`/shop/${product.slug}`} className="group block overflow-hidden border border-sglInk bg-sglPaper transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#111111]">
      <div className="flex aspect-[4/5] items-center justify-center border-b border-sglInk bg-sglGraphite p-6">
        <img src={image} alt={product.title} className="h-full w-full object-contain mix-blend-normal" />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-60">{product.category}</p>
            <h3 className="mt-2 text-xl font-black leading-tight">{product.title}</h3>
          </div>
          <p className="border border-sglInk bg-sglAcid px-3 py-1 text-sm font-black">{product.priceLabel}</p>
        </div>
        {product.badge && <p className="mt-4 inline-block bg-sglInk px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sglCream">{product.badge}</p>}
      </div>
    </Link>
  );
}
