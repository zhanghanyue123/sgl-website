import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { airwallexAmountToCents, normalizeAirwallexCurrency } from "./money";

const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000;
const PAYMENT_EVENTS = new Set([
  "payment_intent.created",
  "payment_intent.updated",
  "payment_intent.requires_payment_method",
  "payment_intent.requires_customer_action",
  "payment_intent.requires_capture",
  "payment_intent.pending",
  "payment_intent.pending_review",
  "payment_intent.succeeded",
  "payment_intent.cancelled",
  "payment_intent.payment_failed"
]);
const REFUND_EVENTS = new Set(["refund.received", "refund.accepted", "refund.settled", "refund.failed"]);
const EVENT_STATUSES: Record<string, string> = {
  "payment_intent.created": "REQUIRES_PAYMENT_METHOD",
  "payment_intent.requires_payment_method": "REQUIRES_PAYMENT_METHOD",
  "payment_intent.requires_customer_action": "REQUIRES_CUSTOMER_ACTION",
  "payment_intent.requires_capture": "REQUIRES_CAPTURE",
  "payment_intent.pending": "PENDING",
  "payment_intent.pending_review": "PENDING_REVIEW",
  "payment_intent.succeeded": "SUCCEEDED",
  "payment_intent.cancelled": "CANCELLED",
  "payment_intent.payment_failed": "REQUIRES_PAYMENT_METHOD",
  "refund.received": "RECEIVED",
  "refund.accepted": "ACCEPTED",
  "refund.settled": "SETTLED",
  "refund.failed": "FAILED"
};

type JsonObject = Record<string, unknown>;

export type VerifiedAirwallexWebhook = {
  externalEventId: string;
  eventType: string;
  apiVersion: string;
  accountId: string;
  organizationId: string | null;
  resourceType: "payment_intent" | "refund";
  resourceId: string;
  parentResourceId: string | null;
  providerRequestId: string | null;
  internalReference: string | null;
  merchantOrderId: string | null;
  amountCents: number;
  currency: string;
  providerStatus: string;
  occurredAt: Date;
  signatureTimestampMs: number;
  payloadSha256: string;
  sanitizedPayload: JsonObject;
};

export class AirwallexWebhookError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function object(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
}

export function signAirwallexWebhookForTest(secret: string, timestamp: string, rawBody: Uint8Array | string) {
  const body = typeof rawBody === "string" ? Buffer.from(rawBody) : Buffer.from(rawBody);
  return createHmac("sha256", secret).update(timestamp).update(body).digest("hex");
}

export function verifyAirwallexWebhookSignature(input: {
  rawBody: Uint8Array;
  timestamp: string | null;
  signature: string | null;
  secret: string;
  nowMs?: number;
}) {
  if (!input.timestamp || !/^\d{13}$/.test(input.timestamp) || !input.signature || !/^[0-9a-f]{64}$/i.test(input.signature)) {
    throw new AirwallexWebhookError(401, "Invalid Airwallex webhook signature");
  }
  const timestampMs = Number(input.timestamp);
  if (!Number.isSafeInteger(timestampMs) || Math.abs((input.nowMs ?? Date.now()) - timestampMs) > MAX_WEBHOOK_AGE_MS) {
    throw new AirwallexWebhookError(401, "Stale Airwallex webhook");
  }
  const expected = Buffer.from(signAirwallexWebhookForTest(input.secret, input.timestamp, input.rawBody), "hex");
  const actual = Buffer.from(input.signature, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new AirwallexWebhookError(401, "Invalid Airwallex webhook signature");
  }
  return timestampMs;
}

function requiredString(value: unknown, name: string, pattern: RegExp, max = 200) {
  if (typeof value !== "string" || value.length > max || !pattern.test(value)) {
    throw new AirwallexWebhookError(400, `Invalid Airwallex webhook ${name}`);
  }
  return value;
}

