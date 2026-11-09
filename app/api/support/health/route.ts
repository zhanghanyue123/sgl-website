import { NextResponse } from "next/server";
import { friesAdapterConfigurationStatus } from "@/lib/customer-service/fries-agent";
import { sharedRateLimitHealth } from "@/lib/customer-service/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rateLimit = await sharedRateLimitHealth();
  const adapter = friesAdapterConfigurationStatus();
  const deployed = process.env.SGL_FRIES_DEPLOYMENT_STATUS === "deployed";
  const contactConfigured = Boolean(process.env.FRIES_CONTACT_DELIVERY_URL?.trim() && process.env.FRIES_CONTACT_DELIVERY_TOKEN?.trim());
  const chatAvailable = deployed && adapter.configured && rateLimit === "connected";
  return NextResponse.json({
    status: chatAvailable ? "healthy" : "degraded",
    chatAvailable,
    checks: {
      deployment: deployed ? "deployed" : "not_deployed",
      adapter: adapter.configured ? "configured" : "unconfigured",
      rateLimit,
      contactDelivery: contactConfigured ? "configured" : "unconfigured"
    },
    retryAfterSeconds: 60
  }, { status: chatAvailable ? 200 : 503, headers: { "cache-control": "no-store" } });
}
