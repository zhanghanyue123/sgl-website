import { pageMetadata, serializeJsonLd, stationJsonLd, STATION_CLUB_HOUSE_IMAGE, STATION_HERO_IMAGE } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";

export const metadata = pageMetadata("Seagull Station Shanghai — Coffee, Rides & Community", "Visit Seagull Station in Pudong, Shanghai: an operating gathering place for coffee, drinks, SGL goods, cycling culture and community events.", "/station", STATION_HERO_IMAGE);


const stationPhotos = [
  {
    "name": "evening-refuel",
    "title": "Evening refuel",
    "alt": "A chilled SGL drink on an outdoor table at night",
    "width": 1200,
    "height": 1601
  },
  {
    "name": "on-tap",
    "title": "On tap",
    "alt": "A golden drink held beneath the station taps",
    "width": 1200,
    "height": 1800
  },
  {
    "name": "at-the-counter",
    "title": "At the counter",
    "alt": "A guest holding an SGL cup at the station counter",
    "width": 1200,
    "height": 1800
  },
  {
    "name": "fresh-pour",
    "title": "A fresh pour",
    "alt": "A drink being poured from a station tap",
    "width": 1200,
    "height": 1800
  },
  {
    "name": "little-pause",
    "title": "A little pause",
    "alt": "An SGL drink held in the warm station light",
    "width": 1200,
    "height": 1750
  },
  {
    "name": "cheers-together",
    "title": "Better together",
    "alt": "Friends raising their SGL drinks together",
    "width": 1200,
    "height": 1800
  }
];

const stationLocationPhotos = [
  {
    src: STATION_CLUB_HOUSE_IMAGE,
    title: "Station Club House · Shanghai",
    alt: "Sea Gull Station Club House cafe storefront and community patio in warm golden light",
    status: "Current Station",
    address: "China, Shanghai, Pudong New Area, Jinyan Road & Dongxiu Road Plaza, L1",
    width: 1448,
    height: 1086
  }
];

const stationBlocks = [
  {
    number: "01",
    title: "Coffee & Drinks",
    text: "Coffee, craft drinks, seasonal specials and simple refuel options for riders, park visitors and nearby communities."
  },
  {
    number: "02",
    title: "Retail Goods",
    text: "A physical place to discover SGL bicycles, bags, apparel, accessories and Station goods. Confirm current availability before visiting."
  },
  {
    number: "03",
    title: "Cycling Community",
    text: "A meeting point for riders, friends and nearby communities, shaped by everyday movement through the city."
  },
  {
    number: "04",
    title: "Events & Gatherings",
    text: "Community rides, exhibitions, pop-ups and Station gatherings bring SGL culture into shared physical experiences."
  }
];

