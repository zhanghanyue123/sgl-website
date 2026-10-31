import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";

export const metadata = pageMetadata("SGL Universe — Characters, Stories & City Adventures", "Meet Pickle, Fries, Oreo and Bagel in the SGL Universe. Explore characters, illustrated stories and small adventures inspired by everyday city life.", "/universe");


const characters = [
  {
    name: "Pickle",
    image: "/characters/pickle-riding.webp",
    imageAlt: "Pickle wearing a yellow beanie and riding a black bicycle through the city",
    imageClass: "object-contain bg-sglInk",
    role: "The Rocker",
    text: "Tall, stubborn and free. Pickle represents the rider who keeps moving, refuses to be tamed, and always finds another route through the city.",
    cn: "瘦高、固执、自由。Pickle 代表那个一直在城市里移动、不愿被驯服、总能找到另一条路的骑行者。"
  },
  {
    name: "Fries",
    image: "/characters/fries.webp",
    imageAlt: "薯条 Fries，穿着黑色 Sea Gull 上衣的白色小鸟",
    imageClass: "object-contain bg-white p-4",
    role: "薯条",
    text: "",
    cn: ""
  },
  {
    name: "Oreo",
    image: "/characters/oreo-running.webp",
    imageAlt: "奥利奥 Oreo，戴棕色帽子、穿米色外套和黄色运动鞋在街头跑步",
    imageClass: "object-cover object-center",
    role: "奥利奥",
    text: "",
    cn: ""
  },
  {
    name: "Bagel",
    image: "/characters/bagel-city.webp",
    imageAlt: "贝果 Bagel，穿着米色外套的喜鹊倚在城市街头的 SGL 配送车旁",
    imageClass: "object-contain bg-sglInk",
    role: "贝果 · The City Courier",
    text: "A magpie with a city map in mind and a delivery always on the way. Bagel connects the stations, streets and everyday stories of SGL.",
    cn: "脑海里装着城市地图，脚步里带着下一站的消息。喜鹊贝果穿梭街巷，把 SGL 的 Station 和日常故事连接起来。"
  }
];

const worldPoints = [
  "Station nodes",
  "Park routes",
  "Member cards",
  "Check-in missions",
  "Character rewards",
  "Mini program stories"
];

export default function UniversePage() {
  return (
    <section>
      <div className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            SGL Universe
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] md:text-8xl">
            A playable world hidden inside everyday movement.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 opacity-80 md:text-xl">
            SGL is not only a station or a product brand. It is a small universe
            built from characters, routes, check-ins, member cards, goods,
            events and real places in the city.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 opacity-65 md:text-lg">
            SGL 的世界观不是虚构在屏幕里的，而是藏在真实城市里：
            你会在路线、Station、商品、角色、会员卡和任务系统中一点点进入它。
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

      <div className="border-b border-sglInk bg-sglInk">
        <Image
          src="/characters/sgl-birds-night.webp"
          alt="SGL 鸟儿们在城市酒吧相聚的夜晚，暖色灯光下的角色群像"
          width={2400}
          height={800}
          sizes="100vw"
          className="h-auto w-full"
        />
      </div>

      <div id="meet-the-birds" className="mx-auto max-w-sgl scroll-mt-20 px-4 py-16 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
            Characters
          </p>

          <h2 className="mt-2 text-4xl font-black uppercase md:text-6xl">
            Meet the birds
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {characters.map((character) => (
            <div
              key={character.name}
              className="border border-sglInk bg-sglPaper p-6 transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#111111]"
            >
              <div className="relative flex aspect-[2/3] items-center justify-center overflow-hidden border border-sglInk bg-sglAcid">
                {character.image ? (
                  <Image
                    src={character.image}
                    alt={character.imageAlt || character.name}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
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

              <h2 className="mt-2 text-4xl font-black uppercase">
                {character.name}
              </h2>

              {character.text && <p className="mt-4 leading-7 opacity-75">{character.text}</p>}

              {character.cn && <p className="mt-4 leading-7 opacity-60">{character.cn}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em]">
              World System
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
              From characters to a real-world mini game.
            </h2>
          </div>

          <div className="space-y-5 text-lg leading-8">
            <p>
              The characters are not only visual mascots. They can become member
              card types, task guides, reward systems, product lines and story
              anchors inside the SGL mini program.
            </p>

            <p>
              Pickle、汤圆和 Pizza 不只是 IP 形象。它们可以对应不同的会员卡、
              任务路线、商品系列、打卡奖励和 Station 故事，让用户在真实城市里
              参与一个轻量的开放世界。
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
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

      <div className="border-t border-sglInk bg-sglGraphite text-sglCream">
        <div className="mx-auto flex max-w-sgl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
              Coming Next
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