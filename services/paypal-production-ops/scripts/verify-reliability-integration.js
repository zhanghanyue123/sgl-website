import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";

const value = process.env.TEST_DATABASE_URL;
if (!value) throw new Error("TEST_DATABASE_URL is required");
const target = new URL(value);
if (!["127.0.0.1","localhost","::1","[::1]"].includes(target.hostname) || target.port === "5432") {
  throw new Error("Reliability integration tests require a non-default loopback PostgreSQL target");
}
const sql = postgres(value,{max:8,prepare:false});
const organizationId="00000000-0000-4000-8000-000000000001";
const storeId="00000000-0000-4000-8000-000000000002";
const warehouseId="00000000-0000-4000-8000-000000000003";
let sequence=0;
const stamp=()=>new Date(Date.now()+(++sequence)*1000);
const providerId=(prefix)=>`${prefix}${randomUUID().replaceAll("-","").toUpperCase().slice(0,16)}`;
const digest=(value)=>createHash("sha256").update(value).digest("hex");

async function baseData(){
  await sql`INSERT INTO organizations(id,slug,name) VALUES(${organizationId},'paypal-test','PayPal Test') ON CONFLICT(id) DO NOTHING`;
  await sql`INSERT INTO stores(id,organization_id,slug,name) VALUES(${storeId},${organizationId},'paypal-test','PayPal Test') ON CONFLICT(id) DO NOTHING`;
  await sql`INSERT INTO warehouses(id,organization_id,store_id,code,name) VALUES(${warehouseId},${organizationId},${storeId},'PAYPAL-TEST','PayPal Test') ON CONFLICT(id) DO NOTHING`;
}

async function paymentScenario(name,{expired=false,amount=100}={}){
  const orderId=randomUUID(), paypalOrderId=providerId("O"), request=digest(name+orderId);
  await sql`INSERT INTO orders(
    id,order_number,locale,currency,items_subtotal_cents,total_cents,order_status,payment_status,
    reservation_expires_at,idempotency_key,request_hash,organization_id,store_id,warehouse_id
  ) VALUES(
    ${orderId},${`SGL-${name}-${orderId.slice(0,8)}`} ,'en','USD',${amount},${amount},'pending_payment','pending',
    ${new Date(Date.now()+(expired?-60_000:3_600_000))},${`order-${name}-${orderId}`},${request},${organizationId},${storeId},${warehouseId}
  )`;
  const registered=await sql`SELECT paypal_ops.register_order(
    ${orderId}::uuid,${paypalOrderId},${amount},'USD',${request},${`paypal-order-${paypalOrderId}`}
  ) result`;
  assert.equal(registered[0].result.status,"created");
  return {orderId,paypalOrderId,amount,captureId:providerId("C")};
}

async function capture(s,status,occurredAt=stamp(),eventId=providerId("EV")){
  const rows=await sql`SELECT paypal_ops.save_capture_v2(
    ${s.paypalOrderId},${s.captureId},${status},${s.amount},'USD',${`capture-${eventId}`},${occurredAt},${eventId}
  ) result`;
  return rows[0].result;
}

async function webhook({eventId=providerId("WH"),eventType,paypalOrderId,captureId=null,refundId=null,
  relatedCaptureId=null,amount=null,status=null,occurredAt=stamp()}){
  const rows=await sql`SELECT paypal_ops.save_webhook_v2(
    ${eventId},${eventType},${digest(eventId+eventType)},${paypalOrderId},${captureId},${refundId},
    ${relatedCaptureId},${status},${amount},${amount===null?null:"USD"},${occurredAt}
  ) result`;
  return {eventId,result:rows[0].result};
}

async function projections(orderId){
  const [row]=await sql`SELECT o.order_status,o.payment_status,p.status payment_status_ledger,
    p.captured_amount_cents,p.refunded_amount_cents
    FROM orders o JOIN payments p ON p.order_id=o.id WHERE o.id=${orderId}`;
  return row;
}

await baseData();
const results={};

const advanced=await paymentScenario("advance");
const pendingAt=stamp();
assert.equal((await capture(advanced,"PENDING",pendingAt)).status,"created");
assert.equal((await capture(advanced,"PENDING",pendingAt)).status,"duplicate");
assert.equal((await capture(advanced,"COMPLETED",stamp())).status,"updated");
assert.equal((await capture(advanced,"COMPLETED",stamp())).status,"duplicate");
assert.equal((await capture(advanced,"PENDING",new Date(pendingAt.getTime()-5000))).status,"stale");
assert.deepEqual(await projections(advanced.orderId),{
  order_status:"confirmed",payment_status:"paid",payment_status_ledger:"paid",captured_amount_cents:100,refunded_amount_cents:0
});
assert.equal((await sql`SELECT count(*)::int n FROM paypal_ops.captures WHERE capture_id=${advanced.captureId}`)[0].n,1);
results.pendingToCompleted=true;

const denied=await paymentScenario("denied");
await capture(denied,"PENDING");
assert.equal((await capture(denied,"DENIED")).status,"updated");
assert.deepEqual(await projections(denied.orderId),{
  order_status:"cancelled",payment_status:"cancelled",payment_status_ledger:"failed",captured_amount_cents:0,refunded_amount_cents:0
});
results.pendingToDenied=true;

const conflict=await capture(advanced,"DENIED",stamp(),providerId("EV"));
assert.equal(conflict.status,"requires_review");
assert.equal((await projections(advanced.orderId)).payment_status,"paid");
results.terminalProtection=true;

