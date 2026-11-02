import { randomUUID } from "node:crypto";
import type { TransactionSql } from "postgres";
import { getDb, toJson } from "./db";
import type { AdminProductInput } from "./validation";

type Actor = { userId: string; requestId?: string | null; ipHash?: string | null };

async function audit(tx: TransactionSql, actor: Actor, action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
  await tx`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, before_data, after_data, request_id, ip_hash)
    VALUES (${randomUUID()}, ${actor.userId}, ${action}, ${entityType}, ${entityId},
      ${before == null ? null : tx.json(toJson(before))}, ${after == null ? null : tx.json(toJson(after))}, ${actor.requestId || null}, ${actor.ipHash || null})`;
}

export async function listAdminProducts() {
  const db = getDb();
  return db`SELECT p.id, p.slug, p.original_handle, p.status, p.base_price_cents, p.currency,
      p.sold_out_override, p.updated_at, c.name AS category,
      COALESCE(l.title, p.slug) AS title,
      count(DISTINCT v.id)::int AS variant_count,
      count(DISTINCT v.id) FILTER (WHERE v.sku IS NULL)::int AS missing_sku_count,
      COALESCE(sum(i.on_hand) FILTER (WHERE v.active), 0)::int AS on_hand,
      COALESCE(sum(i.reserved) FILTER (WHERE v.active), 0)::int AS reserved,
      COALESCE(sum(i.available) FILTER (WHERE v.active), 0)::int AS available
    FROM products p
    JOIN product_categories c ON c.id = p.category_id
    LEFT JOIN product_localizations l ON l.product_id = p.id AND l.locale = 'en'
    LEFT JOIN product_variants v ON v.product_id = p.id
    LEFT JOIN inventory_levels i ON i.variant_id = v.id
    GROUP BY p.id, c.name, l.title
    ORDER BY p.updated_at DESC, p.slug`;
}

export async function listCategories() {
  return getDb()`SELECT id, slug, name, position, active FROM product_categories ORDER BY position, name`;
}

export async function getAdminProduct(id: string) {
  const db = getDb();
  const [products, localizations, images, variants] = await Promise.all([
    db`SELECT p.*, c.name AS category_name FROM products p JOIN product_categories c ON c.id = p.category_id WHERE p.id = ${id} LIMIT 1`,
    db`SELECT locale, title, description, seo_title, seo_description, image_alt FROM product_localizations WHERE product_id = ${id} ORDER BY locale`,
    db`SELECT id, url, alt_text, position FROM product_images WHERE product_id = ${id} ORDER BY position, id`,
    db`SELECT v.id, v.legacy_key, v.sku, v.title, v.options, v.price_cents, v.currency, v.image_url, v.position, v.active,
        i.on_hand, i.reserved, i.available, i.low_stock_threshold
      FROM product_variants v JOIN inventory_levels i ON i.variant_id = v.id
      WHERE v.product_id = ${id} ORDER BY v.position, v.id`
  ]);
  if (!products[0]) return null;
  const product = products[0] as Record<string, unknown>;
  return { ...product, localizations, images, variants };
}

export async function createAdminProduct(input: AdminProductInput, actor: Actor) {
  const db = getDb();
  return db.begin(async (tx) => {
    const productId = randomUUID();
    await tx`INSERT INTO products (id, legacy_key, slug, original_handle, category_id, status, base_price_cents, currency, sold_out_override, badge, details, buy_links)
      VALUES (${productId}, ${input.slug!}, ${input.slug!}, ${input.originalHandle!}, ${input.categoryId}, ${input.status},
        ${input.basePriceCents}, ${input.currency}, ${input.soldOutOverride}, ${input.badge}, ${tx.json(input.details)}, ${tx.json(input.buyLinks)})`;
    for (const item of input.localizations) {
      await tx`INSERT INTO product_localizations (product_id, locale, title, description, seo_title, seo_description, image_alt)
        VALUES (${productId}, ${item.locale}, ${item.title}, ${item.description}, ${item.seoTitle}, ${item.seoDescription}, ${item.imageAlt})`;
    }
    const variantIds: string[] = [];
    for (const item of input.variants) {
      const variantId = randomUUID();
      variantIds.push(variantId);
      await tx`INSERT INTO product_variants (id, product_id, legacy_key, sku, title, options, price_cents, currency, image_url, position, active)
        VALUES (${variantId}, ${productId}, ${`admin-${variantId}`}, ${item.sku}, ${item.title}, ${tx.json(item.options)}, ${item.priceCents}, ${item.currency}, ${item.imageUrl}, ${item.position}, ${item.active})`;
      await tx`INSERT INTO inventory_levels (variant_id, on_hand, reserved, low_stock_threshold) VALUES (${variantId}, 0, 0, 3)`;
    }
    for (const item of input.images) {
      await tx`INSERT INTO product_images (id, product_id, url, alt_text, position) VALUES (${randomUUID()}, ${productId}, ${item.url}, ${item.altText}, ${item.position})`;
    }
    await audit(tx, actor, "product.create", "product", productId, null, { slug: input.slug, status: input.status, variantIds });
    return productId;
  });
}

