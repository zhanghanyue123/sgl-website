import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { listInventory } from "@/lib/admin/catalog";
import { adminErrorResponse } from "@/lib/admin/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, "inventory:read");
    return NextResponse.json({ inventory: await listInventory() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
