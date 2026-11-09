import { NextResponse } from "next/server";
import { friesAdapterConfigurationStatus } from "@/lib/customer-service/fries-agent";
import { sharedRateLimitHealth } from "@/lib/customer-service/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rateLimit = await sharedRateLimitHealth();
  const adapter = friesAdapterConfigurationStatus();
  const deployment = process.env.SGL_FRIES_DEPLOYMENT_STATUS;
  const deployed = deployment === "deployed" || deployment === "connected";
  const chatAvailable = deployed && adapter.configured && rateLimit === "connected";
  return NextResponse.json({
    status: chatAvailable ? "healthy" : "degraded",
    chatAvailable,
    checks: { deployment: deployed ? "deployed" : "not_deployed", adapter: adapter.configured ? "configured" : "unconfigured", rateLimit },
    retryAfterSeconds: 60
  }, { status: chatAvailable ? 200 : 503, headers: { "cache-control": "no-store" } });
}
