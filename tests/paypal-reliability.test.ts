import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parsePayPalOpsEvent } from "../lib/payments/paypal/events";

const now="2026-11-15T12:00:00.000Z";
const orderId="5O190127TN364715T";
const captureId="3Y662965014333303";

test("PayPal webhook parser keeps refund and capture identities separate",()=>{
  const parsed=parsePayPalOpsEvent({
    id:"WH-REFUND-0001",event_type:"PAYMENT.CAPTURE.REFUNDED",create_time:now,
    resource:{id:"1JU08902781691411",status:"COMPLETED",update_time:now,
      amount:{value:"0.40",currency_code:"USD"},
      supplementary_data:{related_ids:{order_id:orderId,capture_id:captureId}}}
  },new Date(now).getTime());
  assert.equal(parsed.paypalOrderId,orderId);
  assert.equal(parsed.captureId,null);
  assert.equal(parsed.refundId,"1JU08902781691411");
  assert.equal(parsed.relatedCaptureId,captureId);
  assert.equal(parsed.amountCents,40);
});

test("PayPal webhook parser accepts approval reversal without inventing a capture",()=>{
  const parsed=parsePayPalOpsEvent({
    id:"WH-REVERSE-0001",event_type:"CHECKOUT.PAYMENT-APPROVAL.REVERSED",create_time:now,
    resource:{id:orderId,status:"REVERSED",update_time:now}
  },new Date(now).getTime());
  assert.equal(parsed.paypalOrderId,orderId);
  assert.equal(parsed.captureId,null);
  assert.equal(parsed.amountCents,null);
});

test("PayPal webhook parser rejects capture events without verified associations",()=>{
  assert.throws(()=>parsePayPalOpsEvent({
    id:"WH-BAD-0000001",event_type:"PAYMENT.CAPTURE.COMPLETED",create_time:now,
    resource:{id:captureId,status:"COMPLETED",update_time:now,amount:{value:"1.00",currency_code:"USD"}}
  },new Date(now).getTime()),/order association/);
});

test("forward migration covers state advancement, refund ledger, reconciliation and concurrency locks",async()=>{
  const migration=await readFile(new URL("../services/paypal-production-ops/migrations/0002_paypal_payment_reliability.sql",import.meta.url),"utf8");
  assert.match(migration,/CREATE OR REPLACE FUNCTION paypal_ops\.save_capture_v2/);
  assert.match(migration,/pg_advisory_xact_lock\(hashtextextended\('paypal-capture:'/);
  assert.match(migration,/existing\.status IN \('COMPLETED','DENIED'\)/);
  assert.match(migration,/CREATE TABLE paypal_ops\.refunds/);
  assert.match(migration,/refund total exceeds|paypal_refund_total_exceeds_capture/);
  assert.match(migration,/payment_status=payment_projection/);
  assert.match(migration,/order_status='payment_review'/);
  assert.match(migration,/paypal_paid_inventory_reconciliation_required/);
  assert.match(migration,/CHECKOUT\.PAYMENT-APPROVAL\.REVERSED/);
  assert.match(migration,/payment\.reconciliation\.required/);
});

test("original PayPal OPS migration remains immutable",async()=>{
  const migration=await readFile(new URL("../services/paypal-production-ops/migrations/0001_paypal_production_ops.sql",import.meta.url),"utf8");
  assert.match(migration,/CREATE SCHEMA IF NOT EXISTS paypal_ops/);
  assert.doesNotMatch(migration,/save_capture_v2|paypal_ops\.refunds|PAYMENT-APPROVAL\.REVERSED/);
});
