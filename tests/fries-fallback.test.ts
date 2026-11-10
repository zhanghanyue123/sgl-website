import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deliverContactSubmission, validateContactSubmission } from "../lib/customer-service/contact";
import { consumePublicRateLimit, sharedRateLimitHealth } from "../lib/customer-service/security";
import { safePublicOrigin } from "../lib/admin/security";

const submission = { name: "Test Visitor", email: "visitor@example.test", subject: "Product question", message: "Could you tell me more?", locale: "en" as const, idempotencyKey: "test-contact-key-123456" };

test("production shared rate limiting fails closed when Redis is missing", async () => {
  await assert.rejects(() => consumePublicRateLimit("test", 2, 1000, { NODE_ENV: "production" }), /not configured/);
  assert.equal(await sharedRateLimitHealth({ NODE_ENV: "production" }), "unconfigured");
});

test("two limiter instances share the same Redis count", async () => {
  let count = 0;
  const fetcher = async () => new Response(JSON.stringify([{ result: ++count }, { result: 1 }]), { status: 200, headers: { "content-type": "application/json" } });
  const env = { NODE_ENV: "production", UPSTASH_REDIS_REST_URL: "https://redis.example.test", UPSTASH_REDIS_REST_TOKEN: "server-secret" };
  assert.equal(await consumePublicRateLimit("shared", 2, 1000, env, fetcher as typeof fetch), true);
  assert.equal(await consumePublicRateLimit("shared", 2, 1000, env, fetcher as typeof fetch), true);
  assert.equal(await consumePublicRateLimit("shared", 2, 1000, env, fetcher as typeof fetch), false);
});

test("Redis failure is not silently downgraded and health recovers", async () => {
  const env = { NODE_ENV: "production", UPSTASH_REDIS_REST_URL: "https://redis.example.test", UPSTASH_REDIS_REST_TOKEN: "server-secret" };
  await assert.rejects(() => consumePublicRateLimit("failed", 2, 1000, env, async () => { throw new Error("timeout"); }), /temporarily unavailable/);
  assert.equal(await sharedRateLimitHealth(env, async () => { throw new Error("timeout"); }), "unavailable");
  assert.equal(await sharedRateLimitHealth(env, async () => new Response(JSON.stringify({ result: "PONG" }), { status: 200, headers: { "content-type": "application/json" } })), "connected");
});

test("health reports the PostgreSQL shared limiter when Redis is absent", async () => {
  const environment = { NODE_ENV: "production", DATABASE_URL: "configured" };
  assert.equal(await sharedRateLimitHealth(environment, fetch, async () => true), "connected");
  assert.equal(await sharedRateLimitHealth(environment, fetch, async () => false), "unavailable");
  assert.equal(await sharedRateLimitHealth(environment, fetch, async () => { throw new Error("offline"); }), "unavailable");
});

test("contact form validates email, honeypot and duplicate identity", () => {
  assert.equal(validateContactSubmission(submission).email, "visitor@example.test");
  assert.throws(() => validateContactSubmission({ ...submission, email: "invalid" }), /email is invalid/);
  assert.throws(() => validateContactSubmission({ ...submission, website: "spam.example" }), /rejected/);
});

test("public mutations accept the current Vercel Preview origin without widening browser access", () => {
  const before = process.env.VERCEL_URL;
  process.env.VERCEL_URL = "preview.example.vercel.app";
  try {
    assert.equal(safePublicOrigin(new Request("https://preview.example.vercel.app/api/support/contact", { headers: { origin: "https://preview.example.vercel.app" } })), true);
    assert.equal(safePublicOrigin(new Request("https://preview.example.vercel.app/api/support/contact", { headers: { origin: "https://attacker.example" } })), false);
  } finally {
    if (before === undefined) delete process.env.VERCEL_URL; else process.env.VERCEL_URL = before;
  }
});

test("delivery only reports success after the relay confirms sending", async () => {
  const env = { VERCEL_ENV: "production", FRIES_CONTACT_DELIVERY_URL: "https://hello.example.test/contact", FRIES_CONTACT_DELIVERY_TOKEN: "server-secret" };
  const success = await deliverContactSubmission(submission, env, async () => new Response(JSON.stringify({ sent: true, messageId: "message-1" }), { status: 200, headers: { "content-type": "application/json" } }) as never);
  assert.equal(success.providerMessageId, "message-1");
  await assert.rejects(() => deliverContactSubmission(submission, env, async () => new Response(JSON.stringify({ sent: false }), { status: 200, headers: { "content-type": "application/json" } }) as never), /not confirmed/);
  await assert.rejects(() => deliverContactSubmission(submission, { VERCEL_ENV: "production" }), /not configured/);
});

test("Fries UI has five-language fallback and automatic recovery health polling", async () => {
  const source = await readFile(new URL("../components/AICustomerService.tsx", import.meta.url), "utf8");
  assert.match(source, /data-fries-mode="email-contact"/);
  assert.ok(source.indexOf("labels.prompt") < source.indexOf('data-fries-mode="email-contact"'), "quick questions must remain above the fallback form");
  assert.match(source, />\{labels\.hello\}<\/p>/, "the original Fries greeting must remain unchanged");
  assert.match(source, /\/api\/support\/health/);
  assert.match(source, /\/api\/support\/contact/);
  assert.match(source, /setMode\("chat"\)/);
  for (const phrase of ["temporarily unavailable", "暂时无法使用", "一時的に利用できません", "일시적으로 이용할 수 없습니다", "momentaneamente disponibile"]) assert.match(source, new RegExp(phrase));
});

test("Fries health checks the dedicated adapter rather than generic LLM variables", async () => {
  const source = await readFile(new URL("../app/api/support/health/route.ts", import.meta.url), "utf8");
  assert.match(source, /probeFriesAdapterHealth/);
  assert.doesNotMatch(source, /SGL_LLM_(BASE_URL|API_KEY|MODEL)/);
  assert.match(source, /FRIES_CONTACT_DELIVERY_URL/);
});
