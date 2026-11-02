import { createHash, randomUUID } from "node:crypto";
import { products } from "../data/products";
import { categories } from "../data/products";
import { locales } from "../lib/i18n";
import { localizedProduct } from "../lib/localized-copy";
import { closeDb, getDb } from "../lib/admin/db";

function stableUuid(value: string) {
  const hex = createHash("sha256").update(`sgl-catalog:${value}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const joined = hex.join("");
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

function cents(value: number | null | undefined, fallback: number) {
  return Math.round((value ?? fallback) * 100);
}

async function main() {
  const db = getDb();
  const categoryIds = new Map<string, string>();
  for (const [position, name] of categories.entries()) {
    const slug = name.toLowerCase().replace(/&/g, "and").replace(/\//g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const id = stableUuid(`category:${slug}`);
    categoryIds.set(name, id);
    await db`INSERT INTO product_categories (id, slug, name, position, active) VALUES (${id}, ${slug}, ${name}, ${position}, true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, updated_at = now()`;
  }

  let inserted = 0;
  let skipped = 0;
  for (const product of products) {
    const productId = stableUuid(`product:${product.slug}`);
    const existing = await db`SELECT id FROM products WHERE legacy_key = ${product.slug} LIMIT 1`;
    if (existing[0]) {
      skipped++;
      continue;
    }
    await db.begin(async (tx) => {
      const categoryId = categoryIds.get(product.category);
      if (!categoryId) throw new Error(`Unknown category: ${product.category}`);
      const status = product.hidden ? "archived" : "published";
      await tx`INSERT INTO products (id, legacy_key, slug, original_handle, category_id, status, base_price_cents, currency,
          sold_out_override, badge, details, buy_links, archived_at)
        VALUES (${productId}, ${product.slug}, ${product.slug}, ${product.originalHandle}, ${categoryId}, ${status}, ${cents(product.price, product.price)}, 'USD',
          ${product.soldOut === true}, ${product.badge || null}, ${tx.json(product.details)}, ${tx.json(product.buyLinks)}, ${product.hidden ? new Date() : null})`;

      for (const locale of locales) {
        const localized = locale === "en" ? product : localizedProduct(product, locale);
        await tx`INSERT INTO product_localizations (product_id, locale, title, description, seo_title, seo_description, image_alt)
          VALUES (${productId}, ${locale}, ${localized.title}, ${localized.description}, ${localized.title}, ${localized.description}, ${localized.title})`;
      }

      const variants = product.variants.length ? product.variants : [{ sku: "", options: [], price: product.price, inventory: 0, soldOut: product.soldOut, image: product.images[0] || null }];
      for (const [position, variant] of variants.entries()) {
        const variantId = stableUuid(`product:${product.slug}:variant:${position}`);
        const title = variant.options.length ? variant.options.map((option) => `${option.name}: ${option.value}`).join(" / ") : "Default";
        const sku = variant.sku?.trim() ? variant.sku.trim().toUpperCase() : null;
        const onHand = Math.max(0, variant.inventory ?? 0);
        await tx`INSERT INTO product_variants (id, product_id, legacy_key, sku, title, options, price_cents, currency, image_url, position, active)
          VALUES (${variantId}, ${productId}, ${String(position)}, ${sku}, ${title}, ${tx.json(variant.options)}, ${cents(variant.price, product.price)}, 'USD', ${variant.image || null}, ${position}, true)`;
        await tx`INSERT INTO inventory_levels (variant_id, on_hand, reserved, low_stock_threshold) VALUES (${variantId}, ${onHand}, 0, 3)`;
        await tx`INSERT INTO inventory_movements (id, variant_id, movement_type, delta_on_hand, delta_reserved, on_hand_after, reserved_after, reason)
          VALUES (${randomUUID()}, ${variantId}, 'seed', ${onHand}, 0, ${onHand}, 0, 'Imported from the preserved production catalogue')`;
      }

      for (const [position, url] of product.images.entries()) {
        await tx`INSERT INTO product_images (id, product_id, url, alt_text, position)
          VALUES (${stableUuid(`product:${product.slug}:image:${url}`)}, ${productId}, ${url}, ${product.title}, ${position})`;
      }
    });
    inserted++;
  }
  const variantsWithoutInventedSkus = products.reduce((total, product) => total + (product.variants.length
    ? product.variants.filter((variant) => !variant.sku?.trim()).length
    : 1), 0);
  console.log(JSON.stringify({ total: products.length, inserted, skipped, variantsWithoutInventedSkus }));
}

main().then(closeDb).catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exitCode = 1;
});
