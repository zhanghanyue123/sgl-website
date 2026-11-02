import { randomUUID } from "node:crypto";
import { getDb } from "./db";

export type ShipmentInput = {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  addressConfirmed: true;
};

export type FulfillmentQueueOrder = {
  id: string; order_number: string; customer_name: string | null; customer_email: string | null;
  locale: string; total_cents: number; currency: string; paid_at: Date | null; fulfillment_status: string;
  recipient_name: string | null; line1: string | null; line2: string | null; city: string | null;
  region: string | null; postal_code: string | null; country_code: string | null;
};

export type FulfillmentShipment = {
  id: string; order_id: string; order_number: string; customer_name: string | null; customer_email: string | null;
  carrier: string; tracking_number: string; tracking_url: string | null; status: string;
  dispatched_at: Date | null; actor_email: string;
};

export async function listFulfillmentQueue() {
  return getDb()<FulfillmentQueueOrder[]>`SELECT o.id, o.order_number, o.customer_name, o.customer_email, o.locale,
      o.total_cents, o.currency, o.paid_at, o.fulfillment_status,
      a.recipient_name, a.line1, a.line2, a.city, a.region, a.postal_code, a.country_code
    FROM orders o
    LEFT JOIN order_addresses a ON a.order_id = o.id AND a.address_type = 'shipping'
    WHERE o.payment_status IN ('paid', 'partially_refunded')
      AND o.fulfillment_status IN ('unfulfilled', 'processing')
    ORDER BY o.paid_at, o.created_at`;
}

export async function listShipments() {
  return getDb()<FulfillmentShipment[]>`SELECT s.*, o.order_number, o.customer_name, o.customer_email, u.email AS actor_email
    FROM fulfillment_shipments s
    JOIN orders o ON o.id = s.order_id
    JOIN admin_users u ON u.id = s.created_by
    ORDER BY s.created_at DESC LIMIT 250`;
}

export async function createShipment(input: ShipmentInput, actorUserId: string, requestId?: string | null) {
  const db = getDb();
  return db.begin(async (tx) => {
    const orders = await tx<{ id: string; order_number: string; customer_email: string | null; locale: string; fulfillment_status: string }[]>`SELECT id, order_number, customer_email, locale, fulfillment_status
      FROM orders WHERE id = ${input.orderId} AND payment_status IN ('paid', 'partially_refunded')
        AND fulfillment_status IN ('unfulfilled', 'processing') FOR UPDATE`;
    const order = orders[0];
    if (!order) return null;
    if (!order.customer_email) throw new Error("A customer email is required before shipment");
    const shipmentId = randomUUID();
    await tx`INSERT INTO fulfillment_shipments (
        id, order_id, carrier, tracking_number, tracking_url, status, address_confirmed_at,
        dispatched_at, created_by, updated_by
      ) VALUES (
        ${shipmentId}, ${order.id}, ${input.carrier}, ${input.trackingNumber}, ${input.trackingUrl},
        'shipped', now(), now(), ${actorUserId}, ${actorUserId}
      )`;
    await tx`UPDATE orders SET fulfillment_status = 'shipped', updated_at = now() WHERE id = ${order.id}`;
    await tx`INSERT INTO fulfillment_events (id, shipment_id, order_id, event_type, actor_user_id, data)
      VALUES (${randomUUID()}, ${shipmentId}, ${order.id}, 'shipment.dispatched', ${actorUserId},
        ${tx.json({ carrier: input.carrier, trackingNumber: input.trackingNumber })})`;
    await tx`INSERT INTO order_events (id, order_id, event_type, actor_type, actor_user_id, data)
      VALUES (${randomUUID()}, ${order.id}, 'fulfillment.shipped', 'admin', ${actorUserId},
        ${tx.json({ shipmentId, carrier: input.carrier, trackingNumber: input.trackingNumber })})`;
    await tx`INSERT INTO notification_outbox (
        id, order_id, notification_type, locale, recipient, payload
      ) VALUES (
        ${randomUUID()}, ${order.id}, 'shipment_confirmation', ${order.locale}, ${order.customer_email},
        ${tx.json({ orderNumber: order.order_number, carrier: input.carrier, trackingNumber: input.trackingNumber, trackingUrl: input.trackingUrl })}
      )`;
    await tx`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, after_data, request_id)
      VALUES (${randomUUID()}, ${actorUserId}, 'shipment.create', 'fulfillment_shipment', ${shipmentId},
        ${tx.json({ orderId: order.id, carrier: input.carrier, trackingNumber: input.trackingNumber })}, ${requestId || null})`;
    return shipmentId;
  });
}

export async function updateShipmentStatus(input: { shipmentId: string; status: "delivered" | "cancelled" }, actorUserId: string, requestId?: string | null) {
  const db = getDb();
  return db.begin(async (tx) => {
    const rows = await tx<{ id: string; order_id: string; status: string }[]>`SELECT id, order_id, status FROM fulfillment_shipments WHERE id = ${input.shipmentId} FOR UPDATE`;
    const shipment = rows[0];
    if (!shipment) return null;
    if (shipment.status === input.status) return shipment.id;
    if (shipment.status !== "shipped") throw new Error("Only a shipped parcel can be completed or cancelled");
    const fulfillmentStatus = input.status === "delivered" ? "delivered" : "processing";
    await tx`UPDATE fulfillment_shipments SET status = ${input.status},
      delivered_at = CASE WHEN ${input.status} = 'delivered' THEN now() ELSE delivered_at END,
      updated_by = ${actorUserId}, updated_at = now() WHERE id = ${shipment.id}`;
    await tx`UPDATE orders SET fulfillment_status = ${fulfillmentStatus}, updated_at = now() WHERE id = ${shipment.order_id}`;
    await tx`INSERT INTO fulfillment_events (id, shipment_id, order_id, event_type, actor_user_id, data)
      VALUES (${randomUUID()}, ${shipment.id}, ${shipment.order_id}, ${"shipment." + input.status}, ${actorUserId}, '{}'::jsonb)`;
    await tx`INSERT INTO order_events (id, order_id, event_type, actor_type, actor_user_id, data)
      VALUES (${randomUUID()}, ${shipment.order_id}, ${"fulfillment." + input.status}, 'admin', ${actorUserId},
        ${tx.json({ shipmentId: shipment.id })})`;
    await tx`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, after_data, request_id)
      VALUES (${randomUUID()}, ${actorUserId}, ${"shipment." + input.status}, 'fulfillment_shipment', ${shipment.id},
        ${tx.json({ orderId: shipment.order_id, status: input.status })}, ${requestId || null})`;
    return shipment.id;
  });
}
