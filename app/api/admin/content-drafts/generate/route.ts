import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";
import { LlmUnavailableError } from "@/lib/ai/provider";
import { generateProductContentDraft } from "@/lib/product-content/service";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request, "content:write", true);
    const body = await request.json();
    if (typeof body?.productId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.productId)) {
      return NextResponse.json({ error: "A valid productId is required" }, { status: 400 });
    }
    const draft = await generateProductContentDraft({ productId: body.productId }, { type: "admin", adminId: session.userId, requestId: request.headers.get("x-request-id") });
    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    if (error instanceof LlmUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    return adminErrorResponse(error);
  }
}
