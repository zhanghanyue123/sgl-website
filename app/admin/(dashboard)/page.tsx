import { AdminPage, PermissionDenied } from "@/components/admin/AdminPage";
import UnifiedOverviewDashboard from "@/components/admin/UnifiedOverviewDashboard";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { getUnifiedOverview } from "@/lib/admin/unified-overview";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!await currentAdminWithPermission("dashboard:read")) return <PermissionDenied />;
  const overview = await getUnifiedOverview();
  return <AdminPage title="Unified Overview" eyebrow="Commerce · CRM · Agent Operations"><UnifiedOverviewDashboard overview={overview} /></AdminPage>;
}
