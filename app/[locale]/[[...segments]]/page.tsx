import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventGallery from "@/components/EventGallery";
import Films from "@/components/Films";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchase from "@/components/ProductPurchase";
import CartPage from "@/app/cart/page";
import { getProduct, storefrontProducts } from "@/data/products";
import { absoluteUrl, productJsonLd, serializeJsonLd, stationJsonLd } from "@/lib/seo";
import { isLocale, languageAlternates, localizedPath, type Locale } from "@/lib/i18n";
import { localizedProduct, pageCopy } from "@/lib/localized-copy";

type LocalizedLocale = Exclude<Locale, "en">;
type PageProps = { params: { locale: string; segments?: string[] } };

const labels: Record<LocalizedLocale, Record<string, string>> = {
  "zh-CN": { shop: "商店", viewShop: "浏览商品", visit: "到访 Station", history: "品牌历程", current: "当前体验", calendar: "SGL 日历", exhibitions: "展会记录", characters: "认识角色", screens: "小程序体验", contact: "联系方式", address: "Station 地址", payment: "付款", delivery: "配送", returns: "退换与支持", items: "件商品", details: "产品详情", back: "返回商店", archive: "活动海报与历史档案", open: "联系 SGL" },
  "ja-JP": { shop: "ショップ", viewShop: "商品を見る", visit: "Stationへ", history: "ブランドの歩み", current: "現在の体験", calendar: "SGLカレンダー", exhibitions: "展示会の記録", characters: "キャラクター", screens: "ミニプログラム体験", contact: "お問い合わせ", address: "Station所在地", payment: "支払い", delivery: "配送", returns: "返品・サポート", items: "点", details: "商品詳細", back: "ショップへ戻る", archive: "イベントポスターとアーカイブ", open: "SGLへ連絡" },
  "ko-KR": { shop: "스토어", viewShop: "제품 보기", visit: "Station 방문", history: "브랜드 연혁", current: "현재 경험", calendar: "SGL 캘린더", exhibitions: "전시 기록", characters: "캐릭터 만나기", screens: "미니 프로그램 경험", contact: "문의", address: "Station 주소", payment: "결제", delivery: "배송", returns: "반품 및 지원", items: "개 제품", details: "제품 상세", back: "스토어로", archive: "이벤트 포스터와 아카이브", open: "SGL 문의" }
};

const timeline: Record<LocalizedLocale, { date: string; text: string }[]> = {
  "zh-CN": [
    { date: "2023.06.09", text: "The Seagull Labs 成立。" }, { date: "2025", text: "参加 ISPO Shanghai 与上海国际自行车展。" }, { date: "2025.10", text: "Seagull Station 在上海开始运营。" }, { date: "2026", text: "第二次参加上海自行车展。" }, { date: "2026.06", text: "SGL 微信小程序上线。" }, { date: "2027 年初", text: "AR 互动计划发布，具体时间取决于开发与测试。" }
  ],
  "ja-JP": [
    { date: "2023.06.09", text: "The Seagull Labs設立。" }, { date: "2025", text: "ISPO Shanghaiと上海国際自転車展に参加。" }, { date: "2025.10", text: "上海でSeagull Stationが営業開始。" }, { date: "2026", text: "上海自転車展へ2回目の出展。" }, { date: "2026.06", text: "SGL WeChatミニプログラム公開。" }, { date: "2027年初頭", text: "開発・テストを条件にAR体験の公開を予定。" }
  ],
  "ko-KR": [
    { date: "2023.06.09", text: "The Seagull Labs 설립." }, { date: "2025", text: "ISPO Shanghai와 상하이 국제 자전거 전시회 참가." }, { date: "2025.10", text: "상하이 Seagull Station 운영 시작." }, { date: "2026", text: "상하이 자전거 전시회 두 번째 참가." }, { date: "2026.06", text: "SGL WeChat 미니 프로그램 출시." }, { date: "2027년 초", text: "개발과 테스트를 전제로 AR 경험 공개 예정." }
  ]
};