export async function updateAdminProduct(id: string, input: AdminProductInput, actor: Actor) {
  const db = getDb();
  return db.begin(async (tx) => {
    const beforeRows = await tx`SELECT * FROM products WHERE id = ${id} FOR UPDATE`;
    if (!beforeRows[0]) return null;
    const archivedAt = input.status === "archived" ? new Date() : null;
    await tx`UPDATE products SET category_id = ${input.categoryId}, status = ${input.status}, base_price_cents = ${input.basePriceCents},
      currency = ${input.currency}, sold_out_override = ${input.soldOutOverride}, badge = ${input.badge}, details = ${tx.json(input.details)},
      buy_links = ${tx.json(input.buyLinks)}, archived_at = ${archivedAt}, updated_at = now() WHERE id = ${id}`;
    for (const item of input.localizations) {
      await tx`INSERT INTO product_localizations (product_id, locale, title, description, seo_title, seo_description, image_alt)
        VALUES (${id}, ${item.locale}, ${item.title}, ${item.description}, ${item.seoTitle}, ${item.seoDescription}, ${item.imageAlt})
        ON CONFLICT (product_id, locale) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description,
        seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description, image_alt = EXCLUDED.image_alt, updated_at = now()`;
    }

    const retained: string[] = [];
    for (const item of input.variants) {
      const variantId = item.id || randomUUID();
      retained.push(variantId);
      if (item.id) {
        const owned = await tx`SELECT id FROM product_variants WHERE id = ${item.id} AND product_id = ${id}`;
        if (!owned[0]) throw new Error("Variant does not belong to this product");
        await tx`UPDATE product_variants SET sku = ${item.sku}, title = ${item.title}, options = ${tx.json(item.options)}, price_cents = ${item.priceCents},
          currency = ${item.currency}, image_url = ${item.imageUrl}, position = ${item.position}, active = ${item.active}, updated_at = now() WHERE id = ${item.id}`;
      } else {
        await tx`INSERT INTO product_variants (id, product_id, legacy_key, sku, title, options, price_cents, currency, image_url, position, active)
          VALUES (${variantId}, ${id}, ${`admin-${variantId}`}, ${item.sku}, ${item.title}, ${tx.json(item.options)}, ${item.priceCents}, ${item.currency}, ${item.imageUrl}, ${item.position}, ${item.active})`;
        await tx`INSERT INTO inventory_levels (variant_id, on_hand, reserved, low_stock_threshold) VALUES (${variantId}, 0, 0, 3)`;
      }
    }
    await tx`UPDATE product_variants SET active = false, updated_at = now() WHERE product_id = ${id} AND id <> ALL(${retained})`;

    await tx`DELETE FROM product_images WHERE product_id = ${id}`;
    for (const item of input.images) {
      await tx`INSERT INTO product_images (id, product_id, url, alt_text, position) VALUES (${randomUUID()}, ${id}, ${item.url}, ${item.altText}, ${item.position})`;
    }
    const after = { status: input.status, basePriceCents: input.basePriceCents, categoryId: input.categoryId, variantIds: retained };
    await audit(tx, actor, "product.update", "product", id, beforeRows[0], after);
    return id;
  });
}

export async function listInventory() {
  return getDb()`SELECT v.id AS variant_id, v.product_id, p.slug, COALESCE(l.title, p.slug) AS product_title, v.title AS variant_title,
      v.sku, v.active, i.on_hand, i.reserved, i.available, i.low_stock_threshold, i.updated_at,
      (i.available <= i.low_stock_threshold) AS low_stock
    FROM product_variants v
    JOIN products p ON p.id = v.product_id
    LEFT JOIN product_localizations l ON l.product_id = p.id AND l.locale = 'en'
    JOIN inventory_levels i ON i.variant_id = v.id
    ORDER BY low_stock DESC, product_title, v.position`;
}

export async function adjustAdminInventory(input: { variantId: string; deltaOnHand: number; reason: string }, actor: Actor) {
  const db = getDb();
  return db.begin(async (tx) => {
    const before = await tx`SELECT * FROM inventory_levels WHERE variant_id = ${input.variantId} FOR UPDATE`;
    if (!before[0]) return null;
    const rows = await tx`SELECT * FROM adjust_inventory(${randomUUID()}, ${input.variantId}, ${input.deltaOnHand}, 0,
      'adjustment', ${input.reason}, 'admin', ${actor.requestId || randomUUID()}, ${actor.userId})`;
    await audit(tx, actor, "inventory.adjust", "product_variant", input.variantId, before[0], rows[0]);
    return rows[0];
  });
}

export async function listInventoryMovements(variantId: string) {
  return getDb()`SELECT m.*, u.email AS actor_email FROM inventory_movements m
    LEFT JOIN admin_users u ON u.id = m.actor_user_id WHERE m.variant_id = ${variantId} ORDER BY m.created_at DESC LIMIT 100`;
}

export async function createCategory(input: { slug: string; name: string; position: number; active: boolean }, actor: Actor) {
  const db = getDb();
  return db.begin(async (tx) => {
    const id = randomUUID();
    await tx`INSERT INTO product_categories (id, slug, name, position, active) VALUES (${id}, ${input.slug}, ${input.name}, ${input.position}, ${input.active})`;
    await audit(tx, actor, "category.create", "product_category", id, null, input);
    return id;
  });
}

export async function adminDashboardCounts() {
  const db = getDb();
  const rows = await db`SELECT
    (SELECT count(*)::int FROM products) AS products,
    (SELECT count(*)::int FROM products WHERE status = 'published') AS published,
    (SELECT count(*)::int FROM product_variants WHERE active AND sku IS NULL) AS missing_skus,
    (SELECT count(*)::int FROM inventory_levels WHERE available <= low_stock_threshold) AS low_stock,
    (SELECT count(*)::int FROM admin_users WHERE active) AS users`;
  return rows[0];
}

export async function listAuditLogs(limit = 100) {
  return getDb()`SELECT a.id, a.action, a.entity_type, a.entity_id, a.before_data, a.after_data,
      a.request_id, a.created_at, u.email AS actor_email, u.display_name AS actor_name
    FROM audit_logs a LEFT JOIN admin_users u ON u.id = a.actor_user_id
    ORDER BY a.created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 250)}`;
}
