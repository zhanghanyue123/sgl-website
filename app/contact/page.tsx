import Link from "next/link";

const contactItems = [
  {
    title: "Order / Product Inquiry",
    value: "hello@theseagulllabs.com",
    text: "For product availability, overseas orders, collaborations and station pickup."
  },
  {
    title: "WeChat",
    value: "seagulllabs",
    text: "Add us on WeChat for current stock, pickup, custom requests and local events."
  },
  {
    title: "Instagram",
    value: "@seagulllabs",
    text: "Follow SGL updates, events, station moments and new product drops."
  },
  {
    title: "Station",
    value: "Seagull Station",
    text: "Coffee, drinks, light food, goods, rides and community events."
  }
];

export default function ContactPage() {
  return (
    <section>
      <div className="border-b border-sglInk bg-sglInk text-sglCream">
        <div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            Contact SGL
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] md:text-8xl">
            Orders, pickup, events and collaborations.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 opacity-80 md:text-xl">
            Contact Seagull Station for product orders, station pickup, event
            collaborations, wholesale inquiries and community rides.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 opacity-65 md:text-lg">
            如需购买商品、确认库存、门店自提、活动合作、品牌联名或社群骑行合作，
            可以通过以下方式联系 SGL。
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-sgl gap-6 px-4 py-16 md:grid-cols-2 md:px-8">
        {contactItems.map((item) => (
          <div key={item.title} className="border border-sglInk bg-sglPaper p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
              {item.title}
            </p>

            <h2 className="mt-3 break-words text-3xl font-black uppercase leading-tight">
              {item.value}
            </h2>

            <p className="mt-5 leading-7 opacity-75">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="border-y border-sglInk bg-sglAcid">
        <div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em]">
              Fast Order
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
              Send product name, color and quantity.
            </h2>
          </div>

          <div className="space-y-5 text-lg leading-8">
            <p>
              For quick orders, please send the product name, color, size,
              quantity, delivery location and preferred payment method.
            </p>

            <p>
              快速下单请发送：商品名称、颜色/尺码、数量、收货地区、是否需要门店自提。
              我们会确认库存后回复付款与发货方式。
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="border border-sglInk bg-sglCream p-6 md:col-span-2">
            <p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">
              Collaboration
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase">
              Events, pop-ups, station projects and brand collaborations
            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 opacity-75">
              SGL is open to community rides, pop-up stations, exhibition
              activations, product collaborations and city lifestyle projects.
            </p>
          </div>

          <div className="border border-sglInk bg-sglGraphite p-6 text-sglCream">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
              Quick Links
            </p>

            <div className="mt-5 grid gap-3">
              <Link
                href="/shop"
                className="border border-sglCream px-5 py-3 text-center font-black uppercase"
              >
                Shop Goods
              </Link>

              <Link
                href="/station"
                className="border border-sglCream px-5 py-3 text-center font-black uppercase"
              >
                Visit Station
              </Link>

              <Link
                href="/events"
                className="border border-sglAcid bg-sglAcid px-5 py-3 text-center font-black uppercase text-sglInk"
              >
                View Events
              </Link>
            </div>
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

          <a
            href="https://www.instagram.com/seagulllabs"
            target="_blank"
            rel="noreferrer"
            className="border border-sglAcid bg-sglAcid px-6 py-3 text-center font-black uppercase tracking-wide text-sglInk"
          >
            Instagram @seagulllabs
          </a>
        </div>
      </div>
    </section>
  );
}