import { mapSupportLeaseToAgentOps } from "./agent-ops";
import type { SupportEventLease } from "./outbox";
import { renderPolicyWeCom } from "./wecom-policy";
import { signedServiceHeaders } from "@/lib/customer-service/fries-agent";
import { createHash, createHmac, randomUUID } from "node:crypto";

type Environment = Readonly<Record<string, string | undefined>>;
type WorkerOptions = { fetcher?: typeof fetch; environment?: Environment };

export type FriesWorkerConfiguration = {
  enabled: boolean;
  configured: boolean;
  websiteEventsUrl: string | null;
  stationEventsUrl: string | null;
  weComConfigured: boolean;
  missing: string[];
};

function httpsUrl(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password && !url.hash ? url.toString() : null;
  } catch { return null; }
}

function stationHeaders(input: { url: string; body: string; idempotencyKey: string; token: string; secret: string; clientKey: string; now?: () => number; nonce?: () => string }) {
  const timestamp = String(Math.floor((input.now || Date.now)() / 1_000));
  const nonce = (input.nonce || randomUUID)();
  const path = new URL(input.url).pathname;
  const bodyHash = createHash("sha256").update(input.body).digest("hex");
  const canonical = ["station-v1", timestamp, nonce, "POST", path, bodyHash, input.idempotencyKey, input.clientKey].join("\n");
  return {
    authorization: `Bearer ${input.token}`,
    "x-sgl-timestamp": timestamp,
    "x-sgl-nonce": nonce,
    "x-sgl-client-key": input.clientKey,
    "x-sgl-signature": `v1=${createHmac("sha256", input.secret).update(canonical).digest("hex")}`,
    "idempotency-key": input.idempotencyKey
  };
}

export function friesWorkerConfiguration(environment: Environment = process.env): FriesWorkerConfiguration {
  const websiteEventsUrl = httpsUrl(environment.FRIES_WEBSITE_EVENTS_URL);
  const stationEventsUrl = httpsUrl(environment.FRIES_STATION_EVENTS_URL);
  const missing = [
    [websiteEventsUrl, "FRIES_WEBSITE_EVENTS_URL"],
    [environment.FRIES_WEBSITE_EVENTS_TOKEN?.trim(), "FRIES_WEBSITE_EVENTS_TOKEN"],
    [stationEventsUrl, "FRIES_STATION_EVENTS_URL"],
    [environment.FRIES_STATION_EVENTS_TOKEN?.trim(), "FRIES_STATION_EVENTS_TOKEN"],
    [(environment.FRIES_STATION_SIGNING_SECRET?.trim().length || 0) >= 32, "FRIES_STATION_SIGNING_SECRET"],
    [/^[A-Za-z0-9_-]{8,128}$/.test(environment.FRIES_STATION_CLIENT_KEY?.trim() || ""), "FRIES_STATION_CLIENT_KEY"]
  ].filter(([value]) => !value).map(([, name]) => String(name));
  const weComConfigured = Boolean(httpsUrl(environment.FRIES_WECOM_DELIVERY_URL) && environment.FRIES_WECOM_DELIVERY_TOKEN?.trim() && (environment.FRIES_WECOM_DELIVERY_SIGNING_SECRET?.trim().length || 0) >= 32 && /^[A-Za-z0-9_-]{8,128}$/.test(environment.FRIES_WECOM_DELIVERY_CLIENT_KEY?.trim() || ""));
  return { enabled: environment.FRIES_AGENT_OPS_ENABLED === "true", configured: missing.length === 0, websiteEventsUrl, stationEventsUrl, weComConfigured, missing };
}

