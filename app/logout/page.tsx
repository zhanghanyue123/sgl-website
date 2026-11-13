import { LogoutClient } from "@/components/customer/LogoutClient";
export const metadata = { title: "Logout | The Seagull Labs", robots: { index: false, follow: false } };
export default function LogoutPage() { return <main className="mx-auto max-w-xl px-4 py-14 md:px-8"><h1 className="text-5xl font-black uppercase">Log out</h1><LogoutClient /></main>; }
