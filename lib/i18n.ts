export const locales = ["en", "zh-CN", "ja-JP", "ko-KR", "it-IT"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "ja-JP": "日本語",
  "ko-KR": "한국어",
  "it-IT": "Italia — Italiano"
};

export const localePrefixes: Record<Locale, string> = {
  en: "",
  "zh-CN": "zh-CN",
  "ja-JP": "ja-JP",
  "ko-KR": "ko-KR",
  "it-IT": "it"
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localeFromSegment(value?: string | null): Locale | null {
  if (!value) return null;
  if (value === "it") return "it-IT";
  return isLocale(value) ? value : null;
}

export function localeFromPath(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  return localeFromSegment(first) ?? "en";
}

export function stripLocale(pathname: string) {
  const first = pathname.split("/").filter(Boolean)[0];
  const locale = localeFromSegment(first);
  if (!locale || locale === "en") return pathname;
  const stripped = pathname.replace(new RegExp(`^/${first}(?=/|$)`), "");
  return stripped || "/";
}

export function localizedPath(pathname: string, locale: Locale) {
  const clean = stripLocale(pathname);
  const prefix = localePrefixes[locale];
  return locale === "en" ? clean : `/${prefix}${clean === "/" ? "" : clean}`;
}

export const languageAlternates = (pathname: string) => ({
  en: localizedPath(pathname, "en"),
  "zh-CN": localizedPath(pathname, "zh-CN"),
  "ja-JP": localizedPath(pathname, "ja-JP"),
  "ko-KR": localizedPath(pathname, "ko-KR"),
  "it-IT": localizedPath(pathname, "it-IT"),
  "x-default": localizedPath(pathname, "en")
});

export const regionLocale = (country?: string | null): Locale => {
  if (country === "CN") return "zh-CN";
  if (country === "JP") return "ja-JP";
  if (country === "KR") return "ko-KR";
  if (country === "IT") return "it-IT";
  return "en";
};

export const browserLocale = (acceptLanguage?: string | null): Locale => {
  const languages = (acceptLanguage || "")
    .split(",")
    .map((item) => item.trim().split(";")[0].toLowerCase());
  for (const language of languages) {
    if (language.startsWith("it")) return "it-IT";
    if (language.startsWith("zh")) return "zh-CN";
    if (language.startsWith("ja")) return "ja-JP";
    if (language.startsWith("ko")) return "ko-KR";
    if (language.startsWith("en")) return "en";
  }
  return "en";
};
