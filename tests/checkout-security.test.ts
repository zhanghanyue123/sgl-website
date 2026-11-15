import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CHECKOUT_RATE_LIMIT_POLICY,
  CheckoutSecurityError,
  checkoutClientId,
  enforceAirwallexCheckoutSecurity,
  hashCheckoutSecurityKey,
  trustedVercelClientIp,
  type CheckoutRateLimitConsumer
} from "../lib/store/checkout-security";

const clientId = "11111111-1111-4111-8111-111111111111";
const hashSecret = "checkout-security-unit-test-secret-32-bytes";

function request(headers: Record<string, string> = {}) {
  return new Request("https://example.test/api/checkout", { method: "POST", headers });
}

async function withSecurityEnv(run: () => Promise<void> | void) {
  const previousVercel = process.env.VERCEL;
  const previousSecret = process.env.CHECKOUT_SECURITY_HASH_SECRET;
  process.env.VERCEL = "1";
  process.env.CHECKOUT_SECURITY_HASH_SECRET = hashSecret;
  try {
    await run();
  } finally {
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
    if (previousSecret === undefined) delete process.env.CHECKOUT_SECURITY_HASH_SECRET;
    else process.env.CHECKOUT_SECURITY_HASH_SECRET = previousSecret;
  }
}

test("checkout security trusts only one valid Vercel client address and a UUID client ID", async () => {
  await withSecurityEnv(() => {
    const valid = request({
      "x-vercel-forwarded-for": "203.0.113.20",
      "x-sgl-checkout-client": clientId.toUpperCase()
    });
    assert.equal(trustedVercelClientIp(valid), "203.0.113.20");
    assert.equal(checkoutClientId(valid), clientId);
    assert.equal(trustedVercelClientIp(request({ "x-vercel-forwarded-for": "203.0.113.20, 10.0.0.1" })), null);
    assert.equal(trustedVercelClientIp(request({ "x-vercel-forwarded-for": "not-an-ip" })), null);
    assert.equal(checkoutClientId(request({ "x-sgl-checkout-client": "not-a-uuid" })), null);
    delete process.env.VERCEL;
    assert.equal(trustedVercelClientIp(valid), null);
  });
});

test("checkout security hashes both dimensions with domain separation", () => {
  const ipHash = hashCheckoutSecurityKey(hashSecret, "ip", "203.0.113.20");
  const clientHash = hashCheckoutSecurityKey(hashSecret, "client", "203.0.113.20");
  assert.match(ipHash, /^[0-9a-f]{64}$/);
  assert.match(clientHash, /^[0-9a-f]{64}$/);
  assert.notEqual(ipHash, clientHash);
  assert.doesNotMatch(ipHash, /203\.0\.113\.20/);
});

test("Airwallex checkout consumes the shared IP and client limits before continuing", async () => {
  await withSecurityEnv(async () => {
    const captured: Parameters<CheckoutRateLimitConsumer>[0][] = [];
    const consume: CheckoutRateLimitConsumer = async (input) => {
      captured.push(input);
      return { allowed: true, retryAfterSeconds: 0 };
    };
    await enforceAirwallexCheckoutSecurity(request({
      origin: "https://example.test",
      "idempotency-key": "checkout-request-1234567890",
      "sec-fetch-site": "same-origin",
      "x-vercel-forwarded-for": "2001:db8::1",
      "x-sgl-checkout-client": clientId
    }), consume);
    assert.equal(captured.length, 1);
    const input = captured[0];
    assert.deepEqual({
      windowSeconds: input.windowSeconds,
      ipLimit: input.ipLimit,
      clientLimit: input.clientLimit
    }, CHECKOUT_RATE_LIMIT_POLICY);
    assert.match(input.ipHash, /^[0-9a-f]{64}$/);
    assert.match(input.clientHash, /^[0-9a-f]{64}$/);
    assert.match(input.requestHash || "", /^[0-9a-f]{64}$/);
    assert.notEqual(input.requestHash, "checkout-request-1234567890");
  });
});

test("the Airwallex limiter runs before inventory reservation and Stripe is not used as a substitute", async () => {
  const source = await readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../db/migrations/0008_sku_checkout_safety.sql", import.meta.url), "utf8");
  const providerGate = source.indexOf('process.env.PAYMENT_PROVIDER !== "airwallex"');
  const limiter = source.indexOf("await enforceAirwallexCheckoutSecurity(request)", providerGate);
  const reservation = source.indexOf("await createPendingOrder", providerGate);
  assert.ok(providerGate >= 0 && limiter > providerGate);
  assert.ok(reservation > limiter);
  assert.equal(source.includes("getStripe"), false);
  assert.equal(source.includes("stripe.checkout"), false);
  assert.match(migration, /v_now timestamptz:=clock_timestamp\(\)/);
  assert.doesNotMatch(migration, /current_time timestamptz/);
});

test("Airwallex checkout fails closed when trust inputs are missing", async () => {
  await withSecurityEnv(async () => {
    let calls = 0;
    const consume: CheckoutRateLimitConsumer = async () => {
      calls++;
      return { allowed: true, retryAfterSeconds: 0 };
    };
    await assert.rejects(
      enforceAirwallexCheckoutSecurity(request({ "x-sgl-checkout-client": clientId }), consume),
      (error: unknown) => error instanceof CheckoutSecurityError && error.status === 503
    );
    await assert.rejects(
      enforceAirwallexCheckoutSecurity(request({ "x-vercel-forwarded-for": "203.0.113.20" }), consume),
      (error: unknown) => error instanceof CheckoutSecurityError && error.status === 503
    );
    process.env.CHECKOUT_SECURITY_HASH_SECRET = "too-short";
    await assert.rejects(
      enforceAirwallexCheckoutSecurity(request({
        "x-vercel-forwarded-for": "203.0.113.20",
        "x-sgl-checkout-client": clientId
      }), consume),
      (error: unknown) => error instanceof CheckoutSecurityError && error.status === 503
    );
    assert.equal(calls, 0);
  });
});

test("Fetch Metadata rejects a declared cross-site request and rate limits return retry guidance", async () => {
  await withSecurityEnv(async () => {
    const headers = {
      "x-vercel-forwarded-for": "203.0.113.20",
      "x-sgl-checkout-client": clientId
    };
    let calls = 0;
    const consume: CheckoutRateLimitConsumer = async () => {
      calls++;
      return { allowed: false, retryAfterSeconds: 45 };
    };
    await assert.rejects(
      enforceAirwallexCheckoutSecurity(request({ ...headers, "sec-fetch-site": "cross-site" }), consume),
      (error: unknown) => error instanceof CheckoutSecurityError && error.status === 403
    );
    assert.equal(calls, 0);
    await assert.rejects(
      enforceAirwallexCheckoutSecurity(request({ ...headers, "sec-fetch-site": "same-origin" }), consume),
      (error: unknown) => error instanceof CheckoutSecurityError && error.status === 429 && error.retryAfterSeconds === 45
    );
    assert.equal(calls, 1);
  });
});
