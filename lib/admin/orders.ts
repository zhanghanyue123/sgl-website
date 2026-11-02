import { getDb } from "./db";

export async function listAdminOrders() {
  return getDb()`SELECT o.id, o.order_number, o.customer_email, o.customer_name, o.currency,
      o.total_cents, o.order_status, o.payment_status, o.fulfillment_status,
      o.reservation_expires_at, o.created_at, count(oi.id)::int AS item_count
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 250`;
}

export async function getAdminOrder(id: string) {
  const db = getDb();
  const [orders, items, addresses, events] = await Promise.all([
    db`SELECT o.*, c.display_name AS customer_display_name
      FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.id = ${id} LIMIT 1`,
    db`SELECT id, product_id, variant_id, sku, product_title, variant_title, options,
        image_url, unit_price_cents, quantity, line_total_cents, currency, created_at
      FROM order_items WHERE order_id = ${id} ORDER BY created_at, id`,
    db`SELECT id, address_type, recipient_name, phone, line1, line2, city, region,
        postal_code, country_code, created_at
      FROM order_addresses WHERE order_id = ${id} ORDER BY address_type`,
    db`SELECT e.id, e.event_type, e.actor_type, e.external_reference, e.data, e.created_at,
        u.email AS actor_email
      FROM order_events e LEFT JOIN admin_users u ON u.id = e.actor_user_id
      WHERE e.order_id = ${id} ORDER BY e.created_at DESC, e.id DESC`
  ]);
  if (!orders[0]) return null;
  return { order: orders[0], items, addresses, events };
}

export async function listAdminCustomers() {
  return getDb()`SELECT c.id, c.email, c.phone, c.display_name, c.locale, c.created_at, c.updated_at,
      count(o.id)::int AS order_count,
      count(o.id) FILTER (WHERE o.payment_status IN ('paid', 'partially_refunded', 'refunded', 'disputed'))::int AS paid_order_count,
      COALESCE(sum(o.total_cents) FILTER (WHERE o.payment_status IN ('paid', 'partially_refunded', 'refunded', 'disputed')), 0)::int AS lifetime_value_cents,
      max(o.created_at) AS latest_order_at,
      COALESCE(max(o.currency), 'CNY') AS currency
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id
    ORDER BY latest_order_at DESC NULLS LAST, c.created_at DESC
    LIMIT 250`;
}
