import { NextRequest, NextResponse } from "next/server";
import { browserLocale, isLocale, localizedPath, localeFromPath, localeFromSegment, regionLocale, stripLocale } from "@/lib/i18n";

const botPattern = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|duckduckbot|baiduspider|yandex/i;

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const first = pathname.split("/").filter(Boolean)[0];

  if (first === "admin") {
    const headers = new Headers(request.headers);
    headers.set("x-sgl-locale", "en");
    return NextResponse.next({ request: { headers } });
  }

  if (first === "en") {
    return NextResponse.redirect(new URL(stripLocale(pathname), request.url), 308);
  }

  if (first === "it-IT") {
    return NextResponse.redirect(new URL(localizedPath(stripLocale(pathname), "it-IT"), request.url), 308);
  }

  const explicitLocale = localeFromSegment(first);
  const locale = explicitLocale && explicitLocale !== "en" ? localeFromPath(pathname) : "en";
  const headers = new Headers(request.headers);
  headers.set("x-sgl-locale", locale);

  if (locale !== "en") {
    return NextResponse.next({ request: { headers } });
  }

  const saved = request.cookies.get("sgl_locale")?.value;
  const userAgent = request.headers.get("user-agent") || "";
  if (!botPattern.test(userAgent)) {
    const country = request.headers.get("x-vercel-ip-country")?.toUpperCase();
    const automatic = country
      ? regionLocale(country)
      : browserLocale(request.headers.get("accept-language"));
    const preferred = saved && isLocale(saved) ? saved : automatic;
    if (preferred !== "en") return NextResponse.redirect(new URL(localizedPath(pathname, preferred), request.url));
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|.*\\..*).*)"]
};
