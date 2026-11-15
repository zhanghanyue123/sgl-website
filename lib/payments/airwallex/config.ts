export const AIRWALLEX_SANDBOX_BASE_URL = "https://api.sandbox.airwallex.com";

export type AirwallexApiConfig = {
  baseUrl: typeof AIRWALLEX_SANDBOX_BASE_URL;
  clientId: string;
  apiKey: string;
  apiVersion: string;
};

export type AirwallexWebhookConfig = {
  secret: string;
  expectedAccountId: string;
  apiVersion: string;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for Airwallex Sandbox`);
  return value;
}

function assertSandbox() {
  if (process.env.AIRWALLEX_ENV !== "sandbox") {
    throw new Error("AIRWALLEX_ENV must be exactly sandbox");
  }
}

function apiVersion() {
  const value = required("AIRWALLEX_WEBHOOK_API_VERSION");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("AIRWALLEX_WEBHOOK_API_VERSION must be an ISO date version");
  }
  return value;
}

export function getAirwallexApiConfig(): AirwallexApiConfig {
  assertSandbox();
  return {
    baseUrl: AIRWALLEX_SANDBOX_BASE_URL,
    clientId: required("AIRWALLEX_CLIENT_ID"),
    apiKey: required("AIRWALLEX_API_KEY"),
    apiVersion: apiVersion()
  };
}

export function getAirwallexWebhookConfig(): AirwallexWebhookConfig {
  assertSandbox();
  const expectedAccountId = required("AIRWALLEX_EXPECTED_ACCOUNT_ID");
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(expectedAccountId)) {
    throw new Error("AIRWALLEX_EXPECTED_ACCOUNT_ID is invalid");
  }
  return {
    secret: required("AIRWALLEX_WEBHOOK_SECRET"),
    expectedAccountId,
    apiVersion: apiVersion()
  };
}
