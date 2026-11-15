import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";

const value = process.env.OWNER_DATABASE_URL;
if (!value) throw new Error("OWNER_DATABASE_URL is required");
const parsed = new URL(value);
parsed.searchParams.set("sslmode", "verify-full");
const sql = postgres(parsed.href, { ssl: "verify-full", max: 1, prepare: false });
const conn = await sql.reserve();
const orderId = randomUUID();
const orderKey = `paypal-ops-rollback-${randomUUID()}`;
const requestHash = createHash("sha256").update(orderKey).digest("hex");
const paypalOrderId = "5O190127TN364715T";
const captureId = "3Y662965014333303";
let result = {};
try {
  await conn.unsafe("BEGIN");
  await conn`INSERT INTO orders(id,order_number,locale,currency,items_subtotal_cents,total_cents,order_status,payment_status,
    reservation_expires_at,idempotency_key,request_hash)
    VALUES(${orderId},${`SGL-OPS-ROLLBACK-${orderId.slice(0,8)}`} ,'en','USD',100,100,'pending_payment','pending',
    now()+interval '1 hour',${orderKey},${requestHash})`;
  await conn.unsafe("SET LOCAL ROLE sgl_paypal_ops_runtime");
  const first = await conn`SELECT paypal_ops.register_order(${orderId}::uuid,${paypalOrderId},100,'USD',${requestHash},${`paypal-order-${paypalOrderId}`}) result`;
  const duplicate = await conn`SELECT paypal_ops.register_order(${orderId}::uuid,${paypalOrderId},100,'USD',${requestHash},${`paypal-order-${paypalOrderId}`}) result`;
  const context = await conn`SELECT paypal_ops.capture_context(${paypalOrderId}) result`;
  const capture = await conn`SELECT paypal_ops.save_capture(${paypalOrderId},${captureId},'PENDING',100,'USD',${`paypal-capture-${captureId}`}) result`;
  const captureDuplicate = await conn`SELECT paypal_ops.save_capture(${paypalOrderId},${captureId},'PENDING',100,'USD',${`paypal-capture-${captureId}`}) result`;
  const eventId = "WH-OPS-ROLLBACK-0001";
  const event = await conn`SELECT paypal_ops.save_webhook(${eventId},'CHECKOUT.ORDER.APPROVED',${requestHash},${paypalOrderId},null,'APPROVED',null,null) result`;
  const eventDuplicate = await conn`SELECT paypal_ops.save_webhook(${eventId},'CHECKOUT.ORDER.APPROVED',${requestHash},${paypalOrderId},null,'APPROVED',null,null) result`;
  result = {
    association: first[0].result.status,
    associationReplay: duplicate[0].result.status,
    contextMatches: context[0].result.orderId === orderId,
    capture: capture[0].result.status,
    captureReplay: captureDuplicate[0].result.status,
    webhook: event[0].result.status,
    webhookReplay: eventDuplicate[0].result.status
  };
} finally {
  try { await conn.unsafe("ROLLBACK"); } finally { conn.release(); }
}
const counts = await sql`SELECT
  (SELECT count(*)::int FROM paypal_ops.payment_associations) associations,
  (SELECT count(*)::int FROM paypal_ops.captures) captures,
  (SELECT count(*)::int FROM paypal_ops.webhook_events) webhook_events,
  (SELECT count(*)::int FROM payments WHERE provider='paypal') paypal_payments,
  (SELECT count(*)::int FROM orders) orders`;
await sql.end({ timeout: 2 });
console.log(JSON.stringify({ transactionalAcceptance: result, afterRollback: counts[0] }));
