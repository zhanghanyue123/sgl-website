import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

function parse(text) { return Object.fromEntries(text.split(/\r?\n/).filter(line => line.includes("=")).map(line => { const i=line.indexOf("="); return [line.slice(0,i),line.slice(i+1)]; })); }
if (process.env.DEPLOYMENT_ENVIRONMENT !== "preview" || process.env.PAYPAL_ENV !== "sandbox" || !process.env.DATABASE_URL) throw new Error("Refusing status tests outside Preview Sandbox.");
const secure = parse(await readFile("/Users/hanyue/.config/sgl/paypal-sandbox-webhook.env", "utf8"));
const cases = [
  ["PAYMENT.CAPTURE.PENDING", "PENDING", "pending"],
  ["PAYMENT.CAPTURE.DENIED", "DENIED", "denied"],
  ["PAYMENT.CAPTURE.REFUNDED", "REFUNDED", "cancelled"]
];
const sql = postgres(process.env.DATABASE_URL, { ssl: "verify-full", max: 1, prepare: false, connect_timeout: 15 });
const created = [];
try {
  const results = [];
  for (const [eventType, providerStatus, expectedStatus] of cases) {
    const testOrderId=randomUUID(); const orderId=`TESTORDER${randomUUID().replaceAll("-","").slice(0,20).toUpperCase()}`; const captureId=`TESTCAPTURE${randomUUID().replaceAll("-","").slice(0,18).toUpperCase()}`; const eventId=`WH-STATE-${randomUUID().replaceAll("-","").slice(0,20).toUpperCase()}`;
    created.push({ testOrderId, eventId });
    await sql`INSERT INTO paypal_sandbox_test_orders (test_order_id,paypal_order_id,expected_amount_cents,currency) VALUES (${testOrderId},${orderId},100,'USD')`;
    const event={id:eventId,event_type:eventType,resource:{id:captureId,status:providerStatus,amount:{value:"1.00",currency_code:"USD"},supplementary_data:{related_ids:{order_id:orderId}}}};
    const response=await fetch("https://sgl-paypal-sandbox-ops.vercel.app/api/paypal/events",{method:"POST",headers:{Authorization:`Bearer ${secure.PREVIEW_OPS_TOKEN}`,"Content-Type":"application/json","Idempotency-Key":eventId},body:JSON.stringify({environment:"sandbox",event,payloadSha256:createHash("sha256").update(JSON.stringify(event)).digest("hex")})});
    const ack=await response.json(); const rows=await sql`SELECT status FROM paypal_sandbox_test_orders WHERE test_order_id=${testOrderId}`;
    if(!response.ok||ack.orderSyncStatus!==expectedStatus||rows[0]?.status!==expectedStatus) throw new Error(`Projection failed for ${eventType}`);
    results.push({eventType,opsHttp:response.status,projectedStatus:rows[0].status});
  }
  console.info(JSON.stringify({results}));
} finally {
  for(const item of created){await sql`DELETE FROM paypal_sandbox_events WHERE event_id=${item.eventId}`.catch(()=>{});await sql`DELETE FROM paypal_sandbox_test_orders WHERE test_order_id=${item.testOrderId}`.catch(()=>{});}
  await sql.end();
}
