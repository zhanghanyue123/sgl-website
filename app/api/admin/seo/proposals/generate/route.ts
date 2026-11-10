import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";
import { LlmUnavailableError } from "@/lib/ai/provider";
import { generateSeoOptimizationDraft } from "@/lib/seo-growth/service";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request, "seo:write", true); const body = await request.json();
    if (typeof body?.pageUrl !== "string") return NextResponse.json({ error: "pageUrl is required" }, { status: 400 });
    const draft = await generateSeoOptimizationDraft({ pageUrl: body.pageUrl, productId: typeof body.productId === "string" ? body.productId : null }, { type: "admin", adminId: session.userId, requestId: request.headers.get("x-request-id") });
    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    if (error instanceof LlmUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    return adminErrorResponse(error);
  }
}
