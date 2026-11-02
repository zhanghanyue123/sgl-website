import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SGL Admin",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true }
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#efefec] text-sglInk">{children}</div>;
}
