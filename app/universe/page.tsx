import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import Films from "@/components/Films";

export const metadata = pageMetadata("SGL Universe — Original Characters, Stories & City Missions", "Meet Pickle, Fries, Oreo and Bagel in the SGL Universe, where original characters connect products, real places, city stories and experiences in development.", "/universe");


const characters = [
  {
    name: "Pickle",
    image: "/characters/pickle-riding.webp",
    imageAlt: "Pickle wearing a yellow beanie and riding a black bicycle through the city",
    imageClass: "object-cover object-center",
    role: "SGL Character",
    text: "A curious little explorer who sees every corner of the city as the beginning of a new adventure."
  },
  {
    name: "Fries",
    image: "/characters/fries.webp",
    imageAlt: "Fries walking outside Seagull Station in a black Sea Gull outfit",
    imageClass: "object-cover object-center",
    role: "SGL Character",
    text: "An energetic and cheerful spirit who brings fun, spontaneity, and a little chaos wherever they go."
  },
  {
    name: "Oreo",
    image: "/characters/oreo-running.webp",
    imageAlt: "Oreo, an SGL bird character in a brown cap, beige jacket and yellow shoes",
    imageClass: "object-cover object-center",
    role: "SGL Character",
    text: "A quiet, observant thinker who notices the little things everyone else overlooks."
  },
  {
    name: "Bagel",
    image: "/characters/bagel-city.webp",
    imageAlt: "Bagel wearing a beige jacket beside an SGL delivery vehicle in the city",
    imageClass: "object-cover object-center",
    role: "SGL Character",
    text: "A warm and dependable companion who brings everyone together and makes every place feel like home."
  }
];

const worldPoints = [
  "Station nodes · Live",
  "Park routes · Active",
  "Member cards · In development",
  "Check-in missions · In development",
  "Character rewards · In development",
  "AR story layers · In development for early 2027"
];

export default function UniversePage() {
  return (
    <section>
      <div data-content-section="universe.hero-image" className="border-b border-sglInk bg-sglInk">
        <Image
          src="/characters/sgl-birds-night.webp"
          alt="SGL bird characters gathering in a warmly lit city bar at night"
          width={2400}
          height={800}
          priority
          sizes="100vw"
          className="h-auto w-full"
        />
      </div>

      <div data-content-section="universe.hero" className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            SGL Universe
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] md:text-6xl">
            A playable world hidden inside everyday movement.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 opacity-80 md:text-xl">
            The SGL Universe grows from original characters, products, images,
            routes, events and real places in the city. Member journeys, city
            missions and AR interactions are the long-term product layer now
            being developed around that world.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/station"
              className="border border-sglAcid bg-sglAcid px-6 py-3 font-black uppercase tracking-wide text-sglInk"
            >
              Enter Station
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

      <div data-content-section="universe.film" className="border-b border-sglInk bg-black">
        <div className="mx-auto max-w-sgl">
          <Films
            src="/videos/universe-animation-preview.mp4"
            poster="/videos/universe-animation-preview.jpg"
            title="SGL Universe animation preview"
            frameless
            loop
          />
        </div>
      </div>

      <div id="meet-the-birds" data-content-section="universe.characters" className="mx-auto max-w-sgl scroll-mt-20 px-4 py-16 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
            Characters
          </p>

          <h2 className="mt-2 text-4xl font-black uppercase md:text-5xl">
            Meet the birds
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {characters.map((character) => (
            <div
              key={character.name}
              className="border border-sglInk bg-sglPaper p-4 transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#111111]"
            >
              <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden border border-sglInk bg-sglAcid">
                {character.image ? (
                  <Image
                    src={character.image}
                    alt={character.imageAlt || character.name}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                    className={character.imageClass}
                  />
                ) : (
                  <p className="text-7xl font-black uppercase">
                    {character.name.slice(0, 1)}
                  </p>
                )}
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] opacity-60">
                {character.role}
              </p>

              <h2 className="mt-2 text-3xl font-black uppercase">
                {character.name}
              </h2>

              {character.text && <p className="mt-4 leading-7 opacity-75">{character.text}</p>}

            </div>
          ))}
        </div>
      </div>

      <div data-content-section="universe.world-system" className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em]">
              World System
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">
              From characters to a real-world mini game.
            </h2>
          </div>

          <div className="space-y-5 text-lg leading-8">
            <p>
              The characters are original SGL IP, not decoration added to the
              Station. They carry stories across products, photography,
              exhibitions and real encounters in the city.
            </p>

            <p>
              The SGL WeChat Mini Program launched in June 2026. Character-led
              journeys continue to develop around it. AR interactions are
              currently in development, with a planned release in early 2027.
            </p>

          </div>
        </div>
      </div>

      <div data-content-section="universe.world-points" className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {worldPoints.map((point) => (
            <div
              key={point}
              className="border border-sglInk bg-sglCream px-5 py-4 text-xl font-black uppercase"
            >
              {point}
            </div>
          ))}
        </div>
      </div>

      <div data-content-section="universe.cta" className="border-t border-sglInk bg-sglGraphite text-sglCream">
        <div className="mx-auto flex max-w-sgl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
              In Development
            </p>

            <h2 className="mt-2 text-3xl font-black uppercase">
              Character pages, AR check-ins and member missions
            </h2>
          </div>

          <Link
            href="/shop"
            className="border border-sglAcid bg-sglAcid px-6 py-3 text-center font-black uppercase tracking-wide text-sglInk"
          >
            Shop Goods
          </Link>
        </div>
      </div>
    </section>
  );
}
