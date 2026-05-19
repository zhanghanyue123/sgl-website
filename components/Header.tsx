import Image from "next/image";
import Link from "next/link";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/station", label: "Station" },
  { href: "/events", label: "Events" },
  { href: "/universe", label: "Universe" },
  { href: "/about", label: "About" }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-sglInk bg-sglCream/95 backdrop-blur">
      <div className="mx-auto flex max-w-sgl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="relative block h-9 w-[150px] md:h-11 md:w-[185px]">
          <Image
            src="/sgl-logo.png"
            alt="Seagull Station"
            fill
            priority
            sizes="185px"
            className="object-contain object-left"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b border-transparent hover:border-sglInk"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}