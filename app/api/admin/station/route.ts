import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";
import { getStationAdminView } from "@/lib/integrations/station-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const scope = { organizationId: "00000000-0000-4000-8000-000000000001", storeId: "00000000-0000-4000-8000-000000000004" };

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, "station:read");
    return NextResponse.json(await getStationAdminView(scope), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
