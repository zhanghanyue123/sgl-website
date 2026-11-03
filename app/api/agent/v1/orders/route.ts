import { NextRequest } from "next/server";
import { handleAgentRead } from "@/lib/agent/http";
import { readAgentOrders } from "@/lib/agent/read";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { return handleAgentRead(request, "orders:read", "orders.read", async () => ({ orders: await readAgentOrders() })); }
