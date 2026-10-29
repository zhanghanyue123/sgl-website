import Stripe from "stripe";
import { errorResponse, getStripe, opsRequest } from "@/lib/store/server";
export const runtime = "nodejs";
const supported = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired", "charge.refunded", "charge.dispute.created", "charge.dispute.closed"]);
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    const raw = await request.text();
    if (raw.length > 1000000) return Response.json({ error: "Payload too large." }, { status: 413 });
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch { return Response.json({ error: "Invalid signature or webhook configuration." }, { status: 400 }); }
  const live = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ?? false;
  if (event.livemode !== live) return Response.json({ error: "Payment mode mismatch." }, { status: 400 });
  if (!supported.has(event.type)) return Response.json({ received: true });
  try {
    // OPS must persist/deduplicate this event and reconcile the quote in one transaction.
    // A failed or unconfigured OPS returns non-2xx so Stripe retries; never silently discard.
    const ack = await opsRequest("/payments/stripe/events", event, event.id) as { eventId?: string; persisted?: boolean };
    if (ack?.persisted !== true || ack.eventId !== event.id) return Response.json({ error: "Event was not durably acknowledged." }, { status: 503 });
    return Response.json({ received: true });
  } catch (error) { return errorResponse(error); }
}