export function parseVerifiedAirwallexWebhook(input: {
  rawBody: Uint8Array;
  timestampMs: number;
  expectedAccountId: string;
  expectedApiVersion: string;
}): VerifiedAirwallexWebhook {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(input.rawBody));
  } catch {
    throw new AirwallexWebhookError(400, "Invalid Airwallex webhook JSON");
  }
  const envelope = object(parsed);
  const data = object(envelope?.data);
  const resource = object(data?.object);
  if (!envelope || !resource) throw new AirwallexWebhookError(400, "Invalid Airwallex webhook envelope");

  const externalEventId = requiredString(envelope.id, "id", /^[A-Za-z0-9_-]+$/);
  const eventType = requiredString(envelope.name, "name", /^[a-z_]+\.[a-z_]+$/);
  if (!PAYMENT_EVENTS.has(eventType) && !REFUND_EVENTS.has(eventType)) {
    throw new AirwallexWebhookError(400, "Unsupported Airwallex webhook event");
  }
  const apiVersion = requiredString(envelope.version, "version", /^\d{4}-\d{2}-\d{2}$/);
  const accountId = requiredString(envelope.account_id, "account_id", /^[A-Za-z0-9_-]+$/, 128);
  if (accountId !== input.expectedAccountId) throw new AirwallexWebhookError(403, "Airwallex webhook account mismatch");
  if (apiVersion !== input.expectedApiVersion) throw new AirwallexWebhookError(409, "Airwallex webhook version mismatch");

  const occurredAtRaw = requiredString(envelope.created_at, "created_at", /^\d{4}-\d{2}-\d{2}T/);
  const occurredAt = new Date(occurredAtRaw);
  if (Number.isNaN(occurredAt.valueOf())) throw new AirwallexWebhookError(400, "Invalid Airwallex webhook created_at");
  const currency = normalizeAirwallexCurrency(resource.currency);
  const amountCents = airwallexAmountToCents(resource.amount, currency);
  const providerStatus = requiredString(resource.status, "status", /^[A-Z_]+$/);
  const requiredStatus = EVENT_STATUSES[eventType];
  if (requiredStatus && providerStatus !== requiredStatus) {
    throw new AirwallexWebhookError(409, "Airwallex webhook event and resource status do not match");
  }
  const organizationId = typeof envelope.org_id === "string" ? envelope.org_id.slice(0, 128) : null;

  if (PAYMENT_EVENTS.has(eventType)) {
    const resourceId = requiredString(resource.id, "PaymentIntent id", /^int_[A-Za-z0-9_-]+$/);
    const merchantOrderId = requiredString(resource.merchant_order_id, "merchant_order_id", /^[A-Za-z0-9_-]+$/, 64);
    // PaymentIntent request_id identifies the most recent provider operation,
    // so it is recorded for reconciliation but is not treated as immutable.
    const providerRequestId = typeof resource.request_id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(resource.request_id) ? resource.request_id : null;
    return {
      externalEventId,
      eventType,
      apiVersion,
      accountId,
      organizationId,
      resourceType: "payment_intent",
      resourceId,
      parentResourceId: null,
      providerRequestId,
      internalReference: null,
      merchantOrderId,
      amountCents,
      currency,
      providerStatus,
      occurredAt,
      signatureTimestampMs: input.timestampMs,
      payloadSha256: createHash("sha256").update(input.rawBody).digest("hex"),
      sanitizedPayload: { id: externalEventId, name: eventType, version: apiVersion, account_id: accountId, created_at: occurredAt.toISOString(), data: { object: { id: resourceId, request_id: providerRequestId, merchant_order_id: merchantOrderId, amount: resource.amount as number, currency, status: providerStatus } } }
    };
  }

  const resourceId = requiredString(resource.id, "refund id", /^rfd_[A-Za-z0-9_-]+$/);
  const parentResourceId = requiredString(resource.payment_intent_id, "refund PaymentIntent id", /^int_[A-Za-z0-9_-]+$/);
  const providerRequestId = requiredString(resource.request_id, "refund request_id", /^[A-Za-z0-9_-]+$/, 64);
  const metadata = object(resource.metadata);
  const internalReference = metadata && typeof metadata.sgl_refund_id === "string" && /^[0-9a-f-]{36}$/i.test(metadata.sgl_refund_id)
    ? metadata.sgl_refund_id
    : null;
  return {
    externalEventId,
    eventType,
    apiVersion,
    accountId,
    organizationId,
    resourceType: "refund",
    resourceId,
    parentResourceId,
    providerRequestId,
    internalReference,
    merchantOrderId: null,
    amountCents,
    currency,
    providerStatus,
    occurredAt,
    signatureTimestampMs: input.timestampMs,
    payloadSha256: createHash("sha256").update(input.rawBody).digest("hex"),
    sanitizedPayload: { id: externalEventId, name: eventType, version: apiVersion, account_id: accountId, created_at: occurredAt.toISOString(), data: { object: { id: resourceId, request_id: providerRequestId, payment_intent_id: parentResourceId, amount: resource.amount as number, currency, status: providerStatus, metadata: internalReference ? { sgl_refund_id: internalReference } : {} } } }
  };
}
