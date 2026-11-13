import { VerifyEmailClient } from "@/components/customer/VerifyEmailClient";
export const metadata = { title: "Verify email | The Seagull Labs", robots: { index: false, follow: false } };
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const raw = (await searchParams).token; const token = typeof raw === "string" ? raw : "";
  return <main className="mx-auto max-w-xl px-4 py-14 md:px-8"><p className="text-sm font-black uppercase tracking-[.25em] opacity-60">SGL Customer Account</p><h1 className="mt-2 text-5xl font-black uppercase">Verify email</h1>{token ? <VerifyEmailClient token={token} /> : <p className="mt-8 font-bold">The verification link is incomplete.</p>}</main>;
}
