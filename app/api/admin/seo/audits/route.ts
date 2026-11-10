import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";
import { runSeoTechnicalAudit } from "@/lib/seo-growth/service";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request, "seo:write", true); const body = await request.json();
    const result = await runSeoTechnicalAudit({ baseUrl: String(body?.baseUrl || ""), maxPages: Number(body?.maxPages || 50) }, { type: "admin", adminId: session.userId, requestId: request.headers.get("x-request-id") });
    return NextResponse.json({ run: result }, { status: 201 });
  } catch (error) { return adminErrorResponse(error); }
}