async function jsonRequest(fetcher: typeof fetch, url: string, init: RequestInit, timeoutMs = 8_000) {
  const response = await fetcher(url, { ...init, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  return { response, body };
}

function errorCode(error: unknown) {
  const value = error instanceof Error ? error.message.toLowerCase() : "unknown";
  if (value.includes("station")) return "station.delivery_failed";
  if (value.includes("wecom")) return "wecom.delivery_failed";
  return "connector.delivery_failed";
}

export async function runFriesAgentOpsOnce(options: WorkerOptions = {}) {
  const environment = options.environment || process.env;
  const fetcher = options.fetcher || fetch;
  const config = friesWorkerConfiguration(environment);
  if (!config.enabled) return { status: "disabled" as const, pulled: 0, acknowledged: 0, nacked: 0 };
  if (!config.configured || !config.websiteEventsUrl || !config.stationEventsUrl) return { status: "not_configured" as const, missing: config.missing, pulled: 0, acknowledged: 0, nacked: 0 };
  const websiteToken = environment.FRIES_WEBSITE_EVENTS_TOKEN!.trim();
  const stationToken = environment.FRIES_STATION_EVENTS_TOKEN!.trim();
  const signingSecret = environment.FRIES_STATION_SIGNING_SECRET!.trim();
  const stationClientKey = environment.FRIES_STATION_CLIENT_KEY!.trim();
  const pullUrl = new URL(config.websiteEventsUrl);
  pullUrl.searchParams.set("limit", "10");
  pullUrl.searchParams.set("leaseSeconds", "60");
  const pulled = await jsonRequest(fetcher, pullUrl.toString(), { headers: { authorization: `Bearer ${websiteToken}`, accept: "application/json" } });
  if (!pulled.response.ok || !Array.isArray(pulled.body?.events)) throw new Error("website support-event pull failed");
  const events = pulled.body.events as SupportEventLease[];
  let acknowledged = 0; let nacked = 0;
  for (const lease of events) {
    try {
      const event = mapSupportLeaseToAgentOps(lease);
      const stationBody = JSON.stringify(event);
      const station = await jsonRequest(fetcher, config.stationEventsUrl, {
        method: "POST",
        headers: { ...stationHeaders({ url: config.stationEventsUrl, body: stationBody, idempotencyKey: event.idempotencyKey, token: stationToken, secret: signingSecret, clientKey: stationClientKey }), "content-type": "application/json" },
        body: stationBody
      });
      const stationCode = station.body?.code;
      if (!station.response.ok || (stationCode !== "accepted" && stationCode !== "duplicate")) throw new Error("station delivery failed");
      const taskId = typeof station.body?.taskId === "string" ? station.body.taskId : null;
      const notification = renderPolicyWeCom(event, taskId);
      if (notification) {
        const weComUrl = httpsUrl(environment.FRIES_WECOM_DELIVERY_URL);
        const weComToken = environment.FRIES_WECOM_DELIVERY_TOKEN?.trim();
        const weComSecret = environment.FRIES_WECOM_DELIVERY_SIGNING_SECRET?.trim() || "";
        const weComClientKey = environment.FRIES_WECOM_DELIVERY_CLIENT_KEY?.trim() || "";
        if (!weComUrl || !weComToken || weComSecret.length < 32 || !/^[A-Za-z0-9_-]{8,128}$/.test(weComClientKey)) throw new Error("wecom delivery is not configured");
        const weComBody = JSON.stringify(notification);
        const weCom = await jsonRequest(fetcher, weComUrl, {
          method: "POST",
          headers: { ...signedServiceHeaders({ url: weComUrl, method: "POST", body: weComBody, idempotencyKey: notification.dedupeKey, token: weComToken, signingSecret: weComSecret, clientKey: weComClientKey }), "content-type": "application/json", "idempotency-key": notification.dedupeKey },
          body: weComBody
        });
        if (!weCom.response.ok || weCom.body?.delivered !== true) throw new Error("wecom delivery failed");
      }
      const ack = await jsonRequest(fetcher, config.websiteEventsUrl, {
        method: "POST", headers: { authorization: `Bearer ${websiteToken}`, "content-type": "application/json" },
        body: JSON.stringify({ eventId: lease.id, receipt: lease.receipt, idempotencyKey: event.idempotencyKey })
      });
      if (!ack.response.ok) throw new Error("website acknowledgement failed");
      acknowledged += 1;
    } catch (error) {
      const nack = await jsonRequest(fetcher, config.websiteEventsUrl, {
        method: "PATCH", headers: { authorization: `Bearer ${websiteToken}`, "content-type": "application/json" },
        body: JSON.stringify({ eventId: lease.id, receipt: lease.receipt, errorCode: errorCode(error), retryable: true })
      }).catch(() => null);
      if (nack?.response.ok) nacked += 1;
    }
  }
  return { status: "completed" as const, pulled: events.length, acknowledged, nacked };
}