const characterCopy: Record<LocalizedLocale, { name: string; text: string; image: string; alt: string }[]> = {
  "zh-CN": [
    { name: "Pickle", text: "好奇的小小探险家，把城市的每一个角落都看作新冒险的起点。", image: "/characters/pickle-riding.webp", alt: "Pickle 骑车穿行城市" },
    { name: "Fries", text: "活力十足、开朗快乐，走到哪里都带来乐趣、即兴和一点小混乱。", image: "/characters/fries.webp", alt: "Fries 穿着黑色 Sea Gull 服装走在 Seagull Station 外" },
    { name: "Oreo", text: "安静而善于观察的思考者，总能发现别人忽略的小细节。", image: "/characters/oreo-running.webp", alt: "Oreo 戴帽子在城市街头跑步" },
    { name: "Bagel", text: "温暖又可靠的伙伴，总能把大家聚在一起，让每个地方都有家的感觉。", image: "/characters/bagel-city.webp", alt: "Bagel 在城市街头" }
  ],
  "ja-JP": [
    { name: "Pickle", text: "街のどんな角も新しい冒険の始まりに変える、好奇心いっぱいの小さな探検家。", image: "/characters/pickle-riding.webp", alt: "街を自転車で走るPickle" },
    { name: "Fries", text: "元気で陽気。行く先々に楽しさと即興性、そして少しの騒動を運んできます。", image: "/characters/fries.webp", alt: "Seagull Stationの前を歩くFries" },
    { name: "Oreo", text: "静かで観察力に優れ、誰もが見落とす小さなことに気づく思索家。", image: "/characters/oreo-running.webp", alt: "街を走るOreo" },
    { name: "Bagel", text: "みんなを自然に集め、どんな場所も家のように感じさせる、温かく頼れる仲間。", image: "/characters/bagel-city.webp", alt: "街角のBagel" }
  ],
  "ko-KR": [
    { name: "Pickle", text: "도시의 모든 모퉁이를 새로운 모험의 시작으로 바라보는 호기심 많은 작은 탐험가입니다.", image: "/characters/pickle-riding.webp", alt: "도시를 자전거로 달리는 Pickle" },
    { name: "Fries", text: "활기차고 명랑하며 어디를 가든 재미와 즉흥성, 약간의 소동을 가져옵니다.", image: "/characters/fries.webp", alt: "Seagull Station 앞을 걷는 Fries" },
    { name: "Oreo", text: "조용하고 관찰력이 뛰어나 다른 이들이 놓치는 작은 것을 발견하는 사색가입니다.", image: "/characters/oreo-running.webp", alt: "도시 거리를 달리는 Oreo" },
    { name: "Bagel", text: "모두를 한자리에 모으고 어디든 집처럼 느끼게 하는 따뜻하고 믿음직한 동료입니다.", image: "/characters/bagel-city.webp", alt: "도시 거리의 Bagel" }
  ]
};

const calendarPosters = [
  { src: "/events/calendar/west-bund-cycling-festival.webp", alt: "SGL West Bund cycling festival poster", title: "West Bund · May 1–5, 2026", width: 1024, height: 1536 },
  { src: "/events/calendar/night-ride-beer.webp", alt: "SGL night ride and beer poster", title: "Night Ride & Beer · May 16", width: 1022, height: 1539 },
  { src: "/events/calendar/autumn-day.webp", alt: "SGL Autumn Day poster", title: "Autumn Day", width: 918, height: 1378 },
  { src: "/events/calendar/station-coffee-open.webp", alt: "SGL Station coffee poster", title: "Station Coffee · Archive", width: 1024, height: 1535 },
  { src: "/events/calendar/station-craft-beer-open.webp", alt: "SGL Station craft beer poster", title: "Station Craft Beer · Archive", width: 1024, height: 1536 }
];

