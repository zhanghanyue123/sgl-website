import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-sglInk bg-sglInk text-sglCream">
      <div className="mx-auto grid max-w-sgl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            Seagull Station
          </p>

          <h2 className="mt-3 max-w-xl text-3xl font-black uppercase leading-tight">
            Urban riding, station goods and small adventures.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-6 opacity-70">
            SGL is a city station for riding, coffee, light food, goods,
            events, characters and future check-in missions.
          </p>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-sglAcid">
            Explore
          </p>

          <div className="mt-4 grid gap-2 text-sm font-bold uppercase">
            <Link href="/shop">Shop</Link>
            <Link href="/station">Station</Link>
            <Link href="/events">Events</Link>
            <Link href="/universe">Universe</Link>
            <Link href="/app">App &amp; Mini Program</Link>
            <Link href="/about">About</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-sglAcid">
            Contact
          </p>

          <div className="mt-4 grid gap-2 text-sm font-bold uppercase">
            <Link href="/contact">Contact SGL</Link>
            <a href="mailto:hello@theseagulllabs.com">
              hello@theseagulllabs.com
            </a>
            <a href="https://www.youtube.com/@seagulllabs" target="_blank" rel="noopener noreferrer">YouTube: @seagulllabs</a>
            <a
              href="https://www.instagram.com/seagulllabs"
              target="_blank"
              rel="noreferrer"
            >
              Instagram: @seagulllabs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}