"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n";

const copy: Record<Locale, { heading: string; text: string; explore: string; contact: string; labels: string[] }> = {
  en: { heading: "Urban riding, Station goods and small adventures.", text: "SGL connects products, cycling culture, photography, original characters and real community life at Seagull Station. City missions and AR experiences are the next layer in development.", explore: "Explore", contact: "Contact", labels: ["Shop", "Station", "Events", "Universe", "App & Mini Program", "About", "Stockists", "Sales & Shipping", "Contact SGL"] },
  "zh-CN": { heading: "城市骑行、Station 好物与小小冒险。", text: "SGL 连接产品、骑行文化、影像、原创角色与 Seagull Station 的真实社群生活。城市任务和 AR 体验正在持续开发。", explore: "探索", contact: "联系", labels: ["商店", "Station", "活动", "角色世界", "小程序", "关于", "零售渠道", "销售与配送", "联系 SGL"] },
  "ja-JP": { heading: "都市のライド、Stationグッズ、小さな冒険。", text: "SGLはプロダクト、サイクリングカルチャー、写真、オリジナルキャラクター、Seagull Stationのリアルなコミュニティをつなぎます。シティミッションとAR体験は開発中です。", explore: "見る", contact: "お問い合わせ", labels: ["ショップ", "Station", "イベント", "ユニバース", "ミニプログラム", "私たちについて", "取扱店", "販売・配送", "SGLへ連絡"] },
  "ko-KR": { heading: "도시 라이딩, Station 굿즈, 작은 모험.", text: "SGL은 제품, 사이클링 문화, 사진, 오리지널 캐릭터와 Seagull Station의 실제 커뮤니티를 연결합니다. 도시 미션과 AR 경험은 개발 중입니다.", explore: "둘러보기", contact: "문의", labels: ["스토어", "Station", "이벤트", "유니버스", "미니 프로그램", "소개", "판매처", "판매 및 배송", "SGL 문의"] },
  "it-IT": { heading: "Ciclismo urbano, prodotti Station e piccole avventure.", text: "SGL unisce prodotti, cultura ciclistica, fotografia, personaggi originali e la vita reale della comunità alla Seagull Station. Le missioni urbane e le esperienze AR sono in fase di sviluppo.", explore: "Esplora", contact: "Contatti", labels: ["Negozio", "Station", "Eventi", "Universo", "App e Mini Program", "Chi siamo", "Rivenditori", "Vendite e spedizioni", "Contatta SGL"] }
};

export default function Footer() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const c = copy[locale];
  const links = ["/shop", "/station", "/events", "/universe", "/app", "/about", "/stockists", "/shipping"];
  return (
    <footer className="border-t border-sglInk bg-sglInk text-sglCream">
      <div className="mx-auto grid max-w-sgl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">
            Seagull Station
          </p>

          <h2 className="mt-3 max-w-xl text-3xl font-black uppercase leading-tight">
            {c.heading}
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-6 opacity-70">
            {c.text}
          </p>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-sglAcid">
            {c.explore}
          </p>

          <div className="mt-4 grid gap-2 text-sm font-bold uppercase">
            {links.map((href, index) => <Link key={href} href={localizedPath(href, locale)}>{c.labels[index]}</Link>)}
          </div>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-sglAcid">
            {c.contact}
          </p>

          <div className="mt-4 grid gap-2 text-sm font-bold uppercase">
            <Link href={localizedPath("/contact", locale)}>{c.labels[8]}</Link>
            <a href="mailto:hello@theseagulllabs.com">
              hello@theseagulllabs.com
            </a>
            <a href="https://www.youtube.com/@seagulllabs" target="_blank" rel="noopener noreferrer">YouTube: @seagulllabs</a>
            <a
              href="https://www.instagram.com/seagulllabs"
              target="_blank"
              rel="noreferrer"
            >
              Instagram: @seagulllabs
            </a>
          </div>
          <div className="mt-6"><LanguageSelector /></div>
        </div>
      </div>
    </footer>
  );
}
