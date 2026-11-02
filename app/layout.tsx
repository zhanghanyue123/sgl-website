import { CartProvider } from "@/components/CartProvider";
import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import { headers } from "next/headers";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.theseagulllabs.com"),
  title: "The Seagull Labs | Products, Station & City Stories",
  description: "The Seagull Labs connects product design, cycling culture, photography, original characters and community life at Seagull Station.",
  verification: {
    google: "g3m_seOMh_Q8f8M_fOEnKPfjTPbyJpDPiPnvaIRXKDU",
    other: {
      "baidu-site-verification": "codeva-yaPNWwqUEo"
    }
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requested = (await headers()).get("x-sgl-locale") || "en";
  const locale = isLocale(requested) ? requested : "en";
  return (
    <html lang={locale}>
      <body className="min-h-screen bg-sglCream text-sglInk antialiased">
        <CartProvider>
        <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
