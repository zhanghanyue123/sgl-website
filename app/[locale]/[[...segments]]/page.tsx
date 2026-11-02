import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventGallery from "@/components/EventGallery";
import Films from "@/components/Films";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchase from "@/components/ProductPurchase";
import CartPage from "@/app/cart/page";
import { categories, getProduct, getProductsByCategory, storefrontProducts } from "@/data/products";
import { absoluteUrl, productJsonLd, serializeJsonLd, stationJsonLd } from "@/lib/seo";
import { languageAlternates, localizedPath, localeFromSegment, type Locale } from "@/lib/i18n";
import { localizedProduct, pageCopy } from "@/lib/localized-copy";
import { localizedRichCopy } from "@/lib/localized-rich-copy";
import { sectionMarker, type PublicPage } from "@/lib/content-schema";
import { getSectionCopy } from "@/lib/localized-sections";

type LocalizedLocale = Exclude<Locale, "en">;
type PageProps = { params: Promise<{ locale: string; segments?: string[] }> };

const labels: Record<LocalizedLocale, Record<string, string>> = {
  "zh-CN": { shop: "商店", viewShop: "浏览商品", visit: "到访 Station", history: "品牌历程", current: "当前体验", calendar: "SGL 日历", exhibitions: "展会记录", characters: "认识角色", screens: "小程序体验", contact: "联系方式", address: "Station 地址", payment: "付款", delivery: "配送", returns: "退换与支持", items: "件商品", details: "产品详情", back: "返回商店", archive: "活动海报与历史档案", open: "联系 SGL", soldOut: "售罄" },
  "ja-JP": { shop: "ショップ", viewShop: "商品を見る", visit: "Stationへ", history: "ブランドの歩み", current: "現在の体験", calendar: "SGLカレンダー", exhibitions: "展示会の記録", characters: "キャラクター", screens: "ミニプログラム体験", contact: "お問い合わせ", address: "Station所在地", payment: "支払い", delivery: "配送", returns: "返品・サポート", items: "点", details: "商品詳細", back: "ショップへ戻る", archive: "イベントポスターとアーカイブ", open: "SGLへ連絡", soldOut: "売り切れ" },
  "ko-KR": { shop: "스토어", viewShop: "제품 보기", visit: "Station 방문", history: "브랜드 연혁", current: "현재 경험", calendar: "SGL 캘린더", exhibitions: "전시 기록", characters: "캐릭터 만나기", screens: "미니 프로그램 경험", contact: "문의", address: "Station 주소", payment: "결제", delivery: "배송", returns: "반품 및 지원", items: "개 제품", details: "제품 상세", back: "스토어로", archive: "이벤트 포스터와 아카이브", open: "SGL 문의", soldOut: "품절" },
  "it-IT": { shop: "Negozio", viewShop: "Scopri i prodotti", visit: "Visita la Station", history: "Storia del brand", current: "Esperienza attuale", calendar: "Calendario SGL", exhibitions: "SGL in viaggio", characters: "Incontra i personaggi", screens: "Esperienza Mini Program", contact: "Contatti", address: "Indirizzo della Station", payment: "Pagamento", delivery: "Spedizione", returns: "Resi e assistenza", items: "prodotti", details: "Dettagli del prodotto", back: "Torna al negozio", archive: "Poster e archivio degli eventi", open: "Contatta SGL", soldOut: "Esaurito" }
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
  ],
  "it-IT": [
    { date: "09.06.2023", text: "Nasce The Seagull Labs." }, { date: "2025", text: "Partecipazione a ISPO Shanghai e alla China Cycle di Shanghai." }, { date: "10.2025", text: "Seagull Station apre a Shanghai." }, { date: "2026", text: "Seconda partecipazione alla fiera della bicicletta di Shanghai." }, { date: "06.2026", text: "Lancio del Mini Program WeChat SGL." }, { date: "Inizio 2027", text: "Uscita prevista delle interazioni AR, soggetta a sviluppo e test." }
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
  ],
  "it-IT": [
    { name: "Pickle", text: "Un piccolo esploratore curioso, per cui ogni angolo della città è l’inizio di una nuova avventura.", image: "/characters/pickle-riding.webp", alt: "Pickle attraversa la città in bicicletta" },
    { name: "Fries", text: "Energico e solare, porta ovunque divertimento, spontaneità e un pizzico di caos.", image: "/characters/fries.webp", alt: "Fries cammina davanti alla Seagull Station" },
    { name: "Oreo", text: "Silenzioso e attento, nota i piccoli dettagli che sfuggono a tutti gli altri.", image: "/characters/oreo-running.webp", alt: "Oreo corre per le strade della città" },
    { name: "Bagel", text: "Un compagno affettuoso e affidabile, capace di riunire tutti e far sentire ogni luogo come casa.", image: "/characters/bagel-city.webp", alt: "Bagel in una strada della città" }
  ]
};

