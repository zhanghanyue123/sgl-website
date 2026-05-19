import type { Product } from "@/data/products";

export default function BuyButton({ product }: { product: Product }) {
  const links = [
    { label: "Buy Now", href: product.temporaryShopifyUrl },
    { label: "Taobao", href: product.buyLinks.taobao },
    { label: "Mini Program", href: product.buyLinks.miniProgram },
    { label: "Contact Staff", href: product.buyLinks.contact }
  ].filter((item) => item.href);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map((link, index) => (
        <a
          key={link.label}
          href={link.href}
          className={
            index === 0
              ? "border border-sglInk bg-sglAcid px-5 py-3 text-center text-sm font-black uppercase tracking-wide transition hover:-translate-y-0.5"
              : "border border-sglInk bg-sglPaper px-5 py-3 text-center text-sm font-black uppercase tracking-wide transition hover:-translate-y-0.5"
          }
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}