import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { agentErrorResponse } from "@/lib/agent/http";
import { logAgentAction, requireAgent, type AgentContext } from "@/lib/agent/auth";
import { validateOperationsSnapshot } from "@/lib/agent/operations-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let context: AgentContext | undefined;
  try {
    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > 64 * 1024) return NextResponse.json({ error: "Snapshot exceeds 64 KiB" }, { status: 413 });
    context = await requireAgent(request, "operations:snapshot:write");
    const snapshot = validateOperationsSnapshot(await request.json(), context);
    await logAgentAction(request, context, "agent.operations.snapshot", "success", { type: "agent", id: snapshot.source }, snapshot);
    revalidateTag("admin-agent-operations", { expire: 0 });
    revalidateTag("admin-overview", { expire: 0 });
    return NextResponse.json({ accepted: true, source: snapshot.source, acceptedAt: new Date().toISOString() });
  } catch (error) {
    if (context) await logAgentAction(request, context, "agent.operations.snapshot", "failed", undefined, { error: error instanceof Error ? error.message.slice(0, 200) : "unknown" });
    return agentErrorResponse(error);
  }
}
