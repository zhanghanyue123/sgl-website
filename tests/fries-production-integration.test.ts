import assert from "node:assert/strict";
import test from "node:test";
import { friesWorkerConfiguration, runFriesAgentOpsOnce } from "../lib/integrations/fries-worker";
import type { SupportEventLease } from "../lib/integrations/outbox";

const baseEnvironment = {
  FRIES_AGENT_OPS_ENABLED: "true",
  FRIES_WEBSITE_EVENTS_URL: "https://website.example.test/api/agent/v1/support-events",
  FRIES_WEBSITE_EVENTS_TOKEN: "website-token",
  FRIES_STATION_EVENTS_URL: "https://station.example.test/api/integrations/fries/events",
  FRIES_STATION_EVENTS_TOKEN: "station-token",
  FRIES_STATION_SIGNING_SECRET: "station-signing-secret-at-least-24-chars",
  FRIES_WECOM_DELIVERY_URL: "https://wecom.example.test/deliver",
  FRIES_WECOM_DELIVERY_TOKEN: "wecom-token"
};

const lease: SupportEventLease = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  organizationId: "00000000-0000-4000-8000-000000000001",
  storeId: "00000000-0000-4000-8000-000000000002",
  eventType: "support.conversation.updated",
  aggregateType: "support_conversation",
  aggregateId: "conversation-1",
  payload: { signal: "human_takeover", humanActionRequired: true, intentKind: "purchase_interest", intentStrength: "high" },
  createdAt: "2026-11-10T00:00:00.000Z",
  leaseExpiresAt: "2026-11-10T00:01:00.000Z",
  receipt: "r".repeat(43)
};

test("Fries worker remains disabled or Not Connected without complete server-only configuration", async () => {
  assert.equal((await runFriesAgentOpsOnce({ environment: {} })).status, "disabled");
  const config = friesWorkerConfiguration({ FRIES_AGENT_OPS_ENABLED: "true" });
  assert.equal(config.configured, false);
  assert.ok(config.missing.includes("FRIES_STATION_EVENTS_TOKEN"));
});

test("Fries worker delivers Station and policy-approved WeCom events before ACK", async () => {
  const calls: string[] = [];
  const result = await runFriesAgentOpsOnce({ environment: baseEnvironment, fetcher: async (input, init) => {
    const url = String(input); calls.push(`${init?.method || "GET"} ${url}`);
    if (url.startsWith(baseEnvironment.FRIES_WEBSITE_EVENTS_URL) && !init?.method) return Response.json({ events: [lease] });
    if (url === baseEnvironment.FRIES_STATION_EVENTS_URL) {
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer station-token");
      assert.ok(new Headers(init?.headers).get("x-sgl-signature"));
      return Response.json({ code: "accepted", taskId: "task-1" }, { status: 201 });
    }
    if (url === baseEnvironment.FRIES_WECOM_DELIVERY_URL) {
      const body = JSON.parse(String(init?.body));
      assert.doesNotMatch(JSON.stringify(body), /@|customer message/i);
      return Response.json({ delivered: true });
    }
    if (url === baseEnvironment.FRIES_WEBSITE_EVENTS_URL && init?.method === "POST") return Response.json({ status: "acknowledged" });
    throw new Error(`unexpected ${url}`);
  }});
  assert.deepEqual(result, { status: "completed", pulled: 1, acknowledged: 1, nacked: 0 });
  assert.equal(calls.some((call) => call.startsWith("POST https://wecom.example.test")), true);
});

test("Fries worker NACKs a Station failure instead of silently dropping the lease", async () => {
  let nacked = false;
  const result = await runFriesAgentOpsOnce({ environment: baseEnvironment, fetcher: async (input, init) => {
    const url = String(input);
    if (url.startsWith(baseEnvironment.FRIES_WEBSITE_EVENTS_URL) && !init?.method) return Response.json({ events: [lease] });
    if (url === baseEnvironment.FRIES_STATION_EVENTS_URL) return Response.json({ code: "unavailable" }, { status: 503 });
    if (url === baseEnvironment.FRIES_WEBSITE_EVENTS_URL && init?.method === "PATCH") { nacked = true; return Response.json({ status: "retry_scheduled" }); }
    throw new Error(`unexpected ${url}`);
  }});
  assert.equal(nacked, true);
  assert.deepEqual(result, { status: "completed", pulled: 1, acknowledged: 0, nacked: 1 });
});
