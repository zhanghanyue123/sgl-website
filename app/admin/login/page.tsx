import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { databaseConfigured } from "@/lib/admin/db";
import { currentAdminSession } from "@/lib/admin/current";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (databaseConfigured() && await currentAdminSession()) redirect("/admin");
  return <section className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-16"><div className="w-full border border-sglInk bg-sglPaper p-8 shadow-[10px_10px_0_#d9ff43]"><p className="text-sm font-black uppercase tracking-[0.28em]">The Seagull Labs</p><h1 className="mt-3 text-5xl font-black uppercase">Admin</h1><p className="mt-5 leading-7 opacity-70">Authorized staff only. Sessions expire after twelve hours and critical changes are recorded.</p><LoginForm configured={databaseConfigured()} /></div></section>;
}
