import { CartProvider } from "@/components/CartProvider";
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SGL | Seagull Station",
  description: "Urban riding goods, station life, and everyday movement."
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