const universeWorldCopy: Record<LocalizedLocale, { paragraphs: [string, string]; points: string[] }> = {
  "zh-CN": {
    paragraphs: [
      "这些角色是 SGL 的原创 IP，并非添加到 Station 的装饰。它们的故事贯穿商品、摄影、展览，以及城市里的真实相遇。",
      "SGL 微信小程序已于 2026 年 6 月上线，围绕角色展开的旅程仍在持续发展。AR 互动目前正在开发中，计划于 2027 年初发布。"
    ],
    points: ["Station 节点 · 已上线", "公园路线 · 运行中", "会员卡 · 开发中", "打卡任务 · 开发中", "角色奖励 · 开发中", "AR 故事层 · 计划于 2027 年初推出"]
  },
  "ja-JP": {
    paragraphs: [
      "キャラクターはStationに添えた装飾ではなく、SGLのオリジナルIPです。プロダクト、写真、展示、そして街で生まれる実際の出会いを通して物語を紡ぎます。",
      "SGL WeChatミニプログラムは2026年6月に公開されました。キャラクターと歩く体験は今も広がっています。ARインタラクションは開発中で、2027年初頭の公開を予定しています。"
    ],
    points: ["Station拠点 · 稼働中", "公園ルート · 稼働中", "メンバーカード · 開発中", "チェックインミッション · 開発中", "キャラクター報酬 · 開発中", "ARストーリー · 2027年初頭に向けて開発中"]
  },
  "ko-KR": {
    paragraphs: [
      "이 캐릭터들은 Station에 덧붙인 장식이 아니라 SGL의 오리지널 IP입니다. 제품과 사진, 전시, 그리고 도시에서의 실제 만남을 따라 이야기를 이어 갑니다.",
      "SGL WeChat 미니 프로그램은 2026년 6월 출시되었습니다. 캐릭터와 함께하는 여정은 계속 확장되고 있으며, AR 인터랙션은 2027년 초 공개를 목표로 개발 중입니다."
    ],
    points: ["Station 거점 · 운영 중", "공원 루트 · 운영 중", "멤버 카드 · 개발 중", "체크인 미션 · 개발 중", "캐릭터 리워드 · 개발 중", "AR 스토리 · 2027년 초 공개 목표"]
  },
  "it-IT": {
    paragraphs: [
      "I personaggi sono IP originali SGL, non decorazioni aggiunte alla Station. Le loro storie attraversano prodotti, fotografia, mostre e incontri reali in città.",
      "Il Mini Program WeChat SGL è attivo da giugno 2026. I percorsi guidati dai personaggi continuano a evolversi. Le interazioni AR sono in sviluppo, con uscita prevista per l’inizio del 2027."
    ],
    points: ["Nodi Station · Attivi", "Percorsi nei parchi · Attivi", "Member card · In sviluppo", "Missioni check-in · In sviluppo", "Ricompense dei personaggi · In sviluppo", "Storie AR · In sviluppo per l’inizio del 2027"]
  }
};

const calendarPosters = [
  { src: "/events/calendar/west-bund-cycling-festival.webp", alt: "SGL West Bund cycling festival poster", title: "West Bund · May 1–5, 2026", width: 1024, height: 1536 },
  { src: "/events/calendar/night-ride-beer.webp", alt: "SGL night ride and beer poster", title: "Night Ride & Beer · May 16", width: 1022, height: 1539 },
  { src: "/events/calendar/autumn-day.webp", alt: "SGL Autumn Day poster", title: "Autumn Day", width: 918, height: 1378 },
  { src: "/events/calendar/station-coffee-open.webp", alt: "SGL Station coffee poster", title: "Station Coffee · Archive", width: 1024, height: 1535 },
  { src: "/events/calendar/station-craft-beer-open.webp", alt: "SGL Station craft beer poster", title: "Station Craft Beer · Archive", width: 1024, height: 1536 }
];

const italianCalendarCopy = [
  { alt: "Poster SGL del festival ciclistico al West Bund", title: "West Bund · 1–5 maggio 2026" },
  { alt: "Poster SGL della pedalata serale con birra", title: "Pedalata serale e birra · 16 maggio" },
  { alt: "Poster SGL della Giornata d’autunno", title: "Giornata d’autunno" },
  { alt: "Poster del caffè alla Seagull Station", title: "Caffè alla Station · Archivio" },
  { alt: "Poster della birra artigianale alla Seagull Station", title: "Birra artigianale alla Station · Archivio" }
];

const stationAddresses: Record<LocalizedLocale, string> = {
  "zh-CN": "上海市浦东新区锦延路东绣路广场 L1",
  "ja-JP": "中国・上海市浦東新区、錦延路と東繡路の交差点広場 L1",
  "ko-KR": "중국 상하이 푸둥신구 진옌로·둥슈로 광장 L1",
  "it-IT": "Cina, Shanghai, Nuova Area di Pudong, piazza tra Jinyan Road e Dongxiu Road, livello L1"
};

const shopFeatureCopy: Record<LocalizedLocale, { eyebrow: string; heading: string; text: string; bannerAlt: string; featureAlt: string; closingAlt: string }> = {
  "zh-CN": { eyebrow: "SGL 商品", heading: "商店", text: "为日常移动而设计。", bannerAlt: "骑行者与自行车停在城市栏杆旁", featureAlt: "夜晚路灯下站在自行车旁的骑行者", closingAlt: "骑行者夜间骑着银色小轮自行车穿过城市停车场" },
  "ja-JP": { eyebrow: "SGL グッズ", heading: "ショップ", text: "日々の移動のために。", bannerAlt: "街の手すりのそばに立つ自転車とライダー", featureAlt: "夜の街灯の下で自転車と立つライダー", closingAlt: "夜の駐車場を小さなシルバーの自転車で走るライダー" },
  "ko-KR": { eyebrow: "SGL 굿즈", heading: "스토어", text: "매일의 움직임을 위해 만들었습니다.", bannerAlt: "도시 난간 옆의 자전거와 라이더", featureAlt: "밤 가로등 아래 자전거와 함께 선 라이더", closingAlt: "밤의 도심 주차장을 작은 은색 자전거로 달리는 라이더" },
  "it-IT": { eyebrow: "Prodotti SGL", heading: "Negozio", text: "Creati per muoversi ogni giorno.", bannerAlt: "Ciclista con bicicletta accanto a una ringhiera urbana", featureAlt: "Ciclista con bicicletta sotto un lampione di notte", closingAlt: "Ciclista su una piccola bicicletta argentata in un parcheggio urbano di notte" }
};

