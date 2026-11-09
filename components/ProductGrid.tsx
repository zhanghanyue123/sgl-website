import { storefrontProducts, type Product } from "@/data/products";
import { splitIntoProductRows } from "@/lib/product-layout";
import ProductCard from "@/components/ProductCard";

export default function ProductGrid({ limit, products = storefrontProducts }: { limit?: number; products?: readonly Product[] }) {
  const list = typeof limit === "number" ? products.slice(0, limit) : products;
  const rows = splitIntoProductRows(list);

  return (
    <div className="grid gap-6" data-product-row-group="true">
      {rows.map((row, rowIndex) => (
        <div key={row[0]?.slug ?? rowIndex} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" data-product-row={rowIndex + 1}>
          {row.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ))}
    </div>
  );
}