export default function StationPage() {
  return (
    <section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(stationJsonLd()) }} />
      <div data-content-section="station.hero-image" className="border-b border-sglInk bg-sglInk">
        <div className="mx-auto max-w-sgl">
          <Image
            src={STATION_HERO_IMAGE}
            alt="Seagull characters gathering at the SeaGull Labs coffee station in warm sunset light"
            width={1672}
            height={941}
            priority
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="h-auto w-full"
          />
        </div>
      </div>
      <div data-content-section="station.hero" className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            Seagull Station
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] md:text-6xl">
            A small stop for people moving through the city.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 opacity-80 md:text-xl">
            Seagull Station is a real Shanghai meeting point shaped by riding
            culture, coffee, beverages, SGL goods and community events. It is
            also the physical anchor for the SGL WeChat Mini Program and digital
            experiences that continue to develop.
          </p>

          <p className="mt-4 max-w-3xl font-bold leading-7 text-sglAcid">
            China, Shanghai, Pudong New Area, Jinyan Road &amp; Dongxiu Road Plaza, L1
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="border border-sglAcid bg-sglAcid px-6 py-3 font-black uppercase tracking-wide text-sglInk"
            >
              Shop Goods
            </Link>

            <Link
              href="/events"
              className="border border-sglCream px-6 py-3 font-black uppercase tracking-wide"
            >
              View Events
            </Link>
          </div>
        </div>
      </div>

      <section id="station-life" data-content-section="station.station-life" className="scroll-mt-24 border-b border-sglInk bg-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] opacity-60">Station life</p>
          <h2 className="mt-3 text-4xl font-black uppercase md:text-5xl">Pause. Refuel. Stay a while.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 opacity-75">Warm lights, a fresh pour and good company. A closer look at everyday moments at Seagull Station.</p>
          <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">
            {stationPhotos.map(photo => <figure key={photo.name} className="mb-6 break-inside-avoid overflow-hidden border border-sglInk bg-sglPaper">
              <Image src={`/station/${photo.name}.webp`} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="h-auto w-full" />
              <figcaption className="px-5 py-4 text-sm font-bold uppercase tracking-wide">{photo.title}</figcaption>
            </figure>)}
          </div>
        </div>
      </section>

      <div data-content-section="station.offerings" className="mx-auto grid max-w-sgl gap-6 px-4 py-16 md:grid-cols-4 md:px-8">
        {stationBlocks.map((item) => (
          <div key={item.title} className="border border-sglInk bg-sglPaper p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
              {item.number}
            </p>

            <h2 className="mt-3 text-2xl font-black uppercase leading-tight">
              {item.title}
            </h2>

            <p className="mt-4 leading-7 opacity-75">{item.text}</p>
          </div>
        ))}
      </div>

      <div data-content-section="station.station-logic" className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em]">
                Station Logic
              </p>

              <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">
                A real station, an expanding city network.
              </h2>
            </div>

            <div className="space-y-5 text-lg leading-8">
              <p>
                Seagull Station is the physical anchor: a place to stop, drink,
                shop, meet and begin a ride. Products, photographs, events and
                community life all pass through this real location.
              </p>

              <p>
                The SGL WeChat Mini Program launched in June 2026 and extends that
                physical foundation through digital member journeys. AR
                interactions are currently in development, with a planned release
                in early 2027.
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-sglInk pt-12">
            {stationLocationPhotos.map((photo, index) => <figure key={photo.src} className="mx-auto grid w-full max-w-5xl overflow-hidden border border-sglInk bg-sglPaper md:grid-cols-[1.35fr_0.65fr]">
              <div className="relative aspect-[4/3] w-full overflow-hidden md:aspect-auto md:min-h-[420px]">
                <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 767px) 100vw, 65vw" className="object-cover" />
              </div>
              <figcaption className="flex min-h-52 flex-col justify-between gap-8 border-t border-sglInk p-6 md:border-l md:border-t-0 md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.24em] opacity-60">{String(index + 1).padStart(2, "0")} / {photo.status}</p>
                <div>
                  <h3 className="text-3xl font-black uppercase leading-tight">{photo.title}</h3>
                  <p className="mt-4 leading-7 opacity-70">{photo.address}</p>
                </div>
              </figcaption>
            </figure>)}
          </div>
        </div>
      </div>

      <div data-content-section="station.mini-program" className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="border border-sglInk bg-sglCream p-6 md:col-span-2">
            <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
              Live since June 2026
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase">
              Mini Program / Membership / Missions
            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 opacity-75">
              The SGL WeChat Mini Program is live. Individual functions shown in
              previews may still be in development; AR interactions are planned
              for early 2027, subject to development and testing.
            </p>
          </div>

          <div className="border border-sglInk bg-sglGraphite p-6 text-sglCream">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
              Product Direction
            </p>

            <ul className="mt-5 space-y-3 font-bold uppercase">
              <li>01 / Menu</li>
              <li>02 / Station Map</li>
              <li>03 / Member Card</li>
              <li>04 / Route Check-in</li>
              <li>05 / Event Calendar</li>
            </ul>
          </div>
        </div>
      </div>

      <section data-content-section="station.station-stories" className="border-t border-sglInk bg-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div className="md:pb-4">
              <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">Station Network</p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-none">Meet at the station.</h2>
              <p className="mt-5 max-w-md leading-7 opacity-70">Future Station locations will connect SGL communities across cities. For now, meet us at Station Club House in Shanghai.</p>
            </div>
            <Image
              src="/characters/station-three-birds.webp"
              alt="Three SGL bird characters sharing drinks outside Seagull Station"
              width={1122}
              height={1402}
              sizes="(max-width: 767px) 100vw, 52vw"
              className="max-h-[620px] w-full border border-sglInk object-contain"
            />
          </div>
        </div>
      </section>
    </section>
  );
}