const afterDarkCopy: Record<LocalizedLocale, { eyebrow: string; heading: string; text: string }> = {
  "zh-CN": { eyebrow: "天黑之后", heading: "夜间路线。\n小轮前行。", text: "日落后骑行，在 Station 补给。" },
  "ja-JP": { eyebrow: "日没後", heading: "夜のルート。\n小さなホイール。", text: "日没後に走り、Stationでひと休み。" },
  "ko-KR": { eyebrow: "해가 진 뒤", heading: "밤의 루트.\n작은 바퀴.", text: "해가 진 뒤 달리고 Station에서 쉬어가세요." },
  "it-IT": { eyebrow: "Dopo il tramonto", heading: "Percorsi notturni.\nPiccole ruote.", text: "Pedala dopo il tramonto. Fai rifornimento alla Station." }
};

const returnsCopy: Record<LocalizedLocale, string> = {
  "zh-CN": "退换与售后安排按订单和商品状态确认。请在退回商品前联系 SGL。",
  "ja-JP": "返品とアフターサポートは注文内容と商品の状態に応じて確認します。返送前にSGLへご連絡ください。",
  "ko-KR": "반품과 사후 지원은 주문 및 제품 상태에 따라 확인합니다. 반송 전에 SGL에 문의해 주세요.",
  "it-IT": "Resi e assistenza vengono valutati in base all’ordine e alle condizioni del prodotto. Contatta SGL prima di restituire un articolo."
};

function routeKey(segments: string[]) {
  if (!segments.length) return "home";
  if (segments[0] === "shop" && segments[1]) return "product";
  if (segments[0] === "checkout" && segments[1] === "success") return "success";
  return segments[0];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedLocale = localeFromSegment(resolvedParams.locale);
  if (!resolvedLocale || resolvedLocale === "en") return {};
  const segments = resolvedParams.segments || [];
  const key = routeKey(segments);
  const locale = resolvedLocale as LocalizedLocale;
  const product = key === "product" ? getProduct(segments[1]) : undefined;
  const path = `/${segments.join("/")}`.replace(/\/$/, "") || "/";
  const base = pageCopy[locale][key === "product" ? "shop" : key];
  if (!base) return {};
  const title = product ? `${product.title}${locale === "it-IT" ? " | " : "｜"}The Seagull Labs` : base.title;
  const description = product ? localizedProduct(product, locale).description : base.description;
  const alternates = languageAlternates(path);
  const image = absoluteUrl(product?.images[0] || "/station/seagull-sunset.webp");
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(localizedPath(path, locale)),
      languages: Object.fromEntries(Object.entries(alternates).map(([language, href]) => [language, absoluteUrl(href)]))
    },
    openGraph: { title, description, url: absoluteUrl(localizedPath(path, locale)), siteName: "The Seagull Labs", type: "website", locale, images: [{ url: image }] },
    twitter: { card: "summary_large_image", title, description, images: [image] }
  };
}

function Hero({ copy, page }: { copy: { eyebrow: string; heading: string; intro: string; secondary: string }; page: Exclude<PublicPage, "product" | "cart" | "success" | "footer" | "shipping"> }) {
  return <div {...sectionMarker(page, "hero")} className="border-b border-sglInk bg-sglInk text-sglCream"><div className="mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24"><p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">{copy.eyebrow}</p><h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.94] md:text-6xl">{copy.heading}</h1><p className="mt-7 max-w-3xl text-lg leading-8 opacity-85">{copy.intro}</p><p className="mt-4 max-w-3xl leading-7 opacity-65">{copy.secondary}</p></div></div>;
}

function LocalizedBand({ locale, page, section, tone = "paper" }: { locale: LocalizedLocale; page: PublicPage; section: string; tone?: "paper" | "acid" | "ink" }) {
  const copy = getSectionCopy(locale, page, section);
  if (!copy) return null;
  const toneClass = tone === "acid" ? "bg-sglAcid text-sglInk" : tone === "ink" ? "bg-sglInk text-sglCream" : "bg-sglPaper text-sglInk";
  return <section data-content-section={`${page}.${section}`} className={`border-b border-sglInk ${toneClass}`}><div className="mx-auto max-w-sgl px-4 py-14 md:px-8 md:py-16"><p className={`text-sm font-black uppercase tracking-[0.28em] ${tone === "ink" ? "text-sglAcid" : "opacity-60"}`}>{copy.kicker}</p><h2 className="mt-3 max-w-4xl text-4xl font-black uppercase leading-tight md:text-5xl">{copy.heading}</h2><p className="mt-5 max-w-3xl text-lg leading-8 opacity-80">{copy.body}</p></div></section>;
}

