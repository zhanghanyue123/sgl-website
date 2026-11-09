import { NextResponse } from "next/server";
import { sharedRateLimitHealth } from "@/lib/customer-service/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rateLimit = await sharedRateLimitHealth();
  const llmConfigured = Boolean(process.env.SGL_LLM_BASE_URL && process.env.SGL_LLM_API_KEY && process.env.SGL_LLM_MODEL);
  const deployed = process.env.SGL_FRIES_DEPLOYMENT_STATUS === "deployed";
  const chatAvailable = deployed && llmConfigured && rateLimit === "connected";
  return NextResponse.json({ status: chatAvailable ? "healthy" : "degraded", chatAvailable, checks: { deployment: deployed ? "deployed" : "not_deployed", llm: llmConfigured ? "configured" : "unconfigured", rateLimit }, retryAfterSeconds: 60 }, { status: chatAvailable ? 200 : 503, headers: { "cache-control": "no-store" } });
}
