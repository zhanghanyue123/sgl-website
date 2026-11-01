"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeFromPath, localeNames, locales, localizedPath, type Locale } from "@/lib/i18n";

export default function LanguageSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = localeFromPath(pathname);
  const label: Record<Locale, string> = {
    en: "Region / Language",
    "zh-CN": "地区 / 语言",
    "ja-JP": "地域 / 言語",
    "ko-KR": "지역 / 언어"
  };

  function change(next: Locale) {
    document.cookie = `sgl_locale=${next}; path=/; max-age=31536000; samesite=lax`;
    router.push(localizedPath(pathname, next));
  }

  return (
    <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em]">
      <span>{label[locale]}</span>
      <select
        value={locale}
        onChange={(event) => change(event.target.value as Locale)}
        className="border border-sglCream/50 bg-sglInk px-3 py-2 text-sglCream"
        aria-label={label[locale]}
      >
        {locales.map((item) => <option key={item} value={item}>{localeNames[item]}</option>)}
      </select>
    </label>
  );
}