function Home({ locale }: { locale: LocalizedLocale }) {
  const c = pageCopy[locale].home;
  const copy = localizedRichCopy[locale].home;
  return <div>
    <section {...sectionMarker("home", "hero")} className="border-b border-sglInk bg-sglInk text-sglCream">
      <div className="mx-auto grid max-w-sgl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-24">
        <div>
          <p className="mb-5 inline-block border border-sglAcid px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-sglAcid">{c.eyebrow}</p>
          <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.92] tracking-tight md:text-6xl">{c.heading}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 opacity-85 md:text-xl">{c.intro}</p>
          <p className="mt-4 max-w-2xl leading-7 opacity-65">{c.secondary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={localizedPath("/shop", locale)} className="border border-sglAcid bg-sglAcid px-6 py-3 font-black uppercase tracking-wide text-sglInk">{copy.shopButton}</Link>
            <Link href={localizedPath("/station", locale)} className="border border-sglCream px-6 py-3 font-black uppercase tracking-wide">{copy.stationButton}</Link>
            <Link href={localizedPath("/events", locale)} className="border border-sglCream px-6 py-3 font-black uppercase tracking-wide">{copy.rideButton}</Link>
          </div>
        </div>
        <div className="border border-sglCream bg-sglGraphite p-3 md:p-4">
          <div className="overflow-hidden border border-sglCream/60 bg-[#e4cca0]">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src="/home/wheel-deal.webp" alt={copy.heroImageAlt} fill sizes="(max-width: 767px) 100vw, 42vw" className="object-contain" priority />
              <p className="absolute left-4 top-4 border border-sglInk bg-sglAcid px-3 py-2 text-xs font-black uppercase tracking-[0.24em] text-sglInk md:left-5 md:top-5">{copy.panelLabel}</p>
            </div>
            <div className="grid gap-5 border-t border-sglCream/60 bg-sglInk p-5 text-sglCream md:grid-cols-[1fr_auto] md:items-end md:p-6">
              <div><h2 className="text-3xl font-black uppercase leading-[0.95] md:text-4xl">{copy.panelHeading}</h2><p className="mt-4 max-w-md text-xs uppercase leading-5 tracking-[0.18em] opacity-65">{copy.panelItems}</p></div>
              <div className="flex items-end gap-3 md:block md:text-right"><p className="text-5xl font-black leading-none text-sglAcid">{storefrontProducts.length}</p><p className="pb-1 text-xs font-black uppercase tracking-[0.18em] md:mt-2 md:pb-0">{copy.goodsOnline}</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section {...sectionMarker("home", "shop")} className="mx-auto max-w-sgl px-4 py-16 md:px-8">
      <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">{copy.shopKicker}</p><h2 className="mt-2 text-4xl font-black uppercase md:text-5xl">{copy.shopHeading}</h2><p className="mt-4 max-w-2xl text-lg leading-8 opacity-70">{copy.shopBody}</p></div><Link href={localizedPath("/shop", locale)} className="border-b border-sglInk font-black uppercase">{copy.viewAll}</Link></div>
      <ProductCards locale={locale} products={storefrontProducts.slice(0, 8)} />
    </section>
    <section {...sectionMarker("home", "station")} className="border-y border-sglInk bg-sglAcid">
      <div className="mx-auto grid max-w-sgl gap-8 px-4 py-16 md:grid-cols-3 md:px-8">
        <div><p className="text-sm font-black uppercase tracking-[0.28em]">{copy.stationKicker}</p><h2 className="mt-2 text-4xl font-black uppercase">{copy.stationHeading}</h2><p className="mt-5 leading-7">{copy.stationBody}</p></div>
        <div className="grid gap-4 md:col-span-2 md:grid-cols-3">{copy.stationCards.map(card => <article key={card.number} className="border border-sglInk bg-sglCream p-6"><p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">{card.number}</p><h3 className="mt-2 text-2xl font-black uppercase">{card.title}</h3><p className="mt-2 leading-7 opacity-80">{card.text}</p></article>)}</div>
      </div>
    </section>
    <section {...sectionMarker("home", "events")} className="mx-auto max-w-sgl px-4 py-16 md:px-8">
      <div className="mb-8"><p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">{copy.eventsKicker}</p><h2 className="mt-2 text-4xl font-black uppercase md:text-5xl">{copy.eventsHeading}</h2></div>
      <div className="mb-8 border border-sglInk bg-black text-sglCream"><div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs font-black uppercase tracking-[0.24em] md:px-6"><span className="border border-sglAcid bg-sglAcid px-3 py-1 text-sglInk">{copy.filmBadge}</span><span>{copy.filmTitle}</span></div><Films src="/videos/shanghai.mp4" title={copy.filmAria} frameless /></div>
      <div className="grid gap-4 md:grid-cols-3">{copy.events.map(event => <article key={event.title} className="border border-sglInk bg-sglCream p-6"><p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">{event.date}</p><h3 className="mt-2 text-2xl font-black uppercase">{event.title}</h3><p className="mt-2 leading-7 opacity-80">{event.description}</p></article>)}</div>
    </section>
  </div>;
}

function ProductCards({ locale, products }: { locale: LocalizedLocale; products: typeof storefrontProducts }) {
  return <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map((raw) => { const product = localizedProduct(raw, locale); const isTee = raw.slug.includes("tee"); const useInsetComposition = raw.slug === "pin" || isTee; return <Link key={product.slug} href={localizedPath(`/shop/${product.slug}`, locale)} className="overflow-hidden border border-sglInk bg-sglPaper transition hover:-translate-y-1"><div className={`relative overflow-hidden border-b border-sglInk bg-[#ededeb] ${isTee ? "aspect-square" : "aspect-[4/5]"}`}><Image src={product.images[0]} alt={product.title} fill sizes="25vw" className={isTee ? "object-contain p-3 mix-blend-darken" : useInsetComposition ? "object-contain p-8 mix-blend-darken" : "object-cover mix-blend-darken"} /></div><div className="p-5">{product.soldOut && <p className="mb-3 inline-block border border-sglInk bg-sglInk px-3 py-1 text-xs font-black uppercase tracking-wide text-sglCream">{labels[locale].soldOut}</p>}<h2 className="text-xl font-black">{product.title}</h2><p className="mt-3 text-sm leading-6 opacity-70">{product.description}</p><p className="mt-4 font-black">$ {product.priceLabel}</p></div></Link>; })}</div>;
}

function About({ locale }: { locale: LocalizedLocale }) {
  const c = pageCopy[locale].about;
  const l = labels[locale];
  const media = localizedRichCopy[locale].about;
  return <><Hero copy={c} page="about" /><section {...sectionMarker("about", "history")} className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.history}</h2><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{timeline[locale].map(item => <article key={item.date} className="border border-sglInk bg-sglPaper p-5"><p className="font-black">{item.date}</p><p className="mt-3 leading-7">{item.text}</p></article>)}</div></section><LocalizedBand locale={locale} page="about" section="principles" /><LocalizedBand locale={locale} page="about" section="brand-structure" tone="acid" />
    <section {...sectionMarker("about", "media")} className="border-b border-sglInk bg-sglPaper"><div className="mx-auto grid max-w-sgl gap-4 px-4 py-16 md:grid-cols-12 md:px-8">
      <figure className="overflow-hidden border border-sglInk bg-sglCream md:col-span-4"><Image src="/events/calendar/one-year-anniversary.webp" alt={media.anniversaryAlt} width={778} height={822} sizes="(max-width: 767px) 100vw, 34vw" className="aspect-[4/5] w-full object-cover" /><figcaption className="border-t border-sglInk px-5 py-4 text-sm font-black uppercase tracking-wide">{media.anniversaryCaption}</figcaption></figure>
      <figure className="overflow-hidden border border-sglInk bg-black md:col-span-8"><Films src="/videos/night-ride-loop.mp4" title={media.filmTitle} poster="/events/calendar/night-ride-shadow.webp" frameless /><figcaption className="border-t border-sglCream/30 px-5 py-4 text-sm font-black uppercase tracking-wide text-sglCream">{media.filmCaption}</figcaption></figure>
    </div></section>
    <LocalizedBand locale={locale} page="about" section="directions" /><LocalizedBand locale={locale} page="about" section="cta" tone="ink" /></>;
}

function Shop({ locale }: { locale: LocalizedLocale }) {
  const c = pageCopy[locale].shop;
  const l = labels[locale];
  const feature = shopFeatureCopy[locale];
  const afterDark = afterDarkCopy[locale];
  return <section className="mx-auto max-w-sgl px-4 pb-16 pt-6 md:px-8 md:pt-8">
    <div {...sectionMarker("shop", "hero")} className="relative isolate overflow-hidden border border-sglInk bg-sglInk text-sglCream">
      <Image src="/products/shop-ride-banner.webp" alt={feature.bannerAlt} width={2000} height={1326} priority sizes="(max-width: 767px) 100vw, 1280px" className="aspect-[2/1] w-full object-cover object-bottom" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 p-3 sm:p-6 md:p-10">
        <p className="text-sm font-black uppercase tracking-[0.28em]">{feature.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-black uppercase sm:text-5xl md:text-6xl">{feature.heading}</h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest sm:mt-3 sm:text-sm md:text-base">{feature.text}</p>
      </div>
    </div>
    <p className="mt-6 max-w-3xl text-lg leading-8 opacity-75">{c.intro}</p>
    <p className="mt-3 max-w-3xl text-base leading-7 opacity-60">{c.secondary}</p>
    <div className="mt-10 grid gap-12">
      {categories.map((category, index) => {
        const categoryProducts = getProductsByCategory(category);
        const categoryTitle = categoryProducts.length ? localizedProduct(categoryProducts[0], locale).category : category;
        const section = ["bikes-frames", "bags-carry", "wear-ride", "coffee-refuel", "accessories"][index];
        return <div key={category} data-content-section={`shop.${section}`}>
          <div className="mb-5 flex items-center gap-4">
            <h2 className="text-2xl font-black uppercase">{categoryTitle}</h2>
            <div className="h-px flex-1 bg-sglInk/30" />
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">{categoryProducts.length} {l.items}</p>
          </div>
          <ProductCards locale={locale} products={categoryProducts} />
          {index === 1 && <figure className="mt-12 grid overflow-hidden border border-sglInk bg-sglPaper text-sglInk md:grid-cols-[0.7fr_1.3fr]">
            <figcaption className="flex flex-col justify-between gap-8 p-6 md:p-10">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] opacity-60">{afterDark.eyebrow}</p>
                <h3 className="mt-3 whitespace-pre-line text-4xl font-black uppercase leading-none md:text-5xl">{afterDark.heading}</h3>
              </div>
              <p className="max-w-sm text-sm uppercase tracking-[0.18em] opacity-65">{afterDark.text}</p>
            </figcaption>
            <Image src="/events/calendar/night-ride-shadow.webp" alt={feature.featureAlt} width={1280} height={1930} sizes="(max-width: 767px) 100vw, 65vw" className="max-h-[760px] w-full object-cover object-center" />
          </figure>}
        </div>;
      })}
    </div>
    <div {...sectionMarker("shop", "closing-image")} className="mt-16 overflow-hidden border border-sglInk bg-black">
      <Image src="/products/shop-night-ride-closing.webp" alt={feature.closingAlt} width={3575} height={2293} sizes="(max-width: 767px) 100vw, 1280px" className="h-auto w-full" />
    </div>
  </section>;
}

function ProductDetail({ locale, slug }: { locale: LocalizedLocale; slug: string }) { const raw = getProduct(slug); if (!raw || raw.hidden) notFound(); const product = localizedProduct(raw, locale); const l = labels[locale]; const path = localizedPath(`/shop/${slug}`, locale); return <section {...sectionMarker("product", "product-detail")} className="mx-auto max-w-sgl px-4 py-12 md:px-8"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd(product, path)) }} /><Link href={localizedPath("/shop", locale)} className="font-bold underline">← {l.back}</Link><div className="mt-8 grid gap-10 lg:grid-cols-2"><ProductGallery images={product.images} title={product.title} insetPrimary={raw.slug === "pin" || raw.slug.includes("tee")} /><div><p className="text-sm font-black uppercase tracking-widest opacity-60">{product.category}</p><h1 className="mt-3 text-5xl font-black">{product.title}</h1><p className="mt-5 text-lg leading-8">{product.description}</p><h2 className="mt-8 text-xl font-black uppercase">{l.details}</h2><ul className="mt-4 list-disc space-y-2 pl-5">{product.details.map(item => <li key={item}>{item}</li>)}</ul><ProductPurchase product={product} /></div></div></section> }

