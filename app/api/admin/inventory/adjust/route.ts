import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { adjustAdminInventory } from "@/lib/admin/catalog";
import { adminErrorResponse } from "@/lib/admin/http";
import { parseInventoryAdjustment } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request, "inventory:adjust", true);
    const input = parseInventoryAdjustment(await request.json());
    const inventory = await adjustAdminInventory(input, { userId: session.userId, requestId: request.headers.get("x-request-id") });
    if (inventory) revalidateTag("admin-overview", { expire: 0 });
    return inventory ? NextResponse.json({ inventory }) : NextResponse.json({ error: "Variant not found" }, { status: 404 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
