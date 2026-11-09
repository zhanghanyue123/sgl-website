import { NextRequest, NextResponse } from "next/server";
import { deliverContactSubmission, validateContactSubmission } from "@/lib/customer-service/contact";
import { recordContactDelivery, recordContactFailure, reserveContactSubmission } from "@/lib/customer-service/contact-repository";
import { assertPublicMutation, consumePublicRateLimit, rateLimitKey, readPublicJson } from "@/lib/customer-service/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let reservation: { id: string; status: string; created: boolean } | null = null;
  try {
    assertPublicMutation(request);
    if (!await consumePublicRateLimit(rateLimitKey(request, "support:contact"), 3, 10 * 60_000)) return NextResponse.json({ error: "Please wait before sending another message." }, { status: 429 });
    const input = validateContactSubmission(await readPublicJson(request, 16_384), request.headers.get("idempotency-key"));
    reservation = await reserveContactSubmission(input);
    if (!reservation.created) {
      if (reservation.status === "sent") return NextResponse.json({ sent: true, duplicate: true });
      return NextResponse.json({ error: "This message is already being processed." }, { status: 409 });
    }
    const delivery = await deliverContactSubmission(input);
    await recordContactDelivery(reservation.id, delivery);
    return NextResponse.json({ sent: true }, { status: 201 });
  } catch (error) {
    if (reservation?.created) await recordContactFailure(reservation.id, error instanceof Error ? error.message : "unknown_error").catch(() => undefined);
    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500;
    return NextResponse.json({ error: status >= 500 ? "We could not send your message. Please try again." : (error as Error).message }, { status });
  }
}
