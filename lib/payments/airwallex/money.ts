const SUPPORTED_CURRENCY = "USD";

export function normalizeAirwallexCurrency(value: unknown) {
  if (typeof value !== "string" || value.toUpperCase() !== SUPPORTED_CURRENCY) {
    throw new Error("Airwallex Sprint 01 supports USD only");
  }
  return SUPPORTED_CURRENCY;
}

export function centsToAirwallexAmount(cents: number, currency: string) {
  normalizeAirwallexCurrency(currency);
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100_000_000) {
    throw new Error("Airwallex amount must be positive integer cents");
  }
  return Number((cents / 100).toFixed(2));
}

export function airwallexAmountToCents(value: unknown, currency: string) {
  normalizeAirwallexCurrency(currency);
  if (typeof value !== "number" && typeof value !== "string") {
    throw new Error("Airwallex amount is invalid");
  }
  const text = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error("Airwallex amount has invalid precision");
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100_000_000) {
    throw new Error("Airwallex amount is outside the supported range");
  }
  return cents;
}