function Station({ locale }: { locale: LocalizedLocale }) {
  const c = pageCopy[locale].station;
  const l = labels[locale];
  const copy = localizedRichCopy[locale].station;
  const address = stationAddresses[locale];
  const path = localizedPath("/station", locale);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(stationJsonLd(path)) }} />
    <div {...sectionMarker("station", "hero-image")} className="border-b border-sglInk bg-sglInk"><div className="mx-auto max-w-sgl"><Image src="/station/seagull-sunset.webp" alt={copy.heroAlt} width={1672} height={941} priority sizes="(max-width: 1440px) 100vw, 1440px" className="h-auto w-full" /></div></div>
    <Hero copy={c} page="station" />
    <section id="station-life" {...sectionMarker("station", "station-life")} className="scroll-mt-24 border-b border-sglInk bg-sglCream"><div className="mx-auto max-w-sgl px-4 py-16 md:px-8"><p className="text-sm font-black uppercase tracking-[0.25em] opacity-60">{copy.lifeKicker}</p><h2 className="mt-3 text-4xl font-black uppercase md:text-5xl">{copy.lifeHeading}</h2><p className="mt-5 max-w-3xl text-lg leading-8 opacity-75">{copy.lifeBody}</p><div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">{copy.photos.map(photo => <figure key={photo.name} className="mb-6 break-inside-avoid overflow-hidden border border-sglInk bg-sglPaper"><Image src={`/station/${photo.name}.webp`} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="h-auto w-full" /><figcaption className="px-5 py-4 text-sm font-bold uppercase tracking-wide">{photo.title}</figcaption></figure>)}</div></div></section>
    <section {...sectionMarker("station", "offerings")} className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.current}</h2><div className="mt-8 grid gap-5 md:grid-cols-4">{copy.offerings.map(item => <article key={item.number} className="border border-sglInk bg-sglPaper p-6"><p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">{item.number}</p><h3 className="mt-3 text-2xl font-black uppercase leading-tight">{item.title}</h3><p className="mt-4 leading-7 opacity-75">{item.text}</p></article>)}</div><div className="mt-10 border border-sglInk bg-sglAcid p-6"><h2 className="text-2xl font-black uppercase">{l.address}</h2><p className="mt-4 text-lg">{address}</p></div></section>
    <LocalizedBand locale={locale} page="station" section="station-logic" tone="acid" /><LocalizedBand locale={locale} page="station" section="mini-program" />
    <section {...sectionMarker("station", "station-stories")} className="border-t border-sglInk bg-sglCream"><div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[0.8fr_1.2fr] md:items-end md:px-8 md:py-16"><div className="md:pb-4"><p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">{copy.storiesKicker}</p><h2 className="mt-3 text-4xl font-black uppercase leading-none">{copy.storiesHeading}</h2><p className="mt-5 max-w-md leading-7 opacity-70">{copy.storiesBody}</p></div><Image src="/characters/station-three-birds.webp" alt={copy.storiesAlt} width={1122} height={1402} sizes="(max-width: 767px) 100vw, 52vw" className="max-h-[620px] w-full border border-sglInk object-contain" /></div></section>
  </>;
}

function Events({ locale }: { locale: LocalizedLocale }) { const c = pageCopy[locale].events; const l = labels[locale]; const posters = locale === "it-IT" ? calendarPosters.map((poster, index) => ({ ...poster, ...italianCalendarCopy[index] })) : calendarPosters; const ispoAlt = locale === "it-IT" ? "The Seagull Labs a ISPO Shanghai 2025" : "SGL at ISPO Shanghai 2025"; return <><section {...sectionMarker("events", "film")} className="bg-black"><div className="mx-auto max-w-sgl"><Films src="/videos/seagull.mp4" title="Seagull — New York" frameless /></div></section><Hero copy={c} page="events" /><section {...sectionMarker("events", "calendar")} className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.calendar}</h2><p className="mt-4 max-w-3xl leading-7">{l.archive}</p><div className="mt-8"><EventGallery photos={posters} display="grid" /></div></section><section {...sectionMarker("events", "exhibitions")} className="border-y border-sglInk bg-sglCream"><div className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.exhibitions}</h2><p className="mt-5 max-w-3xl text-lg leading-8">{c.secondary}</p><div className="mt-8"><EventGallery display="compact" photos={[{ src: "/events/ispo-shanghai.webp", alt: ispoAlt, title: "ISPO Shanghai 2025", width: 1920, height: 1280 }]} /></div></div></section><LocalizedBand locale={locale} page="events" section="community" tone="ink" /><LocalizedBand locale={locale} page="events" section="formats" /><LocalizedBand locale={locale} page="events" section="event-list" tone="acid" /><LocalizedBand locale={locale} page="events" section="development" /><LocalizedBand locale={locale} page="events" section="cta" tone="ink" /></> }