function routeKey(segments: string[]) {
  if (!segments.length) return "home";
  if (segments[0] === "shop" && segments[1]) return "product";
  if (segments[0] === "checkout" && segments[1] === "success") return "success";
  return segments[0];
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (!isLocale(params.locale) || params.locale === "en") return {};
  const segments = params.segments || [];
  const key = routeKey(segments);
  const locale = params.locale as LocalizedLocale;
  const product = key === "product" ? getProduct(segments[1]) : undefined;
  const path = `/${segments.join("/")}`.replace(/\/$/, "") || "/";
  const base = pageCopy[locale][key === "product" ? "shop" : key];
  if (!base) return {};
  const title = product ? `${product.title}｜The Seagull Labs` : base.title;
  const description = product ? localizedProduct(product, locale).description : base.description;
  const alternates = languageAlternates(path);
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(localizedPath(path, locale)),
      languages: Object.fromEntries(Object.entries(alternates).map(([language, href]) => [language, absoluteUrl(href)]))
    },
    openGraph: { title, description, url: absoluteUrl(localizedPath(path, locale)), siteName: "The Seagull Labs", type: "website" }
  };
}

function Hero({ copy }: { copy: { eyebrow: string; heading: string; intro: string; secondary: string } }) {
  return <div className="border-b border-sglInk bg-sglInk text-sglCream"><div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24"><p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">{copy.eyebrow}</p><h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.94] md:text-6xl">{copy.heading}</h1><p className="mt-7 max-w-3xl text-lg leading-8 opacity-85">{copy.intro}</p><p className="mt-4 max-w-3xl leading-7 opacity-65">{copy.secondary}</p></div></div>;
}

function Home({ locale }: { locale: LocalizedLocale }) {
  const c = pageCopy[locale].home; const l = labels[locale];
  return <><Hero copy={c} /><section className="mx-auto grid max-w-sgl gap-6 px-4 py-16 md:grid-cols-2 md:px-8"><Image src="/station/seagull-sunset.webp" alt="Seagull Station" width={1672} height={941} className="h-full w-full border border-sglInk object-cover" /><div className="border border-sglInk bg-sglAcid p-8"><h2 className="text-4xl font-black uppercase">Seagull Station</h2><p className="mt-5 text-lg leading-8">{pageCopy[locale].station.intro}</p><Link href={localizedPath("/station", locale)} className="mt-8 inline-block border border-sglInk bg-sglInk px-6 py-3 font-black uppercase text-sglCream">{l.visit}</Link></div></section><section className="mx-auto max-w-sgl px-4 pb-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.shop}</h2><ProductCards locale={locale} products={storefrontProducts.slice(0, 8)} /></section></>;
}

function ProductCards({ locale, products }: { locale: LocalizedLocale; products: typeof storefrontProducts }) {
  return <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map((raw) => { const product = localizedProduct(raw, locale); return <Link key={product.slug} href={localizedPath(`/shop/${product.slug}`, locale)} className="overflow-hidden border border-sglInk bg-sglPaper transition hover:-translate-y-1"><div className="relative aspect-[4/5] border-b border-sglInk bg-sglGraphite"><Image src={product.images[0]} alt={product.title} fill sizes="25vw" className="object-contain p-6" /></div><div className="p-5"><h2 className="text-xl font-black">{product.title}</h2><p className="mt-3 text-sm leading-6 opacity-70">{product.description}</p><p className="mt-4 font-black">$ {product.priceLabel}</p></div></Link>; })}</div>;
}

function About({ locale }: { locale: LocalizedLocale }) { const c = pageCopy[locale].about; const l = labels[locale]; return <><Hero copy={c} /><section className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.history}</h2><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{timeline[locale].map(item => <article key={item.date} className="border border-sglInk bg-sglPaper p-5"><p className="font-black">{item.date}</p><p className="mt-3 leading-7">{item.text}</p></article>)}</div></section><section className="border-y border-sglInk bg-sglAcid"><div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-2 md:px-8"><figure><Image src="/events/calendar/one-year-anniversary.webp" alt="SGL one year anniversary" width={778} height={822} className="w-full border border-sglInk" /></figure><div className="flex items-center"><p className="text-xl leading-9">{c.intro}<br /><br />{c.secondary}</p></div></div></section></> }

