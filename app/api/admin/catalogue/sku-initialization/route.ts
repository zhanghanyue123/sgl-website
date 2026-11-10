import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { initializeApprovedCatalogue } from "@/lib/admin/catalogue-initialization";
import { adminErrorResponse } from "@/lib/admin/http";
import { SKU_INITIALIZATION_CONFIRMATION, SKU_INITIALIZATION_MANIFEST_SHA256 } from "@/lib/admin/sku-standardization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request, "products:write", true);
    if (session.role !== "owner") return NextResponse.json({ error: "Owner role required" }, { status: 403 });
    const body = await request.json() as { manifestSha256?: unknown; confirmation?: unknown };
    if (body.manifestSha256 !== SKU_INITIALIZATION_MANIFEST_SHA256 || body.confirmation !== SKU_INITIALIZATION_CONFIRMATION) {
      return NextResponse.json({ error: "Approved manifest confirmation does not match" }, { status: 409 });
    }
    const result = await initializeApprovedCatalogue({ userId: session.userId, requestId: request.headers.get("x-request-id") });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
