import { NextRequest } from "next/server";
import { handleAgentRead } from "@/lib/agent/http";
import { readAgentInventory } from "@/lib/agent/read";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { return handleAgentRead(request, "inventory:read", "inventory.read", async () => ({ inventory: await readAgentInventory() })); }
