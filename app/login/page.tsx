import { CustomerAuthForm } from "@/components/customer/CustomerAuthForm";
export const metadata = { title: "Login | The Seagull Labs", robots: { index: false, follow: false } };
export default function LoginPage() { return <main className="mx-auto max-w-xl px-4 py-14 md:px-8"><p className="text-sm font-black uppercase tracking-[.25em] opacity-60">SGL Customer Account</p><h1 className="mt-2 text-5xl font-black uppercase">Log in</h1><CustomerAuthForm mode="login" /></main>; }
