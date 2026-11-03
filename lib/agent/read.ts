import { getDb } from "@/lib/admin/db";

export async function readAgentCatalog() {
  return getDb()`SELECT p.id, p.slug, p.status, p.base_price_cents, p.currency, p.sold_out_override, p.badge,
      c.slug AS category, COALESCE(jsonb_agg(DISTINCT jsonb_build_object('locale', l.locale, 'title', l.title, 'description', l.description)) FILTER (WHERE l.locale IS NOT NULL), '[]'::jsonb) AS localizations,
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', v.id, 'sku', v.sku, 'title', v.title, 'options', v.options, 'priceCents', v.price_cents, 'currency', v.currency, 'active', v.active)) FILTER (WHERE v.id IS NOT NULL), '[]'::jsonb) AS variants
    FROM products p JOIN product_categories c ON c.id = p.category_id
    LEFT JOIN product_localizations l ON l.product_id = p.id
    LEFT JOIN product_variants v ON v.product_id = p.id
    WHERE p.status = 'published' GROUP BY p.id, c.slug ORDER BY p.updated_at DESC`;
}

export async function readAgentInventory() {
  return getDb()`SELECT v.id AS variant_id, v.product_id, p.slug, v.sku, v.title AS variant_title,
      i.on_hand, i.reserved, i.available, i.low_stock_threshold, i.updated_at
    FROM product_variants v JOIN products p ON p.id = v.product_id JOIN inventory_levels i ON i.variant_id = v.id
    WHERE v.active AND p.status = 'published' ORDER BY p.slug, v.position`;
}

export async function readAgentOrders() {
  return getDb()`SELECT o.id, o.order_number, o.locale, o.currency, o.total_cents, o.order_status, o.payment_status,
      o.fulfillment_status, o.created_at, o.paid_at,
      COALESCE(jsonb_agg(jsonb_build_object('variantId', i.variant_id, 'sku', i.sku, 'productTitle', i.product_title,
        'variantTitle', i.variant_title, 'quantity', i.quantity, 'unitPriceCents', i.unit_price_cents)) FILTER (WHERE i.id IS NOT NULL), '[]'::jsonb) AS items
    FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
    GROUP BY o.id ORDER BY o.created_at DESC LIMIT 100`;
}

export async function readAgentFulfillment() {
  return getDb()`SELECT o.id AS order_id, o.order_number, o.fulfillment_status, o.paid_at,
      s.id AS shipment_id, s.carrier, s.tracking_number, s.tracking_url, s.status AS shipment_status,
      s.dispatched_at, s.delivered_at
    FROM orders o LEFT JOIN fulfillment_shipments s ON s.order_id = o.id
    WHERE o.payment_status IN ('paid', 'partially_refunded', 'refunded')
    ORDER BY o.paid_at DESC NULLS LAST LIMIT 100`;
}

export async function readAgentAnalytics() {
  const rows = await getDb()`SELECT
    count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS orders_30d,
    COALESCE(sum(total_cents) FILTER (WHERE paid_at >= now() - interval '30 days' AND payment_status IN ('paid', 'partially_refunded')), 0)::bigint AS paid_revenue_cents_30d,
    count(*) FILTER (WHERE payment_status = 'paid' AND fulfillment_status = 'unfulfilled')::int AS paid_unfulfilled,
    count(*) FILTER (WHERE order_status = 'pending_payment')::int AS pending_payment
    FROM orders`;
  return rows[0];
}
