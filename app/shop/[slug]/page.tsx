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
        <div className="border border-sglInk bg-sglGraphite p-8">
          <img
            src={image}
            alt={product.title}
            className="aspect-square w-full object-contain"
          />
        </div>

        {product.images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {product.images.slice(0, 8).map((src) => (
              <div key={src} className="border border-sglInk bg-sglPaper p-2">
                <img
                  src={src}
                  alt={product.title}
                  className="aspect-square w-full object-contain"
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
          ¥ {product.priceLabel}
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

        {product.variants.length > 0 && (
          <div className="mt-8 border border-sglInk bg-sglPaper p-5">
            <h2 className="text-lg font-black uppercase">Options</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {product.variants.slice(0, 16).map((variant, index) => (
                <span
                  key={`${variant.sku}-${index}`}
                  className="border border-sglInk bg-sglCream px-3 py-2 text-xs font-bold"
                >
                  {variant.options.length > 0
                    ? variant.options.map((option) => option.value).join(" / ")
                    : variant.sku || `Option ${index + 1}`}
                </span>
              ))}
            </div>
          </div>
        )}

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