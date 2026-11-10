import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";
import { LlmUnavailableError } from "@/lib/ai/provider";
import { generateMarketingDraft } from "@/lib/marketing/service";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request, "marketing:write", true);
    const body = await request.json();
    if (typeof body?.weekStart !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.weekStart)) {
      return NextResponse.json({ error: "weekStart must use YYYY-MM-DD" }, { status: 400 });
    }
    const draft = await generateMarketingDraft({ weekStart: body.weekStart }, { type: "admin", adminId: session.userId, requestId: request.headers.get("x-request-id") });
    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    if (error instanceof LlmUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    return adminErrorResponse(error);
  }
}
