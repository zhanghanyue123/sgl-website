import { NextRequest } from "next/server";
import { handleAgentRead } from "@/lib/agent/http";
import { readAgentAnalytics } from "@/lib/agent/read";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { return handleAgentRead(request, "analytics:read", "analytics.read", async () => ({ analytics: await readAgentAnalytics() })); }
