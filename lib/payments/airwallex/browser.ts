"use client";

const AIRWALLEX_SDK_URL = "https://static.airwallex.com/components/sdk/v1/index.js";

type AirwallexPayments = {
  redirectToCheckout(input: {
    env: "sandbox";
    mode: "payment";
    intent_id: string;
    client_secret: string;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    locale?: string;
  }): void | string;
};

type AirwallexSdk = {
  init(input: { env: "sandbox"; locale: string; enabledElements: ["payments"] }): Promise<{ payments?: AirwallexPayments }>;
};

declare global {
  interface Window {
    AirwallexComponentsSDK?: AirwallexSdk;
  }
}

let sdkPromise: Promise<AirwallexSdk> | null = null;
let paymentsPromise: Promise<AirwallexPayments> | null = null;

function loadSdk(): Promise<AirwallexSdk> {
  if (window.AirwallexComponentsSDK) return Promise.resolve(window.AirwallexComponentsSDK);
  if (!sdkPromise) {
    sdkPromise = new Promise<AirwallexSdk>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${AIRWALLEX_SDK_URL}"]`);
      const script = existing || document.createElement("script");
      const timeout = window.setTimeout(() => reject(new Error("Airwallex checkout timed out")), 15_000);
      const complete = () => {
        window.clearTimeout(timeout);
        if (window.AirwallexComponentsSDK) resolve(window.AirwallexComponentsSDK);
        else reject(new Error("Airwallex checkout could not be loaded"));
      };
      script.addEventListener("load", complete, { once: true });
      script.addEventListener("error", () => {
        window.clearTimeout(timeout);
        reject(new Error("Airwallex checkout could not be loaded"));
      }, { once: true });
      if (!existing) {
        script.src = AIRWALLEX_SDK_URL;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }
    }).catch((error) => {
      sdkPromise = null;
      throw error;
    });
  }
  return sdkPromise!;
}

export async function redirectToAirwallexHostedCheckout(input: {
  intentId: string;
  clientSecret: string;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  locale: string;
}) {
  const currentOrigin = window.location.origin;
  for (const candidate of [input.successUrl, input.cancelUrl]) {
    const url = new URL(candidate);
    if (url.origin !== currentOrigin || url.protocol !== "https:") {
      throw new Error("Airwallex return URL is invalid");
    }
  }
  if (!/^int_[A-Za-z0-9_-]+$/.test(input.intentId) || !input.clientSecret || input.currency !== "USD") {
    throw new Error("Airwallex checkout details are invalid");
  }
  if (!paymentsPromise) {
    paymentsPromise = loadSdk().then(async (sdk) => {
      const initialized = await sdk.init({ env: "sandbox", locale: input.locale, enabledElements: ["payments"] });
      if (!initialized.payments) throw new Error("Airwallex payments are unavailable");
      return initialized.payments;
    }).catch((error) => {
      paymentsPromise = null;
      throw error;
    });
  }
  const payments = await paymentsPromise;
  payments.redirectToCheckout({
    env: "sandbox",
    mode: "payment",
    intent_id: input.intentId,
    client_secret: input.clientSecret,
    currency: input.currency,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    locale: input.locale
  });
}
