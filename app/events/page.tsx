import { pageMetadata } from "@/lib/seo";
import Films from "@/components/Films";
import Link from "next/link";
import Image from "next/image";

export const metadata = pageMetadata("SGL Events — Community Rides, Pop-ups & ISPO", "Explore SGL community ride formats, station gatherings and exhibition moments, including ISPO Shanghai. Watch our films and discover ways to meet the crew.", "/events");

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

export default function EventsPage() {
  return (
    <section>
      <div className="bg-black">
        <div className="mx-auto max-w-sgl"><Films /></div>
      </div>

      <div className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            SGL Events
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] md:text-8xl">
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

      <div id="ispo" className="border-b border-sglInk bg-sglCream">
        <figure className="mx-auto max-w-sgl px-4 py-12 md:px-8 md:py-16">
          <figcaption className="mb-6">
            <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
              Exhibition · Shanghai
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase md:text-6xl">
              SGL at ISPO
            </h2>
            <p className="mt-4 leading-7 opacity-75">ISPO 展会现场，与 SGL 相遇。</p>
          </figcaption>
          <Image
            src="/events/ispo-shanghai.webp"
            alt="ISPO 上海展会现场，观众聚集在 Sea Gull 展位前参观商品与角色展示"
            width={1920}
            height={1280}
            sizes="(max-width: 767px) 100vw, 1280px"
            className="h-auto w-full border border-sglInk"
          />
        </figure>
      </div>

      <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
            Event Formats
          </p>

          <h2 className="mt-2 text-4xl font-black uppercase md:text-6xl">
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

          <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
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
              Event calendar and route check-in system
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