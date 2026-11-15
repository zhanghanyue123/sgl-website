import CartPageClient from "@/components/CartPageClient";

export default function CartPage() {
  const paypalEnabled = process.env.PAYPAL_ENABLED === "true" && process.env.PAYPAL_ENV === "sandbox";
  const airwallexEnabled = process.env.AIRWALLEX_ENABLED === "true" &&
    process.env.AIRWALLEX_ENV === "sandbox" &&
    process.env.COMMERCE_BACKEND === "local" &&
    process.env.PAYMENT_PROVIDER === "airwallex";
  return <CartPageClient airwallexEnabled={airwallexEnabled} paypalEnabled={paypalEnabled} />;
}
