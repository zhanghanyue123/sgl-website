import { NextRequest, NextResponse } from "next/server";
import { isLocale, localizedPath, localeFromPath, regionLocale, stripLocale } from "@/lib/i18n";

const botPattern = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|duckduckbot|baiduspider|yandex/i;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const first = pathname.split("/").filter(Boolean)[0];

  if (first === "en") {
    return NextResponse.redirect(new URL(stripLocale(pathname), request.url), 308);
  }

  const locale = first && isLocale(first) ? localeFromPath(pathname) : "en";
  const headers = new Headers(request.headers);
  headers.set("x-sgl-locale", locale);

  if (locale !== "en") {
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set("sgl_locale", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return response;
  }

  const saved = request.cookies.get("sgl_locale")?.value;
  const userAgent = request.headers.get("user-agent") || "";
  if (!botPattern.test(userAgent)) {
    const preferred = saved && isLocale(saved) ? saved : regionLocale(request.headers.get("x-vercel-ip-country"));
    if (preferred !== "en") return NextResponse.redirect(new URL(localizedPath(pathname, preferred), request.url));
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|.*\\..*).*)"]
};
