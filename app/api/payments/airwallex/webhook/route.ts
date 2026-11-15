import { getAirwallexWebhookConfig } from "@/lib/payments/airwallex/config";
import { readBoundedRequestBody, RequestBodyError } from "@/lib/http/read-bounded-body";
import { persistAndApplyAirwallexWebhook } from "@/lib/payments/airwallex/webhook-service";
import {
  AirwallexWebhookError,
  parseVerifiedAirwallexWebhook,
  verifyAirwallexWebhookSignature
} from "@/lib/payments/airwallex/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 1_000_000;

export async function POST(request: Request) {
  try {
    const rawBody = await readBoundedRequestBody(request, MAX_BODY_BYTES);
    if (!rawBody.length) return Response.json({ error: "Webhook body is invalid" }, { status: 400 });
    const config = getAirwallexWebhookConfig();
    const timestampMs = verifyAirwallexWebhookSignature({
      rawBody,
      timestamp: request.headers.get("x-timestamp"),
      signature: request.headers.get("x-signature"),
      secret: config.secret
    });
    const event = parseVerifiedAirwallexWebhook({
      rawBody,
      timestampMs,
      expectedAccountId: config.expectedAccountId,
      expectedApiVersion: config.apiVersion
    });
    const result = await persistAndApplyAirwallexWebhook(event);
    return Response.json({ received: true, duplicate: result.duplicate }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    if (error instanceof AirwallexWebhookError) {
      return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("[airwallex-webhook] durable processing failed");
    return Response.json({ error: "Webhook could not be persisted" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
