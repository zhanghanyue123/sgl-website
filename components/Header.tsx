import Image from "next/image";
import Link from "next/link";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/station", label: "Station" },
  { href: "/events", label: "Events" },
  { href: "/universe", label: "Universe" },
  { href: "/app", label: "App" },
  { href: "/about", label: "About" }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-sglInk bg-sglCream/95 backdrop-blur">
      <div className="mx-auto grid max-w-sgl grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr] px-4 py-3 md:px-8">
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

        <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
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
        <Link href="/cart" aria-label="Shopping cart" title="Shopping cart" className="flex h-11 w-11 items-center justify-center justify-self-end rounded-full transition hover:bg-sglAcid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
            <path d="M3 3h2l2.4 12h11.2l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" />
          </svg>
        </Link>
      </div>
      <nav aria-label="Mobile navigation" className="grid grid-cols-6 gap-1 text-center border-t border-sglInk/10 px-2 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide lg:hidden">
        {nav.map((item) => <Link key={item.href} href={item.href} className="shrink-0 py-1">{item.label}</Link>)}
      </nav>
    </header>
  );
}