function Universe({ locale }: { locale: LocalizedLocale }) {
  const c = pageCopy[locale].universe;
  const l = labels[locale];
  const world = universeWorldCopy[locale];
  const heroAlt = locale === "it-IT" ? "I personaggi SGL riuniti di notte" : "SGL character gathering";
  const filmTitle = getSectionCopy(locale, "universe", "film").heading;
  return <>
    <div {...sectionMarker("universe", "hero-image")}><Image src="/characters/sgl-birds-night.webp" alt={heroAlt} width={2400} height={800} className="w-full" /></div>
    <Hero copy={c} page="universe" />
    <section {...sectionMarker("universe", "characters")} className="mx-auto max-w-sgl px-4 py-16 md:px-8"><h2 className="text-4xl font-black uppercase">{l.characters}</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{characterCopy[locale].map(character => <article key={character.name} className="border border-sglInk bg-sglPaper p-4"><div className="relative aspect-[4/5] overflow-hidden border border-sglInk bg-sglGraphite"><Image src={character.image} alt={character.alt} fill sizes="25vw" className="object-cover" /></div><h3 className="mt-5 text-3xl font-black uppercase">{character.name}</h3><p className="mt-4 leading-7 opacity-80">{character.text}</p></article>)}</div></section>
    <section {...sectionMarker("universe", "world-points")} className="border-y border-sglInk bg-sglCream"><div className="mx-auto max-w-sgl px-4 py-12 md:px-8 md:py-16"><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{world.points.map(point => <div key={point} className="flex items-center border border-sglInk bg-sglPaper px-5 py-4 text-xl font-black uppercase">{point}</div>)}</div></div></section>
    <section {...sectionMarker("universe", "world-system")} className="border-t border-sglInk bg-sglAcid"><div className="mx-auto grid max-w-sgl gap-8 px-4 py-14 md:grid-cols-2 md:items-center md:px-8 md:py-16"><div className="space-y-8 text-xl leading-9 md:text-2xl md:leading-[1.55]">{world.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div><div {...sectionMarker("universe", "film")} className="min-w-0 overflow-hidden bg-black"><Films src="/videos/universe-animation-preview.mp4" poster="/videos/universe-animation-preview.jpg" title={filmTitle} frameless loop /></div></div></section>
    <LocalizedBand locale={locale} page="universe" section="cta" tone="ink" />
  </>;
}

function AppPage({ locale }: { locale: LocalizedLocale }) {
  const c = pageCopy[locale].app;
  const copy = localizedRichCopy[locale].app;
  return <>
    <section {...sectionMarker("app", "hero")} className="overflow-hidden border-b border-sglInk bg-sglInk text-sglCream"><div className="mx-auto grid max-w-sgl items-center gap-12 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-24"><div><p className="text-sm font-black uppercase tracking-[0.25em] text-sglAcid">{c.eyebrow}</p><h1 className="mt-6 text-5xl font-black uppercase leading-[0.95] md:text-6xl">{c.heading}</h1><p className="mt-7 max-w-lg text-lg leading-8 opacity-80">{c.intro}</p><div className="mt-7 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider"><span className="border border-sglCream/40 px-3 py-2">{copy.liveBadge}</span><span className="border border-sglCream/40 px-3 py-2">{copy.developmentBadge}</span></div><p className="mt-4 text-sm opacity-60">{copy.statusNote}</p><a href="#screens" className="mt-8 inline-block border border-sglAcid bg-sglAcid px-6 py-3 font-black uppercase text-sglInk">{copy.exploreButton}</a></div><div className="mx-auto w-full max-w-[340px] rounded-[2.5rem] border border-white/25 bg-sglCream p-2 shadow-[16px_16px_0_#34383b]"><Image src="/app/story-en.webp" alt={copy.heroAlt} width={850} height={1846} sizes="(max-width: 767px) 85vw, 340px" priority className="h-auto w-full rounded-[2rem]" /></div></div></section>
    <section id="screens" {...sectionMarker("app", "screens")} className="scroll-mt-20 mx-auto max-w-sgl px-4 py-16 md:px-8 md:py-24"><div className="mb-12 max-w-3xl"><p className="text-sm font-black uppercase tracking-[0.25em] opacity-60">{copy.screensKicker}</p><h2 className="mt-4 text-4xl font-black uppercase leading-none md:text-5xl">{copy.screensHeading}</h2><p className="mt-5 text-lg leading-8 opacity-75">{copy.screensBody}</p></div><div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 xl:grid-cols-4">{copy.screens.map(screen => <figure key={screen.file} className="min-w-0"><div className="mx-auto max-w-[340px] overflow-hidden rounded-[2rem] border border-sglInk bg-sglInk p-1.5"><Image src={`/app/${screen.file}`} alt={screen.alt} width={850} height={1846} sizes="(max-width: 639px) 85vw, (max-width: 1279px) 40vw, 25vw" className="h-auto w-full rounded-[1.6rem]" /></div><figcaption className="mt-6"><p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">{screen.label}</p><h3 className="mt-3 text-2xl font-black uppercase leading-tight">{screen.title}</h3><p className="mt-3 leading-7 opacity-75">{screen.text}</p></figcaption></figure>)}</div><p className="mt-10 text-sm opacity-60">{copy.disclaimer}</p></section>
    <section {...sectionMarker("app", "next-chapter")} className="border-y border-sglInk bg-sglAcid"><div className="mx-auto grid max-w-sgl gap-8 px-4 py-12 md:grid-cols-2 md:px-8"><div><p className="text-sm font-black uppercase tracking-[0.2em]">{copy.nextKicker}</p><h2 className="mt-3 text-4xl font-black uppercase">{copy.nextHeading}</h2></div><div><p className="text-lg leading-8">{copy.nextBody}</p><Link href={localizedPath("/station", locale)} className="mt-6 inline-block border border-sglInk bg-sglInk px-6 py-3 font-black uppercase text-sglCream">{copy.stationButton}</Link></div></div></section>
  </>;
}

