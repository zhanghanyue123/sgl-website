import CartPageClient from "@/components/CartPageClient";

export default function CartPage() {
  const paypalEnabled = process.env.PAYPAL_ENABLED === "true" && process.env.PAYPAL_ENV === "sandbox";
  return <CartPageClient paypalEnabled={paypalEnabled} />;
}
