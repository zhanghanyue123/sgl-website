import { CustomerAuthError } from "./types";

export type VerificationDelivery = "sent" | "failed" | "not_configured";

export async function deliverVerificationEmail(input: { email: string; token: string }): Promise<{ status: VerificationDelivery; error: string | null }> {
  const endpoint = process.env.CUSTOMER_EMAIL_DELIVERY_URL;
  const credential = process.env.CUSTOMER_EMAIL_DELIVERY_TOKEN;
  if (!endpoint || !credential) return { status: "not_configured", error: "delivery_not_configured" };
  let deliveryUrl: URL;
  try { deliveryUrl = new URL(endpoint); } catch { throw new CustomerAuthError(503, "Email verification delivery is not configured"); }
  if (deliveryUrl.protocol !== "https:" || deliveryUrl.username || deliveryUrl.password) {
    throw new CustomerAuthError(503, "Email verification delivery is not configured");
  }
  const site = new URL(process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.SITE_URL || "https://www.theseagulllabs.com");
  const verifyUrl = new URL("/verify-email", site);
  verifyUrl.searchParams.set("token", input.token);
  try {
    const response = await fetch(deliveryUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${credential}`, "content-type": "application/json" },
      body: JSON.stringify({ template: "customer_email_verification", to: input.email, verifyUrl: verifyUrl.toString() }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store"
    });
    return response.ok ? { status: "sent", error: null } : { status: "failed", error: `delivery_http_${response.status}` };
  } catch {
    return { status: "failed", error: "delivery_unavailable" };
  }
}
