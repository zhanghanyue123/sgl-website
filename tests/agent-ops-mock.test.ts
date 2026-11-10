import assert from "node:assert/strict";
import test from "node:test";
import {MockStationOS,MockWeComDelivery,mapSupportLeaseToAgentOps,processSupportLease,signAgentOpsEvent} from "../lib/integrations/agent-ops";
import type {SupportEventLease} from "../lib/integrations/outbox";

const lease:SupportEventLease={id:"123e4567-e89b-42d3-a456-426614174000",organizationId:"00000000-0000-4000-8000-000000000001",storeId:"00000000-0000-4000-8000-000000000002",eventType:"support.conversation.updated",aggregateType:"support_conversation",aggregateId:"conversation-1",payload:{locale:"zh-CN",humanActionRequired:true,intentKind:"wholesale_retail_partnership",intentStrength:"high"},createdAt:"2026-11-08T00:00:00.000Z",leaseExpiresAt:"2026-11-08T00:01:00.000Z",receipt:"r".repeat(43)};
const token="mock-station-token-at-least-24-chars",secret="mock-signing-secret-at-least-24-chars";

test("mock Station verifies token, signature, tenant and idempotent unmatched effects",()=>{
  const station=new MockStationOS(token,secret,lease.organizationId);const event=mapSupportLeaseToAgentOps(lease);const signature=signAgentOpsEvent(event,secret);
  assert.equal(station.ingest("wrong",event,signature).status,401);
  assert.equal(station.ingest(token,event,"0".repeat(64)).status,401);
  assert.equal(station.ingest(token,event,signature).code,"accepted");
  assert.equal(station.ingest(token,event,signature).code,"duplicate");
  assert.equal(station.unmatched.length,1);assert.equal(station.tasks.length,1);assert.equal(station.notifications.length,1);
  assert.doesNotMatch(JSON.stringify(station.notifications[0]),/@|conversation message/i);
});

test("connector ACKs committed and replayed effects and NACKs auth failures",()=>{
  const station=new MockStationOS(token,secret,lease.organizationId);
  assert.equal(processSupportLease(lease,station,token,secret).action,"ack");
  assert.equal(processSupportLease(lease,station,token,secret).action,"ack");
  assert.equal(processSupportLease(lease,station,"wrong",secret).action,"nack");
});

test("mock WeCom handles backoff, timeout ambiguity and dead letter",()=>{
  const retry=new MockWeComDelivery();assert.equal(retry.deliver("retryable",1000),"pending");assert.ok((retry.nextAttemptAt||0)>1000);
  assert.equal(retry.deliver("permanent"),"dead_letter");
  const timeout=new MockWeComDelivery();assert.equal(timeout.deliver("timeout"),"delivery_unknown");assert.equal(timeout.deliver("success"),"delivery_unknown");
  const success=new MockWeComDelivery();assert.equal(success.deliver("success"),"delivered");
});
