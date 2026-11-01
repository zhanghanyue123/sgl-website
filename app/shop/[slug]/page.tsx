import Link from "next/link";
import { pageMetadata, productDescription, productJsonLd, serializeJsonLd } from "@/lib/seo";
import ProductPurchase from "@/components/ProductPurchase";
import ProductGallery from "@/components/ProductGallery";
import { notFound } from "next/navigation";
import BuyButton from "@/components/BuyButton";
import { getProduct, storefrontProducts } from "@/data/products";

export function generateMetadata({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) return { title: "Product not found — SGL", robots: { index: false, follow: false } };
  return pageMetadata(`${product.title} — SGL Cycling & Lifestyle Goods`, productDescription(product), `/shop/${product.slug}`, product.images[0]);
}

export function generateStaticParams() {
  return storefrontProducts.map((product) => ({
    slug: product.slug
  }));
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);

  if (!product) {
    notFound();
  }


  const safeDetails = product.details.filter(
    (detail) =>
      !detail.toLowerCase().includes("shopify") &&
      !detail.toLowerCase().includes("imported") &&
      !detail.toLowerCase().includes("variant")
  );

  return (
    <section className="mx-auto grid max-w-sgl gap-10 px-4 py-16 md:grid-cols-[0.95fr_1.05fr] md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd(product)) }} />
      <ProductGallery images={product.images} title={product.title} />

      <div>
        <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
          {product.category}
        </p>

        <h1 className="mt-2 text-5xl font-black uppercase leading-none md:text-6xl">
          {product.title}
        </h1>

        <p className="mt-5 inline-block whitespace-nowrap border border-sglInk bg-sglAcid px-5 py-2 text-xl font-black">
          $ {product.priceLabel}
        </p>

        <p className="mt-8 max-w-3xl text-lg leading-8 opacity-80">
          {productDescription(product)}
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
          contact SGL staff. Prices are shown in USD. Delivery costs are confirmed separately.
        </p>
        <Link href="/shipping" className="mt-3 inline-block text-sm font-bold underline">Sales, shipping &amp; returns</Link>
      </div>
    </section>
  );
}
