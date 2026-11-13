"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n";

const nav = [
  { href: "/shop", labels: ["Shop", "商店", "ショップ", "스토어", "Negozio"] },
  { href: "/station", labels: ["Station", "驿站", "ステーション", "스테이션", "Station"] },
  { href: "/events", labels: ["Events", "活动", "イベント", "이벤트", "Eventi"] },
  { href: "/universe", labels: ["Universe", "角色世界", "ユニバース", "유니버스", "Universo"] },
  { href: "/app", labels: ["App", "小程序", "ミニプログラム", "미니 프로그램", "App"] },
  { href: "/about", labels: ["About", "关于", "私たちについて", "소개", "Chi siamo"] }
];

const localeIndex: Record<Locale, number> = { en: 0, "zh-CN": 1, "ja-JP": 2, "ko-KR": 3, "it-IT": 4 };
const cartLabels: Record<Locale, string> = { en: "Shopping cart", "zh-CN": "购物车", "ja-JP": "ショッピングカート", "ko-KR": "장바구니", "it-IT": "Carrello" };
const accountLabels: Record<Locale, string> = { en: "Customer account", "zh-CN": "客户账户", "ja-JP": "カスタマーアカウント", "ko-KR": "고객 계정", "it-IT": "Account cliente" };
const mobileNavLabels: Record<Locale, string> = { en: "Mobile navigation", "zh-CN": "移动导航", "ja-JP": "モバイルナビゲーション", "ko-KR": "모바일 내비게이션", "it-IT": "Navigazione mobile" };

export default function Header() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const labelIndex = localeIndex[locale];
  return (
    <header className="sticky top-0 z-50 border-b border-sglInk bg-sglCream/95 backdrop-blur">
      <div className="mx-auto grid max-w-sgl grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr] px-4 py-3 md:px-8">
        <Link href={localizedPath("/", locale)} className="relative block h-9 w-[150px] md:h-11 md:w-[185px]">
          <Image
            src="/sgl-logo.png"
            alt="Seagull Station"
            fill
            priority
            sizes="185px"
            className="object-contain object-left"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={localizedPath(item.href, locale)}
              className="border-b border-transparent hover:border-sglInk"
            >
              {item.labels[labelIndex]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-self-end"><Link href="/login" aria-label={accountLabels[locale]} title={accountLabels[locale]} className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-sglAcid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></Link><Link href={localizedPath("/cart", locale)} aria-label={cartLabels[locale]} title={cartLabels[locale]} className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-sglAcid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
            <path d="M3 3h2l2.4 12h11.2l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" />
          </svg>
        </Link></div>
      </div>
      <nav aria-label={mobileNavLabels[locale]} className="grid grid-cols-6 gap-1 text-center border-t border-sglInk/10 px-2 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide lg:hidden">
        {nav.map((item) => <Link key={item.href} href={localizedPath(item.href, locale)} className="shrink-0 py-1">{item.labels[labelIndex]}</Link>)}
      </nav>
    </header>
  );
}
