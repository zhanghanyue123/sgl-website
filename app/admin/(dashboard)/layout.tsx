import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { currentAdminSession } from "@/lib/admin/current";
import { databaseConfigured } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!databaseConfigured()) redirect("/admin/login");
  const session = await currentAdminSession();
  if (!session) redirect("/admin/login");
  return <div className="lg:grid lg:grid-cols-[220px_1fr]"><AdminNav session={session} /><div className="min-w-0 p-4 md:p-8">{children}</div></div>;
}
