import ProductPurchase from "@/components/ProductPurchase";
import Image from "next/image";
import { notFound } from "next/navigation";
import BuyButton from "@/components/BuyButton";
import { getProduct, products } from "@/data/products";

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug
  }));
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const image = product.images[0] || "/products/placeholder-bag.svg";

  const safeDetails = product.details.filter(
    (detail) =>
      !detail.toLowerCase().includes("shopify") &&
      !detail.toLowerCase().includes("imported") &&
      !detail.toLowerCase().includes("variant")
  );

  return (
    <section className="mx-auto grid max-w-sgl gap-10 px-4 py-16 md:grid-cols-[0.95fr_1.05fr] md:px-8">
      <div>
        <div className="relative aspect-square border border-sglInk bg-sglGraphite p-8">
          <Image
            src={image}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-8"
          />
        </div>

        {product.images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {product.images.slice(0, 8).map((src) => (
              <div
                key={src}
                className="relative aspect-square border border-sglInk bg-sglPaper p-2"
              >
                <Image
                  src={src}
                  alt={product.title}
                  fill
                  sizes="25vw"
                  className="object-contain p-2"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
          {product.category}
        </p>

        <h1 className="mt-2 text-5xl font-black uppercase leading-none md:text-7xl">
          {product.title}
        </h1>

        <p className="mt-5 inline-block border border-sglInk bg-sglAcid px-5 py-2 text-xl font-black">
          $ {product.priceLabel}
        </p>

        <p className="mt-8 max-w-3xl text-lg leading-8 opacity-80">
          {product.description}
        </p>

        {safeDetails.length > 0 && (
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {safeDetails.map((detail) => (
              <div
                key={detail}
                className="border border-sglInk bg-sglPaper px-4 py-3 text-sm font-bold"
              >
                {detail}
              </div>
            ))}
          </div>
        )}

        <ProductPurchase product={product} />

        <div className="mt-8">
          <BuyButton product={product} />
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-6 opacity-55">
          For current stock, pickup, custom requests or product details, please
          contact SGL staff.
        </p>
      </div>
    </section>
  );
}