function SimplePage({ locale, kind }: { locale: LocalizedLocale; kind: "contact" | "stockists" | "shipping" | "success" }) {
  const c = pageCopy[locale][kind];
  if (kind === "shipping") {
    const copy = getSectionCopy(locale, "shipping", "information")!;
    return <section {...sectionMarker("shipping", "information")} className="mx-auto max-w-sgl px-4 py-16 md:px-8"><p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">{copy.kicker}</p><h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-none md:text-6xl">{copy.heading}</h1><p className="mt-6 max-w-3xl text-lg leading-8 opacity-80">{c.intro}</p><div className="mt-10 grid gap-6 md:grid-cols-2"><article className="border border-sglInk bg-sglPaper p-6"><h2 className="text-2xl font-black uppercase">{copy.heading}</h2><p className="mt-4 leading-7">{copy.body}</p></article><article className="border border-sglInk bg-sglPaper p-6"><h2 className="text-2xl font-black uppercase">{labels[locale].returns}</h2><p className="mt-4 leading-7">{returnsCopy[locale]}</p></article></div><div className="mt-8 flex flex-wrap gap-4"><a href="mailto:hello@theseagulllabs.com" className="border border-sglInk bg-sglAcid px-6 py-3 font-black">hello@theseagulllabs.com</a><Link href={localizedPath("/shop", locale)} className="border border-sglInk px-6 py-3 font-black">{labels[locale].back}</Link></div></section>;
  }
  if (kind === "success") {
    const copy = getSectionCopy(locale, "success", "status")!;
    return <section {...sectionMarker("success", "status")} className="mx-auto max-w-sgl px-4 py-20 md:px-8"><p className="text-sm font-black uppercase tracking-[0.28em] opacity-60">{copy.kicker}</p><h1 className="mt-4 text-5xl font-black uppercase">{copy.heading}</h1><p className="mt-6 max-w-3xl text-lg leading-8">{copy.body}</p><Link href={localizedPath("/shop", locale)} className="mt-8 inline-block border border-sglInk bg-sglInk px-6 py-3 font-black uppercase text-sglCream">{labels[locale].back}</Link></section>;
  }
  if (kind === "contact") return <><Hero copy={c} page="contact" /><LocalizedBand locale={locale} page="contact" section="contact-methods" /><LocalizedBand locale={locale} page="contact" section="fast-order" tone="acid" /><LocalizedBand locale={locale} page="contact" section="collaboration" /><LocalizedBand locale={locale} page="contact" section="cta" tone="ink" /></>;
  return <><Hero copy={c} page="stockists" /><LocalizedBand locale={locale} page="stockists" section="channels" /><LocalizedBand locale={locale} page="stockists" section="partnership" tone="acid" /></>;
}

export default async function LocalizedPage({ params }: PageProps) {
  const resolvedParams = await params;
  const resolvedLocale = localeFromSegment(resolvedParams.locale);
  if (!resolvedLocale || resolvedLocale === "en") notFound();
  const locale = resolvedLocale as LocalizedLocale;
  const segments = resolvedParams.segments || [];
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
