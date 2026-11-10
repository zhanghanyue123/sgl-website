import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";
import { releaseHumanHandoff } from "@/lib/customer-service/repository";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request, "support:write", true);
    const { id } = await params;
    const released = await releaseHumanHandoff(id, session.userId);
    return released ? NextResponse.json({ conversationId: released, aiLocked: false }) : NextResponse.json({ error: "Conversation is not waiting for staff" }, { status: 409 });
  } catch (error) { return adminErrorResponse(error); }
}