function Shop({ locale }: { locale: LocalizedLocale }) { const c = pageCopy[locale].home; const l = labels[locale]; return <section className="mx-auto max-w-sgl px-4 py-12 md:px-8"><div className="relative overflow-hidden border border-sglInk bg-sglInk"><Image src="/products/shop-ride-banner.webp" alt="SGL rider with a bicycle" width={2000} height={1326} priority className="aspect-[2/1] w-full object-cover" /><h1 className="absolute bottom-6 left-6 text-5xl font-black uppercase text-sglCream">{l.shop}</h1></div><p className="mt-6 max-w-3xl text-lg leading-8">{c.intro}</p><p className="mt-3 opacity-65">USD · {pageCopy[locale].shipping.secondary}</p><ProductCards locale={locale} products={storefrontProducts} /></section> }

function ProductDetail({ locale, slug }: { locale: LocalizedLocale; slug: string }) { const raw = getProduct(slug); if (!raw || raw.hidden) notFound(); const product = localizedProduct(raw, locale); const l = labels[locale]; const path = localizedPath(`/shop/${slug}`, locale); return <section className="mx-auto max-w-sgl px-4 py-12 md:px-8"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd(product, path)) }} /><Link href={localizedPath("/shop", locale)} className="font-bold underline">← {l.back}</Link><div className="mt-8 grid gap-10 lg:grid-cols-2"><ProductGallery images={product.images} title={product.title} /><div><p className="text-sm font-black uppercase tracking-widest opacity-60">{product.category}</p><h1 className="mt-3 text-5xl font-black">{product.title}</h1><p className="mt-5 text-lg leading-8">{product.description}</p><h2 className="mt-8 text-xl font-black uppercase">{l.details}</h2><ul className="mt-4 list-disc space-y-2 pl-5">{product.details.map(item => <li key={item}>{item}</li>)}</ul><ProductPurchase product={product} /></div></div></section> }

function Station({ locale }: { locale: LocalizedLocale }) { const c = pageCopy[locale].station; const l = labels[locale]; const cards = locale === "zh-CN" ? ["咖啡与饮品", "零售商品", "骑行社群", "活动与聚会"] : locale === "ja-JP" ? ["コーヒーとドリンク", "リテールグッズ", "サイクリングコミュニティ", "イベントと集まり"] : ["커피와 음료", "리테일 굿즈", "사이클링 커뮤니티", "이벤트와 모임"]; const address = locale === "zh-CN" ? "上海市浦东新区锦延路东绣路广场 L1" : locale === "ja-JP" ? "中国・上海市浦東新区、錦延路と東繡路の交差点広場 L1" : "중국 상하이 푸둥신구 진옌로·둥슈로 광장 L1"; const path = localizedPath("/station", locale); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(stationJsonLd(path)) }} /><Image src="/station/seagull-sunset.webp" alt="Seagull Station" width={1672} height={941} priority className="mx-auto h-auto w-full max-w-sgl" /><Hero copy={c} /><section className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.current}</h2><div className="mt-8 grid gap-5 md:grid-cols-4">{cards.map(item => <article key={item} className="border border-sglInk bg-sglPaper p-6"><h3 className="text-2xl font-black">{item}</h3></article>)}</div><div className="mt-10 border border-sglInk bg-sglAcid p-6"><h2 className="text-2xl font-black uppercase">{l.address}</h2><p className="mt-4 text-lg">{address}</p></div></section></> }

