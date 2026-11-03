import { NextRequest } from "next/server";
import { handleAgentRead } from "@/lib/agent/http";
import { readAgentCatalog } from "@/lib/agent/read";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { return handleAgentRead(request, "catalog:read", "catalog.read", async () => ({ products: await readAgentCatalog() })); }
