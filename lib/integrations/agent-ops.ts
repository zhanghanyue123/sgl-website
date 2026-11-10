import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupportEventLease } from "./outbox";
import { renderPolicyWeCom } from "./wecom-policy";

export type AgentOpsEventV1={
  schemaVersion:"agent-ops.event.v1";eventId:string;idempotencyKey:string;source:"website";
  eventType:"website.conversation_started"|"website.conversation_updated"|"website.handoff_requested"|"website.ticket_created"|"website.ticket_updated";
  severity:"normal"|"high";occurredAt:string;organizationId:string;storeId:string|null;
  subject:{kind:"support_conversation"|"support_ticket";reference:string;verifiedContactRef:null};
  facts:{locale?:string;category?:string;priority?:string;status?:string;intentKind?:string;intentStrength?:string;signal?:string;ticketProgress?:string;humanActionRequired:boolean};
};
export type AgentOpsWeComV1={schemaVersion:"agent-ops.wecom.v1";notificationId:string;dedupeKey:string;source:"website";eventId:string;eventType:AgentOpsEventV1["eventType"];severity:AgentOpsEventV1["severity"];audience:"manager";title:string;summary:string;facts:Array<{label:string;value:string}>;action:{required:boolean;label:string;stationPath:string};createdAt:string};

const eventMap:Record<string,AgentOpsEventV1["eventType"]>={
  "support.conversation.created":"website.conversation_started",
  "support.conversation.updated":"website.conversation_updated",
  "support.ticket.created":"website.ticket_created",
  "support.ticket.updated":"website.ticket_updated",
};

export function mapSupportLeaseToAgentOps(lease:SupportEventLease):AgentOpsEventV1{
  let eventType=eventMap[lease.eventType];
  if(!eventType)throw new Error("unsupported_support_event");
  if(lease.aggregateType!=="support_conversation"&&lease.aggregateType!=="support_ticket")throw new Error("unsupported_support_aggregate");
  if(lease.payload.signal==="human_takeover"&&lease.aggregateType==="support_conversation")eventType="website.handoff_requested";
  return {schemaVersion:"agent-ops.event.v1",eventId:lease.id,idempotencyKey:`website:${lease.id}`,source:"website",eventType,
    severity:lease.payload.humanActionRequired||lease.payload.intentStrength==="high"?"high":"normal",occurredAt:lease.createdAt,
    organizationId:lease.organizationId,storeId:lease.storeId,subject:{kind:lease.aggregateType,reference:lease.aggregateId,verifiedContactRef:null},
    facts:{locale:lease.payload.locale,category:lease.payload.category,priority:lease.payload.priority,status:lease.payload.status,intentKind:lease.payload.intentKind,intentStrength:lease.payload.intentStrength,signal:lease.payload.signal,ticketProgress:lease.payload.ticketProgress,humanActionRequired:lease.payload.humanActionRequired===true}};
}

function stable(value:unknown){return JSON.stringify(value);}
export function signAgentOpsEvent(event:AgentOpsEventV1,secret:string){if(secret.length<24)throw new Error("station_signing_secret_too_short");return createHmac("sha256",secret).update(stable(event)).digest("hex");}
export function verifyAgentOpsEvent(event:AgentOpsEventV1,secret:string,signature:string){const expected=Buffer.from(signAgentOpsEvent(event,secret));const actual=Buffer.from(signature);return expected.length===actual.length&&timingSafeEqual(expected,actual);}

export class MockStationOS{
  private ledger=new Map<string,{event:AgentOpsEventV1;taskId:string|null;unmatchedId:string}>();
  readonly unmatched:string[]=[];readonly tasks:string[]=[];readonly notifications:AgentOpsWeComV1[]=[];
  constructor(private token:string,private secret:string,private organizationId:string){}
  ingest(token:string,event:AgentOpsEventV1,signature:string){
    if(token!==this.token) return {status:401 as const,code:"invalid_token"};
    if(event.schemaVersion!=="agent-ops.event.v1"||event.source!=="website"||event.organizationId!==this.organizationId)return {status:403 as const,code:"scope_denied"};
    if(!verifyAgentOpsEvent(event,this.secret,signature))return {status:401 as const,code:"invalid_signature"};
    const existing=this.ledger.get(event.idempotencyKey);if(existing)return {status:200 as const,code:"duplicate",taskId:existing.taskId,unmatchedId:existing.unmatchedId};
    const unmatchedId=`unmatched:${event.eventId}`;const taskId=event.facts.humanActionRequired?`task:${event.eventId}`:null;
    this.unmatched.push(unmatchedId);if(taskId)this.tasks.push(taskId);
    const notification=renderMockWeCom(event,taskId);if(notification)this.notifications.push(notification);
    this.ledger.set(event.idempotencyKey,{event,taskId,unmatchedId});return {status:201 as const,code:"accepted",taskId,unmatchedId};
  }
}

export function renderMockWeCom(event:AgentOpsEventV1,taskId:string|null):AgentOpsWeComV1|null{
  return renderPolicyWeCom(event,taskId);
}

export class MockWeComDelivery{
  attempts=0;status:"pending"|"delivered"|"delivery_unknown"|"dead_letter"="pending";nextAttemptAt:number|null=null;
  deliver(outcome:"success"|"retryable"|"timeout"|"permanent",now=Date.now()){
    if(this.status!=="pending")return this.status;this.attempts+=1;
    if(outcome==="success")this.status="delivered";
    else if(outcome==="timeout")this.status="delivery_unknown";
    else if(outcome==="permanent"||this.attempts>=5)this.status="dead_letter";
    else this.nextAttemptAt=now+Math.min(300_000,2**this.attempts*1000);
    return this.status;
  }
}

export function processSupportLease(lease:SupportEventLease,station:MockStationOS,token:string,secret:string){
  const event=mapSupportLeaseToAgentOps(lease);const result=station.ingest(token,event,signAgentOpsEvent(event,secret));
  if(result.status===201||result.code==="duplicate")return {action:"ack" as const,eventId:lease.id,receipt:lease.receipt,idempotencyKey:event.idempotencyKey};
  return {action:"nack" as const,eventId:lease.id,receipt:lease.receipt,errorCode:`station.${result.code}`,retryable:result.status>=500};
}
