import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";

export const metadata = pageMetadata("SGL App & Mini Program | Ride. Run. Refuel.", "Explore the SGL digital experience: station maps, refuel menus, city missions and everyday adventures. View English app and mini program previews.", "/app");


const screens = [
  { file: "map-en.webp", title: "Find your next stop.", label: "01 / Explore", text: "Discover the station, follow a city route and catch up with your crew.", alt: "English SGL Station map interface with a first-stop mission and friends feed" },
  { file: "refuel-en.webp", title: "A little refuel.", label: "02 / Refuel", text: "Coffee, drinks and a moment to pause. Browse the station menu between adventures.", alt: "English SGL refuel menu with drinks and illustrated station artwork" },
  { file: "goods-en.webp", title: "Take SGL with you.", label: "03 / Goods", text: "Explore station goods and house blends, with member pricing in view.", alt: "English SGL goods menu showing House Blend coffee and membership pricing" },
  { file: "missions-en.webp", title: "Make today a mission.", label: "04 / Missions", text: "A first check-in, a ride or a drink with friends. Small actions become part of your city story.", alt: "English SGL missions interface with activity mode and daily progress" }
];

export default function AppPage() {
  return (
    <>
      <section className="overflow-hidden border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto grid max-w-sgl items-center gap-12 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-24">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-sglAcid">SGL App &amp; Mini Program</p>
            <h1 className="mt-6 text-5xl font-black uppercase leading-[0.95] md:text-7xl">Your city.<br />Your next<br /><span className="text-sglAcid">small adventure.</span></h1>
            <p className="mt-7 max-w-lg text-lg leading-8 opacity-80">Ride. Run. Refuel. A digital companion for station stops, familiar faces and new routes through everyday life.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider">
              <span className="border border-sglCream/40 px-3 py-2">App concept</span>
              <span className="border border-sglCream/40 px-3 py-2">Mini program preview</span>
            </div>
            <p className="mt-4 text-sm opacity-60">A look at the experience in development.</p>
            <a href="#screens" className="mt-8 inline-block border border-sglAcid bg-sglAcid px-6 py-3 font-black uppercase text-sglInk">Explore the screens ↓</a>
          </div>
          <div className="mx-auto w-full max-w-[340px] rounded-[2.5rem] border border-white/25 bg-sglCream p-2 shadow-[16px_16px_0_#34383b]">
            <Image src="/app/story-en.webp" alt="English SGL city adventure concept with an illustrated route, checkpoints and Pickle" width={850} height={1846} sizes="(max-width: 767px) 85vw, 340px" priority className="h-auto w-full rounded-[2rem]" />
          </div>
        </div>
      </section>

      <section id="screens" className="scroll-mt-20 mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] opacity-60">Inside the mini program</p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-none md:text-6xl">From your screen<br />to the street.</h2>
          <p className="mt-5 text-lg leading-8 opacity-75">Four connected moments, built around the station. Explore the English interface previews below.</p>
        </div>
        <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 xl:grid-cols-4">
          {screens.map((screen) => (
            <figure key={screen.file} className="min-w-0">
              <div className="mx-auto max-w-[340px] overflow-hidden rounded-[2rem] border border-sglInk bg-sglInk p-1.5">
                <Image src={`/app/${screen.file}`} alt={screen.alt} width={850} height={1846} sizes="(max-width: 639px) 85vw, (max-width: 1279px) 40vw, 25vw" className="h-auto w-full rounded-[1.6rem]" />
              </div>
              <figcaption className="mt-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">{screen.label}</p>
                <h3 className="mt-3 text-2xl font-black uppercase leading-tight">{screen.title}</h3>
                <p className="mt-3 leading-7 opacity-75">{screen.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-10 text-sm opacity-60">Preview screens use sample content. Station menu prices shown in CNY.</p>
      </section>

      <section className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto grid max-w-sgl gap-8 px-4 py-12 md:grid-cols-2 md:px-8">
          <div><p className="text-sm font-black uppercase tracking-[0.2em]">The next chapter</p><h2 className="mt-3 text-4xl font-black uppercase">A story worth stepping into.</h2></div>
          <div><p className="text-lg leading-8">The app concept brings illustrated city stories and character-led missions to the same station experience. Follow Pickle, discover a new stop and make the journey your own.</p><Link href="/station" className="mt-6 inline-block border border-sglInk bg-sglInk px-6 py-3 font-black uppercase text-sglCream">Explore SGL Station</Link></div>
        </div>
      </section>
    </>
  );
}
