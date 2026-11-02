import { createHash, randomUUID } from "node:crypto";
import type { JSONValue, TransactionSql } from "postgres";
import { getDb } from "@/lib/admin/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { parseItems, parseRequestKey, StoreError, type CheckoutItem } from "@/lib/store/validation";

type OrderLine = {
  productId: string;
  variantId: string;
  sku: string | null;
  productTitle: string;
  variantTitle: string;
  options: JSONValue;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  currency: string;
};

export type PendingOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  itemsSubtotalCents: number;
  totalCents: number;
  reservationExpiresAt: Date;
  lines: OrderLine[];
};

function reservationMinutes() {
  const configured = Number(process.env.ORDER_RESERVATION_MINUTES || 30);
  if (!Number.isInteger(configured) || configured < 30 || configured > 1440) return 30;
  return configured;
}

export function hashOrderRequest(items: CheckoutItem[], locale: Locale) {
  return createHash("sha256").update(JSON.stringify({ items, locale })).digest("hex");
}

export function makeOrderNumber(date = new Date(), id = randomUUID()) {
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `SGL-${day}-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

async function loadOrder(tx: TransactionSql, id: string): Promise<PendingOrder> {
  const orderRows = await tx<{
    id: string; order_number: string; order_status: string; payment_status: string; currency: string;
    items_subtotal_cents: number; total_cents: number; reservation_expires_at: Date;
  }[]>`SELECT id, order_number, order_status, payment_status, currency, items_subtotal_cents, total_cents, reservation_expires_at
      FROM orders WHERE id = ${id} LIMIT 1`;
  const order = orderRows[0];
  if (!order) throw new StoreError(500, "Order could not be loaded.");
  const lines = await tx<{
    product_id: string; variant_id: string; sku: string | null; product_title: string; variant_title: string;
    options: JSONValue; image_url: string | null; unit_price_cents: number; quantity: number; line_total_cents: number; currency: string;
  }[]>`SELECT product_id, variant_id, sku, product_title, variant_title, options, image_url,
      unit_price_cents, quantity, line_total_cents, currency FROM order_items WHERE order_id = ${id} ORDER BY created_at, id`;
  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.order_status,
    paymentStatus: order.payment_status,
    currency: order.currency,
    itemsSubtotalCents: order.items_subtotal_cents,
    totalCents: order.total_cents,
    reservationExpiresAt: new Date(order.reservation_expires_at),
    lines: lines.map((line) => ({
      productId: line.product_id,
      variantId: line.variant_id,
      sku: line.sku,
      productTitle: line.product_title,
      variantTitle: line.variant_title,
      options: line.options,
      imageUrl: line.image_url,
      unitPriceCents: line.unit_price_cents,
      quantity: line.quantity,
      lineTotalCents: line.line_total_cents,
      currency: line.currency
    }))
  };
}

async function resolveLines(tx: TransactionSql, items: CheckoutItem[]): Promise<OrderLine[]> {
  const lines: OrderLine[] = [];
  for (const item of items) {
    const variants = await tx<{
      product_id: string; variant_id: string; sku: string | null; product_title: string; variant_title: string;
      options: JSONValue; image_url: string | null; price_cents: number; currency: string;
    }[]>`SELECT p.id AS product_id, v.id AS variant_id, v.sku,
        COALESCE(l.title, p.slug) AS product_title, v.title AS variant_title, v.options,
        COALESCE(v.image_url, image.url) AS image_url, v.price_cents, v.currency
      FROM products p
      JOIN product_variants v ON v.product_id = p.id AND v.active = true
      LEFT JOIN product_localizations l ON l.product_id = p.id AND l.locale = 'en'
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id ORDER BY position, id LIMIT 1
      ) image ON true
      WHERE p.slug = ${item.slug} AND p.status = 'published' AND p.sold_out_override = false
      ORDER BY v.position, v.id`;
    const variant = variants[item.variant];
    if (!variant) throw new StoreError(409, "A product or variant is no longer available.");
    const lineTotalCents = variant.price_cents * item.quantity;
    if (!Number.isSafeInteger(lineTotalCents)) throw new StoreError(409, "The cart total is invalid.");
    lines.push({
      productId: variant.product_id,
      variantId: variant.variant_id,
      sku: variant.sku,
      productTitle: variant.product_title,
      variantTitle: variant.variant_title,
      options: variant.options,
      imageUrl: variant.image_url,
      unitPriceCents: variant.price_cents,
      quantity: item.quantity,
      lineTotalCents,
      currency: variant.currency
    });
  }
  if (new Set(lines.map((line) => line.currency)).size !== 1) throw new StoreError(409, "Cart items must use one currency.");
  return lines;
}

export async function createPendingOrder(input: { items: unknown; locale: unknown; idempotencyKey: string }): Promise<PendingOrder> {
  const items = parseItems({ items: input.items });
  const locale: Locale = typeof input.locale === "string" && isLocale(input.locale) ? input.locale : "en";
  const idempotencyKey = parseRequestKey(input.idempotencyKey);
  const requestHash = hashOrderRequest(items, locale);
  const db = getDb();
  return db.begin(async (tx) => {
    const existing = await tx<{ id: string; request_hash: string }[]>`SELECT id, request_hash FROM orders WHERE idempotency_key = ${idempotencyKey} FOR UPDATE`;
    if (existing[0]) {
      if (existing[0].request_hash !== requestHash) throw new StoreError(409, "This checkout key was already used for a different cart.");
      return loadOrder(tx, existing[0].id);
    }

    const lines = await resolveLines(tx, items);
    const itemsSubtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    if (!Number.isSafeInteger(itemsSubtotalCents) || itemsSubtotalCents <= 0) throw new StoreError(409, "The cart total is invalid.");
    const orderId = randomUUID();
    const orderNumber = makeOrderNumber(new Date(), orderId);
    const expiresAt = new Date(Date.now() + reservationMinutes() * 60 * 1000);
    const currency = lines[0].currency;
    await tx`INSERT INTO orders (
        id, order_number, locale, currency, items_subtotal_cents, shipping_cents, tax_cents,
        discount_cents, total_cents, idempotency_key, request_hash
      ) VALUES (
        ${orderId}, ${orderNumber}, ${locale}, ${currency}, ${itemsSubtotalCents}, 0, 0,
        0, ${itemsSubtotalCents}, ${idempotencyKey}, ${requestHash}
      )`;
    for (const line of lines) {
      await tx`INSERT INTO order_items (
          id, order_id, product_id, variant_id, sku, product_title, variant_title, options,
          image_url, unit_price_cents, quantity, line_total_cents, currency
        ) VALUES (
          ${randomUUID()}, ${orderId}, ${line.productId}, ${line.variantId}, ${line.sku},
          ${line.productTitle}, ${line.variantTitle}, ${tx.json(line.options)}, ${line.imageUrl},
          ${line.unitPriceCents}, ${line.quantity}, ${line.lineTotalCents}, ${line.currency}
        )`;
    }
    await tx`INSERT INTO order_events (id, order_id, event_type, actor_type, data)
      VALUES (${randomUUID()}, ${orderId}, 'order.created', 'customer', ${tx.json({ locale, itemCount: lines.length })})`;
    try {
      await tx`SELECT * FROM reserve_order_inventory(${orderId}, ${expiresAt})`;
    } catch (error) {
      if (error instanceof Error && /insufficient inventory/i.test(error.message)) throw new StoreError(409, "One or more items are out of stock.");
      throw error;
    }
    return loadOrder(tx, orderId);
  });
}

export async function expirePendingOrders() {
  const rows = await getDb()<{ count: number }[]>`SELECT expire_order_reservations()::int AS count`;
  return rows[0]?.count || 0;
}
