import { notFound, redirect } from "next/navigation";

const sectionTargets: Record<string, string> = {
  dashboard: "dashboard",
  "pos-sales": "pos-sales",
  products: "products-menu",
  inventory: "inventory",
  bom: "bom-recipes",
  purchasing: "purchasing",
  suppliers: "suppliers",
  staff: "staff",
  attendance: "attendance",
  scheduling: "scheduling",
  reports: "reports",
  settings: "settings",
};

export default async function StationSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const target = sectionTargets[section];
  if (!target) notFound();
  redirect(`/admin/station#${target}`);
}
