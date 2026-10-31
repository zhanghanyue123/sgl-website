import { storefrontProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";

export default function ProductGrid({ limit }: { limit?: number }) {
  const list = typeof limit === "number" ? storefrontProducts.slice(0, limit) : storefrontProducts;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