function Events({ locale }: { locale: LocalizedLocale }) { const c = pageCopy[locale].events; const l = labels[locale]; return <><section className="bg-black"><div className="mx-auto max-w-sgl"><Films src="/videos/seagull.mp4" title="Seagull — New York" frameless /></div></section><Hero copy={c} /><section className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.calendar}</h2><p className="mt-4 max-w-3xl leading-7">{l.archive}</p><div className="mt-8"><EventGallery photos={calendarPosters} display="grid" /></div></section><section className="border-y border-sglInk bg-sglCream"><div className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">SGL on the road</h2><p className="mt-5 max-w-3xl text-lg leading-8">{c.secondary}</p><div className="mt-8"><EventGallery display="compact" photos={[{ src: "/events/ispo-shanghai.webp", alt: "SGL at ISPO Shanghai 2025", title: "ISPO Shanghai 2025", width: 1920, height: 1280 }]} /></div></div></section></> }

function Universe({ locale }: { locale: LocalizedLocale }) { const c = pageCopy[locale].universe; const l = labels[locale]; return <><Image src="/characters/sgl-birds-night.webp" alt="SGL character gathering" width={2400} height={800} className="w-full" /><Hero copy={c} /><section className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.characters}</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{characterCopy[locale].map(character => <article key={character.name} className="border border-sglInk bg-sglPaper p-4"><div className="relative aspect-[4/5] overflow-hidden border border-sglInk bg-sglGraphite"><Image src={character.image} alt={character.alt} fill sizes="25vw" className="object-cover" /></div><h3 className="mt-5 text-3xl font-black uppercase">{character.name}</h3><p className="mt-4 leading-7 opacity-80">{character.text}</p></article>)}</div></section></> }

function AppPage({ locale }: { locale: LocalizedLocale }) { const c = pageCopy[locale].app; const l = labels[locale]; const screens = ["map-v2-en.webp", "refuel-en.webp", "goods-en.webp", "missions-en.webp"]; return <><Hero copy={c} /><section className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.screens}</h2><div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">{screens.map((file, index) => <figure key={file}><div className="overflow-hidden rounded-[2rem] border border-sglInk bg-sglInk p-1.5"><Image src={`/app/${file}`} alt={`${l.screens} ${index + 1}`} width={850} height={1846} className="w-full rounded-[1.6rem]" /></div></figure>)}</div><p className="mt-10 leading-7">{c.secondary}</p></section></> }

function SimplePage({ locale, kind }: { locale: LocalizedLocale; kind: "contact" | "stockists" | "shipping" | "success" }) { const c = pageCopy[locale][kind]; const l = labels[locale]; const sections = kind === "shipping" ? [l.payment, l.delivery, l.returns] : kind === "success" ? [] : [l.contact, l.address, l.open]; return <><Hero copy={c} /><section className="mx-auto max-w-sgl px-4 py-16 md:px-8"><div className="grid gap-6 md:grid-cols-3">{sections.map((section, index) => <article key={section} className="border border-sglInk bg-sglPaper p-6"><h2 className="text-2xl font-black uppercase">{section}</h2><p className="mt-4 leading-7">{index === 0 ? "hello@theseagulllabs.com" : index === 1 ? "上海市浦东新区锦延路东绣路广场 L1" : c.secondary}</p></article>)}</div></section></> }

export default function LocalizedPage({ params }: PageProps) {
  if (!isLocale(params.locale) || params.locale === "en") notFound();
  const locale = params.locale as LocalizedLocale;
  const segments = params.segments || [];
  const key = routeKey(segments);
  if (key === "home") return <Home locale={locale} />;
  if (key === "about") return <About locale={locale} />;
  if (key === "shop") return <Shop locale={locale} />;
  if (key === "product") return <ProductDetail locale={locale} slug={segments[1]} />;
  if (key === "station") return <Station locale={locale} />;
  if (key === "events") return <Events locale={locale} />;
  if (key === "universe") return <Universe locale={locale} />;
  if (key === "app") return <AppPage locale={locale} />;
  if (key === "contact" || key === "stockists" || key === "shipping" || key === "success") return <SimplePage locale={locale} kind={key} />;
  if (key === "cart") return <CartPage />;
  notFound();
}
