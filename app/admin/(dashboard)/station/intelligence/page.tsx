import { PermissionDenied } from "@/components/admin/AdminPage";
import StationIntelligenceDashboard from "@/components/station-os/StationIntelligenceDashboard";
import { currentAdminWithPermission } from "@/lib/admin/current";
import { getStationAdminView } from "@/lib/integrations/station-admin";
import { buildStationIntelligence } from "@/lib/station-intelligence/service";

export const dynamic = "force-dynamic";
const scope = { organizationId: "00000000-0000-4000-8000-000000000001", storeId: "00000000-0000-4000-8000-000000000004" };

export default async function StationIntelligencePage() {
  const session = await currentAdminWithPermission("station:read");
  if (!session) return <PermissionDenied />;
  const station = await getStationAdminView(scope);
  const view = await buildStationIntelligence({ connected: station.connected, stale: station.stale, generatedAt: station.generatedAt, receivedAt: station.receivedAt, snapshot: station.data });
  return <StationIntelligenceDashboard view={view} />;
}
