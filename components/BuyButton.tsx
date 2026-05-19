import type { Product } from "@/data/products";

export default function BuyButton({ product }: { product: Product }) {
  const buyLinks = product.buyLinks as {
    stripe?: string;
    taobao?: string;
    miniProgram?: string;
    contact?: string;
  };

  const links = [
    { label: "Buy Now", href: buyLinks.stripe },
    { label: "Taobao", href: buyLinks.taobao },
    { label: "Mini Program", href: buyLinks.miniProgram },
    { label: "Contact Staff", href: buyLinks.contact || "/contact" }
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