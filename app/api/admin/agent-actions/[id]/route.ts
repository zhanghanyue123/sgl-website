import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";
import { AgentValidationError } from "@/lib/agent/http";
import { reviewAgentAction } from "@/lib/agent/service";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request, "agents:approve", true); const body = await request.json();
    if (body?.status !== "approved" && body?.status !== "rejected") return NextResponse.json({ error: "Status must be approved or rejected" }, { status: 400 });
    const { id } = await params; const result = await reviewAgentAction(id, body.status, body.note, session.userId, request.headers.get("x-request-id"));
    return result ? NextResponse.json({ id, status: body.status, execution: "manual" }) : NextResponse.json({ error: "Pending proposal not found" }, { status: 404 });
  } catch (error) { return error instanceof AgentValidationError ? NextResponse.json({ error: error.message }, { status: 400 }) : adminErrorResponse(error); }
}
