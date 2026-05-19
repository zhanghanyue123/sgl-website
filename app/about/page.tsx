import Link from "next/link";

const principles = [
  {
    title: "Move through the city",
    text: "SGL starts from everyday movement: cycling, walking, park loops, coffee stops and small routes between places."
  },
  {
    title: "Build from real places",
    text: "The Station is the anchor. Products, events, characters and future missions all grow from real city nodes."
  },
  {
    title: "Make daily life playable",
    text: "SGL turns simple actions — riding, checking in, buying a drink, meeting friends — into a light real-world game."
  }
];

export default function AboutPage() {
  return (
    <section>
      <div className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            About SGL
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] md:text-8xl">
            Seagull Station is a city system for small adventures.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 opacity-80 md:text-xl">
            SGL began as a product and riding culture project, then gradually
            grew into a station-based lifestyle system: goods, coffee, light
            food, events, characters, routes and future mini program missions.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 opacity-65 md:text-lg">
            SGL 不是一个单纯卖商品的品牌。它更像一个城市里的小型系统：
            你可以在这里买东西、喝咖啡、补给、集合、参加活动、完成打卡，
            然后逐渐进入一个由角色、路线和任务组成的现实世界。
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-sgl gap-6 px-4 py-16 md:grid-cols-3 md:px-8">
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

      <div className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em]">
              Brand Structure
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
              Goods, station, community and future app.
            </h2>
          </div>

          <div className="space-y-5 text-lg leading-8">
            <p>
              SGL goods are the objects people can carry. The Station is the
              physical place where people gather. Events create repeated reasons
              to return. The mini program connects routes, members, check-ins
              and rewards.
            </p>

            <p>
              商品是入口，Station 是节点，活动是流量，角色是记忆点，
              小程序是未来的系统层。它们共同组成 SGL 的城市生活方式网络。
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border border-sglInk bg-sglCream p-6">
            <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
              What We Make
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase">
              Products for movement
            </h2>

            <p className="mt-5 text-lg leading-8 opacity-75">
              Bags, socks, caps, riding accessories, station goods and future
              seasonal drops made for city routes, park loops and everyday
              stops.
            </p>
          </div>

          <div className="border border-sglInk bg-sglGraphite p-6 text-sglCream">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
              What We Build
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase">
              A playable city layer
            </h2>

            <p className="mt-5 text-lg leading-8 opacity-75">
              Station nodes, member cards, character missions, route check-ins,
              events and future app systems that make the city feel more alive.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-sglInk bg-sglInk text-sglCream">
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