const concurrent=await paymentScenario("concurrent");
const concurrentEvent=providerId("WH");
const concurrentTime=stamp();
const calls=await Promise.all([1,2,3,4].map(()=>webhook({
  eventId:concurrentEvent,eventType:"PAYMENT.CAPTURE.PENDING",paypalOrderId:concurrent.paypalOrderId,
  captureId:concurrent.captureId,amount:100,status:"PENDING",occurredAt:concurrentTime
})));
assert.equal(calls.filter(x=>x.result.status==="duplicate").length,3);
assert.equal((await sql`SELECT count(*)::int n FROM paypal_ops.webhook_events WHERE event_id=${concurrentEvent}`)[0].n,1);
assert.equal((await sql`SELECT delivery_count FROM paypal_ops.webhook_events WHERE event_id=${concurrentEvent}`)[0].delivery_count,4);
results.concurrentWebhook=true;

const refunded=await paymentScenario("refund",{amount:100});
await capture(refunded,"COMPLETED");
const partial=await webhook({eventType:"PAYMENT.CAPTURE.REFUNDED",paypalOrderId:refunded.paypalOrderId,
  refundId:providerId("R"),relatedCaptureId:refunded.captureId,amount:40,status:"COMPLETED"});
assert.equal(partial.result.paymentStatus,"partially_refunded");
assert.equal((await projections(refunded.orderId)).refunded_amount_cents,40);
const full=await webhook({eventType:"PAYMENT.CAPTURE.REFUNDED",paypalOrderId:refunded.paypalOrderId,
  refundId:providerId("R"),relatedCaptureId:refunded.captureId,amount:60,status:"COMPLETED"});
assert.equal(full.result.paymentStatus,"refunded");
assert.deepEqual(await projections(refunded.orderId),{
  order_status:"confirmed",payment_status:"refunded",payment_status_ledger:"refunded",captured_amount_cents:100,refunded_amount_cents:100
});
const duplicateRefund=await webhook({eventId:partial.eventId,eventType:"PAYMENT.CAPTURE.REFUNDED",paypalOrderId:refunded.paypalOrderId,
  refundId:(await sql`SELECT refund_id FROM paypal_ops.refunds WHERE event_id=${partial.eventId}`)[0].refund_id,
  relatedCaptureId:refunded.captureId,amount:40,status:"COMPLETED",occurredAt:stamp()});
assert.equal(duplicateRefund.result.status,"duplicate");
assert.equal((await sql`SELECT count(*)::int n FROM paypal_ops.refunds WHERE payment_id=(SELECT id FROM payments WHERE order_id=${refunded.orderId})`)[0].n,2);
results.partialAndFullRefund=true;

const refundOverflow=await paymentScenario("refund-overflow",{amount:100});
await capture(refundOverflow,"COMPLETED");
const acceptedRefund=await webhook({eventType:"PAYMENT.CAPTURE.REFUNDED",paypalOrderId:refundOverflow.paypalOrderId,
  refundId:providerId("R"),relatedCaptureId:refundOverflow.captureId,amount:70,status:"COMPLETED"});
assert.equal(acceptedRefund.result.paymentStatus,"partially_refunded");
const rejectedRefund=await webhook({eventType:"PAYMENT.CAPTURE.REFUNDED",paypalOrderId:refundOverflow.paypalOrderId,
  refundId:providerId("R"),relatedCaptureId:refundOverflow.captureId,amount:40,status:"COMPLETED"});
assert.equal(rejectedRefund.result.status,"requires_review");
assert.equal((await projections(refundOverflow.orderId)).refunded_amount_cents,70);
assert.equal((await sql`SELECT count(*)::int n FROM paypal_ops.refunds WHERE payment_id=(SELECT id FROM payments WHERE order_id=${refundOverflow.orderId})`)[0].n,1);
assert.equal((await sql`SELECT count(*)::int n FROM payment_reconciliation_issues WHERE order_id=${refundOverflow.orderId} AND issue_code='paypal_refund_total_exceeds_capture'`)[0].n,1);
results.refundOverflowProtection=true;

const reversed=await paymentScenario("reversed");
await capture(reversed,"COMPLETED");
const reversal=await webhook({eventType:"PAYMENT.CAPTURE.REVERSED",paypalOrderId:reversed.paypalOrderId,
  captureId:reversed.captureId,amount:100,status:"REVERSED"});
assert.equal(reversal.result.status,"requires_review");
assert.equal((await projections(reversed.orderId)).payment_status,"disputed");
results.reversal=true;

const expired=await paymentScenario("expired",{expired:true});
const expiredCapture=await capture(expired,"COMPLETED");
assert.equal(expiredCapture.status,"requires_review");
assert.deepEqual(await projections(expired.orderId),{
  order_status:"payment_review",payment_status:"paid",payment_status_ledger:"paid",captured_amount_cents:100,refunded_amount_cents:0
});
assert.equal((await sql`SELECT count(*)::int n FROM payment_reconciliation_issues WHERE order_id=${expired.orderId} AND issue_code='paypal_paid_inventory_reconciliation_required'`)[0].n,1);
assert.equal((await sql`SELECT count(*)::int n FROM integration_outbox WHERE aggregate_id=${expired.orderId}::text AND event_type='payment.reconciliation.required'`)[0].n,1);
results.expiredReservationRecovery=true;

const approval=await paymentScenario("approval-reversed");
const approvalResult=await webhook({eventType:"CHECKOUT.PAYMENT-APPROVAL.REVERSED",paypalOrderId:approval.paypalOrderId,status:"REVERSED"});
assert.equal(approvalResult.result.status,"processed");
assert.equal((await projections(approval.orderId)).order_status,"cancelled");
results.approvalReversed=true;

console.log(JSON.stringify({paypalPaymentReliability:results},null,2));
await sql.end({timeout:2});
