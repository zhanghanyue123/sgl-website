import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createShipment, updateShipmentStatus } from "@/lib/admin/fulfillment";
import { adminErrorResponse } from "@/lib/admin/http";
import { parseShipment, parseShipmentStatus } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request, "shipping:write", true);
    const input = parseShipment(await request.json());
    const shipmentId = await createShipment(input, session.userId, request.headers.get("x-request-id"));
    return shipmentId ? NextResponse.json({ shipmentId }) : NextResponse.json({ error: "Paid order not found" }, { status: 404 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin(request, "shipping:write", true);
    const input = parseShipmentStatus(await request.json());
    const shipmentId = await updateShipmentStatus(input, session.userId, request.headers.get("x-request-id"));
    return shipmentId ? NextResponse.json({ shipmentId }) : NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
