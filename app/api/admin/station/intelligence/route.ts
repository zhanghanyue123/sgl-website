import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";
import { getStationAdminView } from "@/lib/integrations/station-admin";
import { buildStationIntelligence } from "@/lib/station-intelligence/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const scope = { organizationId: "00000000-0000-4000-8000-000000000001", storeId: "00000000-0000-4000-8000-000000000004" };

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, "station:read");
    const station = await getStationAdminView(scope);
    const body = await buildStationIntelligence({ connected: station.connected, stale: station.stale, generatedAt: station.generatedAt, receivedAt: station.receivedAt, snapshot: station.data });
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
