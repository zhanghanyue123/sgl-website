export const locales = ["en", "zh-CN", "ja-JP", "ko-KR"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "ja-JP": "日本語",
  "ko-KR": "한국어"
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localeFromPath(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  return first && isLocale(first) ? first : "en";
}

export function stripLocale(pathname: string) {
  const locale = localeFromPath(pathname);
  if (locale === "en") return pathname;
  const stripped = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  return stripped || "/";
}

export function localizedPath(pathname: string, locale: Locale) {
  const clean = stripLocale(pathname);
  return locale === "en" ? clean : `/${locale}${clean === "/" ? "" : clean}`;
}

export const languageAlternates = (pathname: string) => ({
  en: localizedPath(pathname, "en"),
  "zh-CN": localizedPath(pathname, "zh-CN"),
  "ja-JP": localizedPath(pathname, "ja-JP"),
  "ko-KR": localizedPath(pathname, "ko-KR"),
  "x-default": localizedPath(pathname, "en")
});

export const regionLocale = (country?: string | null): Locale => {
  if (country === "CN") return "zh-CN";
  if (country === "JP") return "ja-JP";
  if (country === "KR") return "ko-KR";
  return "en";
};
