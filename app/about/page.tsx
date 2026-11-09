import { pageMetadata, STATION_BIKE_STUDIO_IMAGE } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";

export const metadata = pageMetadata("About The Seagull Labs — Products, Images & Cycling Culture", "Explore the SGL story through product development, photography, exhibitions, cycling culture, overseas activity, original characters and Seagull Station.", "/about");


const principles = [
  {
    title: "Move through the city",
    text: "SGL starts from everyday movement: cycling, walking, park loops, coffee stops and small routes between places."
  },
  {
    title: "Build from real places",
    text: "Real places are the physical anchor. Products, events, characters and future missions grow from encounters in the city."
  },
  {
    title: "Make daily life playable",
    text: "SGL develops narrative experiences that connect riding, meeting, collecting and checking in with a wider character world."
  }
];

const milestones = [
  { date: "June 9, 2023", text: "The Seagull Labs was founded." },
  { date: "2025", text: "SGL joined ISPO Shanghai and the Shanghai International Bicycle Exhibition." },
  { date: "October 2025", text: "Seagull Station began operating in Shanghai." },
  { date: "2026", text: "SGL returned to the Shanghai International Bicycle Exhibition for a second time." },
  { date: "June 2026", text: "The SGL WeChat Mini Program launched." },
  { date: "Early 2027", text: "AR interactions are planned for release, subject to development and testing." }
];

export default function AboutPage() {
  return (
    <section>
      <div data-content-section="about.hero" className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            About SGL
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] md:text-6xl">
            Built through products, images, rides and real places.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 opacity-80 md:text-xl">
            Founded on June 9, 2023, SGL grew from original products, images and
            cycling culture into exhibitions, a physical Shanghai Station and a
            launched WeChat Mini Program. Original characters and narrative
            experiences continue that journey into city missions and AR.
          </p>

        </div>
      </div>

      <section data-content-section="about.history" className="border-b border-sglInk bg-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">SGL History</p>
          <h2 className="mt-3 text-4xl font-black uppercase md:text-5xl">From products to a connected city world.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {milestones.map((milestone) => (
              <article key={milestone.date} className="border border-sglInk bg-sglPaper p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em]">{milestone.date}</p>
                <p className="mt-3 leading-7">{milestone.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div data-content-section="about.principles" className="mx-auto grid max-w-sgl gap-6 px-4 py-16 md:grid-cols-3 md:px-8">
        {principles.map((item, index) => (
          <div key={item.title} className="border border-sglInk bg-sglPaper p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
              0{index + 1}
            </p>

            <h2 className="mt-3 text-3xl font-black uppercase leading-tight">
              {item.title}
            </h2>

            <p className="mt-5 leading-7 opacity-75">{item.text}</p>
          </div>
        ))}
      </div>

      <div data-content-section="about.brand-structure" className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em]">Brand Structure</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">
              A physical home and an expanding story world.
            </h2>
            <p className="mt-6 text-lg leading-8">
              Rooted in original products, images and cycling culture, SGL takes physical form at SGL Bike Studio · Shanghai, where bicycles, apparel and riding goods come together. Seagull Station extends that real-world foundation into drinks, rides, events and community life.
            </p>
          </div>

          <figure className="mt-10 overflow-hidden border border-sglInk bg-sglPaper">
            <Image
              src={STATION_BIKE_STUDIO_IMAGE}
              alt="SGL Bike Studio showroom in Shanghai with bicycles, apparel and riding goods"
              width={1671}
              height={941}
              sizes="(max-width: 1023px) 100vw, 960px"
              className="h-auto w-full object-cover"
            />
            <figcaption className="border-t border-sglInk px-5 py-4 text-center text-sm font-black uppercase tracking-wide">
              SGL Bike Studio · Shanghai
            </figcaption>
          </figure>
        </div>
      </div>

      <section data-content-section="about.media" className="border-y border-sglInk bg-sglPaper">
        <div className="mx-auto grid max-w-sgl gap-4 px-4 py-16 md:grid-cols-12 md:px-8">
          <figure className="overflow-hidden border border-sglInk bg-sglCream md:col-span-4">
            <Image src="/events/calendar/one-year-anniversary.webp" alt="SGL one year anniversary cycling illustration" width={778} height={822} sizes="(max-width: 767px) 100vw, 34vw" className="aspect-[4/5] w-full object-cover" />
            <figcaption className="border-t border-sglInk px-5 py-4 text-sm font-black uppercase tracking-wide">One year anniversary</figcaption>
          </figure>

          <figure className="overflow-hidden border border-sglInk bg-black md:col-span-8">
            <video className="aspect-video w-full object-cover" src="/videos/night-ride-loop.mp4" poster="/events/calendar/night-ride-shadow.webp" aria-label="SGL night ride film" autoPlay muted loop playsInline controls preload="metadata">
              Your browser does not support embedded video.
            </video>
            <figcaption className="border-t border-sglCream/30 px-5 py-4 text-sm font-black uppercase tracking-wide text-sglCream">Night ride film</figcaption>
          </figure>
        </div>
      </section>

      <div data-content-section="about.directions" className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border border-sglInk bg-sglCream p-6">
            <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
              What We Make
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase">
              Products for movement
            </h2>

            <p className="mt-5 text-lg leading-8 opacity-75">
              Bicycles, bags, socks, caps, riding accessories and Station goods
              developed for movement, use and life between destinations.
            </p>
          </div>

          <div className="border border-sglInk bg-sglGraphite p-6 text-sglCream">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
              What We Build
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase">
              A story world in development
            </h2>

            <p className="mt-5 text-lg leading-8 opacity-75">
              The WeChat Mini Program has been live since June 2026. Original
              characters, member journeys and route check-ins continue to grow
              around it. AR interactions are currently in development, with a
              planned release in early 2027.
            </p>
          </div>
        </div>
      </div>

      <div data-content-section="about.cta" className="border-t border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto flex max-w-sgl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
              Seagull Station
            </p>

            <h2 className="mt-2 text-3xl font-black uppercase">
              Keep the city moving.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/station"
              className="border border-sglAcid bg-sglAcid px-6 py-3 text-center font-black uppercase tracking-wide text-sglInk"
            >
              Visit Station
            </Link>

            <Link
              href="/shop"
              className="border border-sglCream px-6 py-3 text-center font-black uppercase tracking-wide"
            >
              Shop Goods
            </Link>
          </div>
        </div>
      </div>

    </section>
  );
}
