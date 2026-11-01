import { pageMetadata } from "@/lib/seo";
import EventGallery from "@/components/EventGallery";
import Films from "@/components/Films";
import Link from "next/link";
import Image from "next/image";

export const metadata = pageMetadata("SGL Events — Community Rides, Pop-ups & ISPO", "Explore SGL at ISPO Shanghai 2025 and the 2026 Shanghai International Bicycle Exhibition, plus community rides, outdoor pop-ups and gatherings at Seagull Station.", "/events");

const eventPhotos = [
  {
    "name": "cycle-show-2026-visitors",
    "width": 1600,
    "height": 1066,
    "title": "At the SGL booth",
    "alt": "Visitors exploring cycling accessories and apparel at the SGL booth at the 2026 Shanghai International Bicycle Exhibition"
  },
  {
    "name": "cycle-show-2026-booth",
    "width": 1600,
    "height": 1066,
    "title": "Goods, characters & cycling culture",
    "alt": "SGL cycling goods and character artwork displayed at the 2026 Shanghai International Bicycle Exhibition"
  },
  {
    "name": "station-community-ride",
    "width": 1600,
    "height": 1200,
    "title": "Meet at the station",
    "alt": "Cyclists gathering with their bicycles for a group photo outside Seagull Station"
  },
  {
    "name": "station-evening-gathering",
    "width": 1600,
    "height": 1067,
    "title": "Good company, after sunset",
    "alt": "Community gathering outside the illuminated Seagull Station in the evening"
  },
  {
    "name": "outdoor-pop-up",
    "width": 1600,
    "height": 2133,
    "title": "Out in the city",
    "alt": "Visitors browsing goods at an outdoor SGL pop-up stall"
  },
  {
    "name": "station-watch-night",
    "width": 1600,
    "height": 2030,
    "title": "A night at the station",
    "alt": "An evening football screening with a seated viewer at the station"
  },
{
  "name": "community-city-meetup",
  "width": 1200,
  "height": 704,
  "title": "Ready to ride",
  "alt": "Cyclists meeting with their bicycles in a city plaza"
},
{
  "name": "community-seagull-flags",
  "width": 1200,
  "height": 778,
  "title": "Flying the Sea Gull flag",
  "alt": "Blue and yellow Sea Gull pennants attached to parked bicycles"
},
{
  "name": "community-garden-popup",
  "width": 1200,
  "height": 1600,
  "title": "A day in the garden",
  "alt": "Visitors gathering around an SGL outdoor pop-up table in a leafy garden"
},
{
  "name": "community-city-rider",
  "width": 1200,
  "height": 1902,
  "title": "Small wheels, city adventures",
  "alt": "A cyclist riding a small-wheeled bicycle through a city plaza"
}
];

const events = [
  {
    type: "Park Loop",
    title: "Century Park Ride",
    date: "Community Ride",
    text: "A casual park loop for riders, families and friends. Start from the station, ride together, return for drinks and small rewards."
  },
  {
    type: "Night Ride",
    title: "Beer After Ride",
    date: "Evening Event",
    text: "A relaxed night ride format with drinks, station food, route sharing and community gathering after the ride."
  },
  {
    type: "Exhibition",
    title: "SGL Pop-up Station",
    date: "Seasonal",
    text: "Temporary station setups for exhibitions, markets and outdoor events, combining goods, drinks, IP characters and ride check-ins."
  }
];

const formats = [
  "Park loops",
  "Night rides",
  "Station parties",
  "Exhibition pop-ups",
  "Coffee rides",
  "Mini program missions"
];

const calendarPosters = [
  {
    src: "/events/calendar/west-bund-cycling-festival.webp",
    alt: "SGL poster for the West Bund cycling festival from May 1 to May 5, 2026",
    title: "West Bund · May 1–5, 2026",
    width: 1024,
    height: 1536
  },
  {
    src: "/events/calendar/china-cycle-show.webp",
    alt: "SGL poster for the China International Bicycle Exhibition from May 5 to May 8",
    title: "China Cycle Show · May 5–8",
    width: 1600,
    height: 2133
  },
  {
    src: "/events/calendar/night-ride-beer.webp",
    alt: "SGL night ride and beer gathering poster for May 16 at 6:30 PM",
    title: "Night Ride & Beer · May 16",
    width: 1022,
    height: 1539
  },
  {
    src: "/events/calendar/station-coffee-open.webp",
    alt: "SGL Station coffee open poster with three bird characters",
    title: "Station Coffee · Now Open",
    width: 1024,
    height: 1535
  },
  {
    src: "/events/calendar/station-craft-beer-open.webp",
    alt: "SGL Station craft beer open poster with three bird characters",
    title: "Station Craft Beer · Now Open",
    width: 1024,
    height: 1536
  }
];

