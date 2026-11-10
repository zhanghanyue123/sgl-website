import assert from "node:assert/strict";
import test from "node:test";
import { createHash, createHmac } from "node:crypto";
import { LlmProviderRequestError, LlmUnavailableError } from "../lib/ai/provider";
import { configuredFriesAgentProvider, friesAdapterConfigurationStatus, FriesOpenClawAdapterProvider, probeFriesAdapterHealth } from "../lib/customer-service/fries-agent";

const request = { name: "support_answer", system: "Return approved public information only.", prompt: "Where can I buy this product?", schema: { type: "object", additionalProperties: false, required: ["answer"], properties: { answer: { type: "string" } } } };
const signingSecret = "test-signing-secret-at-least-32-characters";
const clientKey = "vercel-fries";

test("Fries requires its dedicated Adapter and ignores generic LLM variables", () => {
  assert.equal(friesAdapterConfigurationStatus({ SGL_LLM_BASE_URL: "https://ai-gateway.vercel.sh/v1", SGL_LLM_API_KEY: "generic-token", SGL_LLM_MODEL: "provider/model" }).configured, false);
  assert.equal(friesAdapterConfigurationStatus({ SGL_FRIES_ADAPTER_URL: "https://fries.example.test/v1/respond", SGL_FRIES_ADAPTER_HEALTH_URL: "https://fries.example.test/health", SGL_FRIES_ADAPTER_TOKEN: "token", SGL_FRIES_OPENCLAW_AGENT: "fries" }).configured, false);
  assert.equal(configuredFriesAgentProvider({}).providerName, "openclaw-fries-adapter");
});

test("Fries Adapter sends an authenticated idempotent server request", async () => {
  let captured: { url?: string; init?: RequestInit; body?: Record<string, unknown> } = {};
  const provider = new FriesOpenClawAdapterProvider("https://fries.example.test/v1/respond", "secret-token", "fries", {
    requestId: () => "request-123", maxAttempts: 1, signingSecret, clientKey, now: () => 1_800_000_000_000,
    fetcher: async (url, init) => {
      captured = { url: String(url), init, body: JSON.parse(String(init?.body)) as Record<string, unknown> };
      return new Response(JSON.stringify({ schemaVersion: "sgl.fries.adapter.response.v1", requestId: "request-123", status: "completed", agent: "fries", output: { answer: "At the SGL shop." } }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });
  assert.deepEqual(await provider.generateObject(request), { answer: "At the SGL shop." });
  assert.equal(captured.url, "https://fries.example.test/v1/respond");
  assert.equal(new Headers(captured.init?.headers).get("authorization"), "Bearer secret-token");
  assert.equal(new Headers(captured.init?.headers).get("idempotency-key"), "request-123");
  assert.equal(new Headers(captured.init?.headers).get("x-sgl-timestamp"), "1800000000");
  assert.equal(new Headers(captured.init?.headers).get("x-sgl-client-key"), clientKey);
  const bodyText = JSON.stringify(captured.body);
  const canonical = ["v1", "1800000000", "POST", "/v1/respond", createHash("sha256").update(bodyText).digest("hex"), "request-123", clientKey].join("\n");
  assert.equal(new Headers(captured.init?.headers).get("x-sgl-signature"), `v1=${createHmac("sha256", signingSecret).update(canonical).digest("hex")}`);
  assert.equal(captured.init?.redirect, "error");
  assert.equal(captured.body?.schemaVersion, "sgl.fries.adapter.request.v1");
  assert.equal(captured.body?.agent, "fries");
});

test("Fries Adapter retries transient failures with the same key", async () => {
  const keys: Array<string | null> = []; let calls = 0;
  const provider = new FriesOpenClawAdapterProvider("https://fries.example.test/v1/respond", "secret-token", "fries", {
    requestId: () => "stable-request", sleep: async () => {}, maxAttempts: 2, signingSecret, clientKey,
    fetcher: async (_url, init) => {
      calls += 1; keys.push(new Headers(init?.headers).get("idempotency-key"));
      if (calls === 1) return new Response("unavailable", { status: 503 });
      return new Response(JSON.stringify({ schemaVersion: "sgl.fries.adapter.response.v1", requestId: "stable-request", status: "completed", agent: "fries", output: { answer: "Recovered" } }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });
  assert.deepEqual(await provider.generateObject(request), { answer: "Recovered" });
  assert.deepEqual(keys, ["stable-request", "stable-request"]);
});

test("Fries Adapter rejects a mismatched response contract", async () => {
  const provider = new FriesOpenClawAdapterProvider("https://fries.example.test/v1/respond", "secret-token", "fries", {
    requestId: () => "expected-request", maxAttempts: 1, signingSecret, clientKey,
    fetcher: async () => new Response(JSON.stringify({ schemaVersion: "sgl.fries.adapter.response.v1", requestId: "other-request", status: "completed", agent: "fries", output: { answer: "wrong turn" } }), { status: 200, headers: { "content-type": "application/json" } })
  });
  await assert.rejects(() => provider.generateObject(request), (error: unknown) => error instanceof LlmProviderRequestError && error.message.includes("contract"));
});

test("production Fries Adapter configuration requires HTTPS", () => {
  assert.throws(() => configuredFriesAgentProvider({ NODE_ENV: "production", SGL_FRIES_ADAPTER_URL: "http://10.0.0.17:18081/v1/respond", SGL_FRIES_ADAPTER_HEALTH_URL: "https://fries.example.test/health", SGL_FRIES_ADAPTER_TOKEN: "secret-token", SGL_FRIES_ADAPTER_SIGNING_SECRET: signingSecret, SGL_FRIES_ADAPTER_CLIENT_KEY: clientKey, SGL_FRIES_OPENCLAW_AGENT: "fries" }), (error: unknown) => error instanceof LlmUnavailableError && error.message.includes("HTTPS"));
});

test("Fries health uses the dedicated authenticated Adapter probe", async () => {
  let authorization: string | null = null;
  const health = await probeFriesAdapterHealth({
    SGL_FRIES_ADAPTER_URL: "https://fries.example.test/v1/respond",
    SGL_FRIES_ADAPTER_HEALTH_URL: "https://fries.example.test/health",
    SGL_FRIES_ADAPTER_TOKEN: "secret-token",
    SGL_FRIES_ADAPTER_SIGNING_SECRET: signingSecret,
    SGL_FRIES_ADAPTER_CLIENT_KEY: clientKey,
    SGL_FRIES_OPENCLAW_AGENT: "fries"
  }, async (url, init) => {
    authorization = new Headers(init?.headers).get("authorization");
    assert.equal(new Headers(init?.headers).get("x-sgl-client-key"), clientKey);
    assert.ok(new Headers(init?.headers).get("x-sgl-signature")?.startsWith("v1="));
    assert.equal(new URL(String(url)).pathname, "/health");
    return new Response(JSON.stringify({ status: "ok", agent: "fries" }), { status: 200, headers: { "content-type": "application/json" } });
  });
  assert.equal(health.ok, true);
  assert.equal(authorization, "Bearer secret-token");
  assert.equal((await probeFriesAdapterHealth({})).errorCode, "not_configured");
});
