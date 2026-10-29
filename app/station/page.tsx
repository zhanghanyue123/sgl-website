import Image from "next/image";
import Link from "next/link";

const stationBlocks = [
  {
    number: "01",
    title: "Coffee & Drinks",
    text: "Coffee, craft drinks, seasonal specials and simple refuel options for riders, park visitors and nearby communities."
  },
  {
    number: "02",
    title: "Light Food",
    text: "Sandwiches, fries, small plates and station-style food made for quick stops, casual gatherings and event days."
  },
  {
    number: "03",
    title: "Ride Support",
    text: "A city-friendly stop for cyclists: water, rest, repair basics, route information and community ride support."
  },
  {
    number: "04",
    title: "Check-in System",
    text: "Future mini program missions, park loops, member points, route check-ins and playful station-based tasks."
  }
];

export default function StationPage() {
  return (
    <section>
      <div className="border-b border-sglInk bg-sglInk">
        <div className="mx-auto max-w-sgl">
          <Image
            src="/station/seagull-sunset.webp"
            alt="Seagull characters gathering at the SeaGull Labs coffee station in warm sunset light"
            width={1672}
            height={941}
            priority
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="h-auto w-full"
          />
        </div>
      </div>
      <div className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            Seagull Station
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] md:text-8xl">
            A small stop for people moving through the city.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 opacity-80 md:text-xl">
            SGL Station is a city refuel point combining riding culture, coffee,
            light food, station goods, events and future mini program missions.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 opacity-65 md:text-lg">
            SGL 是城市里的骑行补给站。它不是单纯的咖啡店，也不是普通零售空间，
            而是一个可以停靠、补给、见面、打卡和参与任务的城市节点。
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

      <div className="mx-auto grid max-w-sgl gap-6 px-4 py-16 md:grid-cols-4 md:px-8">
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

      <div className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em]">
              Station Logic
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
              From one store to a playable city network.
            </h2>
          </div>

          <div className="space-y-5 text-lg leading-8">
            <p>
              The first station is the physical anchor. Around it, SGL can build
              park rides, member cards, product drops, food and drink menus,
              route check-ins and seasonal events.
            </p>

            <p>
              这也是小程序和未来 App 的现实入口：用户不是只在线上点开一个页面，
              而是真的在城市里移动、到站、消费、打卡、领取奖励。
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="border border-sglInk bg-sglCream p-6 md:col-span-2">
            <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
              Future System
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase">
              Mini Program / Membership / Missions
            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 opacity-75">
              The Station page will later connect to the SGL mini program:
              ordering, membership points, ride check-ins, route missions,
              product rewards and event registration.
            </p>
          </div>

          <div className="border border-sglInk bg-sglGraphite p-6 text-sglCream">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
              Coming Next
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
    </section>
  );
}