export default function EventsPage() {
  return (
    <section>
      <div className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            SGL Events
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] md:text-6xl">
            Ride, drink, meet, check in.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 opacity-80 md:text-xl">
            SGL events connect city riding, park routes, coffee, drinks, station
            goods, exhibitions and future mini program missions.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 opacity-65 md:text-lg">
            活动不是单次热闹，而是 SGL Station 系统的现实入口：骑行、到站、
            补给、拍照、打卡、购买商品、认识朋友，最后都沉淀成社群和数据。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/station"
              className="border border-sglAcid bg-sglAcid px-6 py-3 font-black uppercase tracking-wide text-sglInk"
            >
              Visit Station
            </Link>

            <Link
              href="/shop"
              className="border border-sglCream px-6 py-3 font-black uppercase tracking-wide"
            >
              Shop Goods
            </Link>
          </div>
        </div>
      </div>

      <section id="exhibitions" className="scroll-mt-24 border-b border-sglInk bg-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-12 md:px-8 md:py-16">
          <p className="text-sm font-black uppercase tracking-[0.25em] opacity-60">Exhibitions · Shanghai</p>
          <h2 className="mt-3 text-4xl font-black uppercase md:text-5xl">SGL on the road</h2>
          <p className="mt-4 max-w-3xl leading-7 opacity-75">From ISPO Shanghai 2025 to the 2026 Shanghai International Bicycle Exhibition. Cycling goods, familiar characters and new faces.</p>
          <div className="mt-8">
            <EventGallery photos={[
              { src: "/events/ispo-shanghai.webp", alt: "Visitors at the Sea Gull booth at ISPO Shanghai 2025", title: "ISPO Shanghai 2025", width: 1920, height: 1280 },
              ...eventPhotos.slice(0, 2).map(photo => ({ src: `/events/${photo.name}.webp`, alt: photo.alt, title: `Shanghai International Bicycle Exhibition 2026 — ${photo.title}`, width: photo.width, height: photo.height }))
            ]} />
          </div>
        </div>
      </section>

      <section id="calendar" className="scroll-mt-24 border-b border-sglInk bg-sglPaper">
        <div className="mx-auto max-w-sgl px-4 py-12 md:px-8 md:py-16">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] opacity-60">Calendar · Anniversary · Night Ride</p>
              <h2 className="mt-3 text-4xl font-black uppercase md:text-5xl">SGL Calendar</h2>
            </div>
            <p className="max-w-2xl leading-7 opacity-75">Anniversary moments, night rides and the next reasons to meet at the station. New dates and routes are announced through SGL channels.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-12">
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

            <figure className="overflow-hidden border border-sglInk bg-black md:col-span-12">
              <Image src="/events/calendar/night-ride-shadow.webp" alt="A rider standing with a bicycle under a street light at night" width={1280} height={1930} sizes="(max-width: 767px) 100vw, 100vw" className="max-h-[720px] w-full object-cover object-center" />
              <figcaption className="border-t border-sglCream/30 px-5 py-4 text-sm font-black uppercase tracking-wide text-sglCream">After dark</figcaption>
            </figure>
          </div>

          <div className="mt-12 border-t border-sglInk pt-8">
            <p className="mb-5 text-sm font-black uppercase tracking-[0.25em] opacity-60">Posters · Dates · Station News</p>
            <EventGallery photos={calendarPosters} display="grid" />
          </div>
        </div>
      </section>

      <section id="community-moments" className="scroll-mt-24 border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-12 md:px-8 md:py-16">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-sglAcid">Rides · Pop-ups · Gatherings</p>
          <h2 className="mt-3 text-4xl font-black uppercase md:text-5xl">Community moments</h2>
          <p className="mt-4 max-w-3xl leading-7 opacity-75">From a ride with friends to an evening together. A few moments from life around SGL.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {eventPhotos.slice(2).map(photo => (
              <figure key={photo.name} className="overflow-hidden border border-sglCream/30">
                <Image src={`/events/${photo.name}.webp`} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 1023px) 50vw, 25vw" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="px-5 py-4 text-sm font-bold uppercase tracking-wide">{photo.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-sglInk bg-black text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-12 md:px-8 md:py-16">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs font-black uppercase tracking-[0.24em]">
            <span className="border border-sglAcid bg-sglAcid px-3 py-1 text-sglInk">SGL Film</span>
            <span>Story 001 — Shanghai</span>
          </div>
          <Films src="/videos/shanghai.mp4" title="Story 001 — Shanghai" />
        </div>
      </section>

      <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
            Event Formats
          </p>

          <h2 className="mt-2 text-4xl font-black uppercase md:text-5xl">
            What SGL can host
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {formats.map((item) => (
            <div
              key={item}
              className="border border-sglInk bg-sglAcid px-5 py-4 text-xl font-black uppercase"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="border-y border-sglInk bg-sglCream">
        <div className="mx-auto grid max-w-sgl gap-6 px-4 py-16 md:grid-cols-3 md:px-8">
          {events.map((event) => (
            <div key={event.title} className="border border-sglInk bg-sglPaper p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                {event.type}
              </p>

              <h2 className="mt-3 text-3xl font-black uppercase leading-tight">
                {event.title}
              </h2>

              <p className="mt-2 inline-block border border-sglInk bg-sglAcid px-3 py-1 text-xs font-black uppercase tracking-wide">
                {event.date}
              </p>

              <p className="mt-5 leading-7 opacity-75">{event.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-[0.95fr_1.05fr] md:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
            Event System
          </p>

          <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">
            Every event becomes a route, a story and a member touchpoint.
          </h2>
        </div>

        <div className="space-y-5 text-lg leading-8 opacity-80">
          <p>
            The first version can stay simple: posters, event pages, route
            announcements and station check-ins. Later, each event can connect to
            the mini program with registration, member points and route missions.
          </p>

          <p>
            第一阶段只需要把活动发布、路线说明、到站消费和社群沉淀跑起来。
            第二阶段再接入小程序，实现报名、积分、打卡、奖励和活动数据记录。
          </p>
        </div>
      </div>

      <div className="border-t border-sglInk bg-sglGraphite text-sglCream">
        <div className="mx-auto flex max-w-sgl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
              Coming Soon
            </p>

            <h2 className="mt-2 text-3xl font-black uppercase">
              Route announcements and check-ins
            </h2>
          </div>

          <Link
            href="/universe"
            className="border border-sglAcid bg-sglAcid px-6 py-3 text-center font-black uppercase tracking-wide text-sglInk"
          >
            Meet the Characters
          </Link>
        </div>
      </div>
    </section>
  );
}
