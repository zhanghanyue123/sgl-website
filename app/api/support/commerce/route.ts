import { NextRequest, NextResponse } from "next/server";
import { executeCommerceTool, isCommerceToolName, CommerceToolError } from "@/lib/customer-service/commerce-tools";
import { readCommerceCustomerSession } from "@/lib/customer-service/customer-session";
import { assertPublicMutation, consumePublicRateLimit, rateLimitKey, readPublicJson } from "@/lib/customer-service/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertPublicMutation(request);
    if (!await consumePublicRateLimit(rateLimitKey(request, "support:commerce"), 20)) {
      return NextResponse.json({ error: "Please wait before making another request." }, { status: 429 });
    }
    const body = await readPublicJson(request, 16_384) as Record<string, unknown>;
    if (!isCommerceToolName(body.tool)) return NextResponse.json({ error: "Unsupported commerce tool" }, { status: 400 });
    const session = await readCommerceCustomerSession(request);
    const result = await executeCommerceTool(body.tool, body.input, { session });
    return NextResponse.json({ tool: body.tool, result }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    if (error instanceof CommerceToolError) return NextResponse.json({ error: error.message }, { status: error.status });
    const status = typeof (error as { status?: unknown })?.status === "number" ? Number((error as { status: number }).status) : null;
    if (status && status >= 400 && status < 500) return NextResponse.json({ error: (error as Error).message }, { status });
    console.error("[fries-commerce]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Commerce information is temporarily unavailable" }, { status: 503 });
  }
}
