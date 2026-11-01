import { CartProvider } from "@/components/CartProvider";
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.theseagulllabs.com"),
  title: "SGL | Seagull Station",
  description: "Urban riding goods, station life, and everyday movement.",
  verification: {
    google: "g3m_seOMh_Q8f8M_fOEnKPfjTPbyJpDPiPnvaIRXKDU",
    other: {
      "baidu-site-verification": "e324d8ff2d51c320052374e334b9c3de"
    }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sglCream text-sglInk antialiased">
        <CartProvider>
        <Header />
        <main>{children}</main>
        <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
