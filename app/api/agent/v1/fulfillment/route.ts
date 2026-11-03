import { NextRequest } from "next/server";
import { handleAgentRead } from "@/lib/agent/http";
import { readAgentFulfillment } from "@/lib/agent/read";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { return handleAgentRead(request, "fulfillment:read", "fulfillment.read", async () => ({ fulfillment: await readAgentFulfillment() })); }
