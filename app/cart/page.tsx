import CartPageClient from "@/components/CartPageClient";

export default function CartPage() {
  const paypalIsLive = process.env.PAYPAL_ENV === "live";
  const paypalCredentialsPresent = Boolean(
    (paypalIsLive ? process.env.PAYPAL_LIVE_CLIENT_ID : process.env.PAYPAL_CLIENT_ID)?.trim() &&
    (paypalIsLive ? process.env.PAYPAL_LIVE_CLIENT_SECRET : process.env.PAYPAL_CLIENT_SECRET)?.trim() &&
    (paypalIsLive ? process.env.PAYPAL_LIVE_WEBHOOK_ID : process.env.PAYPAL_WEBHOOK_ID)?.trim()
  );
  const paypalEnvironment = process.env.PAYPAL_ENV === "sandbox" ||
    (process.env.PAYPAL_ENV === "live" && process.env.PAYPAL_LIVE_ENABLED === "true")
    ? process.env.PAYPAL_ENV
    : null;
  const paypalEnabled = process.env.PAYPAL_ENABLED === "true" && paypalCredentialsPresent && paypalEnvironment !== null;
  const airwallexEnabled = process.env.AIRWALLEX_ENABLED === "true" &&
    process.env.AIRWALLEX_ENV === "sandbox" &&
    process.env.COMMERCE_BACKEND === "local" &&
    process.env.PAYMENT_PROVIDER === "airwallex";
  return <CartPageClient airwallexEnabled={airwallexEnabled} paypalEnabled={paypalEnabled} paypalEnvironment={paypalEnvironment} />;
}
