import { randomUUID } from "node:crypto";
import { categories, products } from "@/data/products";
import { locales } from "@/lib/i18n";
import { localizedProduct } from "@/lib/localized-copy";
import { getDb, toJson } from "./db";
import { approvedSkuFor, approvedSkuRows, assertApprovedSkuManifest, SKU_INITIALIZATION_MANIFEST_SHA256, stableCatalogueUuid } from "./sku-standardization";

const REVIEW_NOTE = `Approved SGL Inventory Phase 2 mapping ${SKU_INITIALIZATION_MANIFEST_SHA256}`;

type Actor = { userId: string; requestId?: string | null; ipHash?: string | null };

function categorySlug(name: string) {
  return name.toLowerCase().replace(/&/g, "and").replace(/\//g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cents(value: number | null | undefined, fallback: number) {
  return Math.round((value ?? fallback) * 100);
}

export async function initializeApprovedCatalogue(actor: Actor) {
  assertApprovedSkuManifest();
  if (products.length !== 44) throw new Error(`Catalogue source drift: expected 44 products; found ${products.length}`);
  const sourceVariantCount = products.reduce((sum, product) => sum + Math.max(product.variants.length, 1), 0);
  if (sourceVariantCount !== 79) throw new Error(`Catalogue source drift: expected 79 variants; found ${sourceVariantCount}`);

  const db = getDb();
  return db.begin(async (tx) => {
    const migration = await tx`SELECT version FROM schema_migrations WHERE version = '0008_sku_checkout_safety.sql' LIMIT 1`;
    if (!migration[0]) throw new Error("Required migration 0008_sku_checkout_safety.sql is not applied");

    const categoryIds = new Map<string, string>();
    for (const [position, name] of categories.entries()) {
      const slug = categorySlug(name);
      const existing = await tx<{ id: string }[]>`SELECT id FROM product_categories WHERE slug = ${slug} LIMIT 1`;
      const id = existing[0]?.id || stableCatalogueUuid(`category:${slug}`);
      categoryIds.set(name, id);
      if (!existing[0]) {
        await tx`INSERT INTO product_categories (id, slug, name, position, active) VALUES (${id}, ${slug}, ${name}, ${position}, true)`;
      }
    }

    let productsCreated = 0;
    let variantsCreated = 0;
    let variantsApproved = 0;
    for (const product of products) {
      const productId = stableCatalogueUuid(`product:${product.slug}`);
      const existingProducts = await tx<{ id: string; slug: string; base_price_cents: number }[]>`
        SELECT id, slug, base_price_cents FROM products WHERE id = ${productId} OR legacy_key = ${product.slug} OR slug = ${product.slug}`;
      if (existingProducts.length > 1 || (existingProducts[0] && existingProducts[0].id !== productId)) {
        throw new Error(`Product identity conflict for ${product.slug}`);
      }
      const categoryId = categoryIds.get(product.category);
      if (!categoryId) throw new Error(`Unknown category: ${product.category}`);
      if (!existingProducts[0]) {
        await tx`INSERT INTO products (id, legacy_key, slug, original_handle, category_id, status, base_price_cents, currency,
            sold_out_override, badge, details, buy_links, archived_at)
          VALUES (${productId}, ${product.slug}, ${product.slug}, ${product.originalHandle}, ${categoryId}, ${product.hidden ? "archived" : "published"},
            ${cents(product.price, product.price)}, 'USD', ${product.soldOut === true}, ${product.badge || null}, ${tx.json(toJson(product.details))},
            ${tx.json(toJson(product.buyLinks))}, ${product.hidden ? new Date() : null})`;
        productsCreated++;
      } else if (existingProducts[0].base_price_cents !== cents(product.price, product.price)) {
        throw new Error(`Product price drift for ${product.slug}; initialization will not overwrite prices`);
      }

      for (const locale of locales) {
        const localized = locale === "en" ? product : localizedProduct(product, locale);
        await tx`INSERT INTO product_localizations (product_id, locale, title, description, seo_title, seo_description, image_alt)
          VALUES (${productId}, ${locale}, ${localized.title}, ${localized.description}, ${localized.title}, ${localized.description}, ${localized.title})
          ON CONFLICT (product_id, locale) DO NOTHING`;
      }

      const sourceVariants = product.variants.length ? product.variants : [{ options: [], price: product.price, image: product.images[0] || null }];
      for (const [position, variant] of sourceVariants.entries()) {
        const approved = approvedSkuFor(product.slug, position);
        if (!approved) throw new Error(`Missing approved SKU for ${product.slug}:${position}`);
        const title = variant.options.length ? variant.options.map((option) => `${option.name}: ${option.value}`).join(" / ") : "Default";
        const existingVariants = await tx<{ id: string; sku: string | null; price_cents: number; sku_approval_status: string }[]>`
          SELECT id, sku, price_cents, sku_approval_status FROM product_variants
          WHERE id = ${approved.variantId} OR (product_id = ${productId} AND legacy_key = ${String(position)})`;
        if (existingVariants.length > 1 || (existingVariants[0] && existingVariants[0].id !== approved.variantId)) {
          throw new Error(`Variant identity conflict for ${approved.sku}`);
        }
        if (!existingVariants[0]) {
          await tx`INSERT INTO product_variants (id, product_id, legacy_key, sku, title, options, price_cents, currency, image_url, position, active,
              sku_approval_status, sku_reviewed_by, sku_reviewed_at, sku_reviewed_value, sku_review_note)
            VALUES (${approved.variantId}, ${productId}, ${String(position)}, ${approved.sku}, ${title}, ${tx.json(toJson(variant.options))},
              ${cents(variant.price, product.price)}, 'USD', ${variant.image || null}, ${position}, true,
              'approved', ${actor.userId}, now(), ${approved.sku}, ${REVIEW_NOTE})`;
          variantsCreated++;
          variantsApproved++;
        } else {
          const current = existingVariants[0];
          if (current.price_cents !== cents(variant.price, product.price)) throw new Error(`Variant price drift for ${approved.sku}`);
          if (current.sku && current.sku.toUpperCase() !== approved.sku) throw new Error(`Existing SKU conflict for ${approved.sku}`);
          if (!current.sku) {
            await tx`UPDATE product_variants SET sku = ${approved.sku}, updated_at = now() WHERE id = ${approved.variantId}`;
          }
          if (!current.sku || current.sku_approval_status !== "approved") {
            await tx`UPDATE product_variants SET sku_approval_status = 'approved', sku_reviewed_by = ${actor.userId}, sku_reviewed_at = now(),
              sku_reviewed_value = ${approved.sku}, sku_review_note = ${REVIEW_NOTE}, updated_at = now() WHERE id = ${approved.variantId}`;
            variantsApproved++;
          }
        }
      }

      for (const [position, url] of product.images.entries()) {
        await tx`INSERT INTO product_images (id, product_id, url, alt_text, position)
          VALUES (${stableCatalogueUuid(`product:${product.slug}:image:${url}`)}, ${productId}, ${url}, ${product.title}, ${position})
          ON CONFLICT (product_id, url) DO NOTHING`;
      }
    }

    const variantIds = approvedSkuRows.map((row) => row.variantId);
    const [counts] = await tx<{ products: number; variants: number; approved: number; inventory: number; movements: number }[]>`
      SELECT
        (SELECT count(*)::int FROM products WHERE id = ANY(${approvedSkuRows.map((row) => row.productId)}::uuid[])) AS products,
        (SELECT count(*)::int FROM product_variants WHERE id = ANY(${variantIds}::uuid[])) AS variants,
        (SELECT count(*)::int FROM product_variants WHERE id = ANY(${variantIds}::uuid[]) AND sku_approval_status = 'approved' AND sku_reviewed_value = sku) AS approved,
        (SELECT count(*)::int FROM inventory_levels WHERE variant_id = ANY(${variantIds}::uuid[])) AS inventory,
        (SELECT count(*)::int FROM inventory_movements WHERE variant_id = ANY(${variantIds}::uuid[])) AS movements`;
    if (counts.products !== 44 || counts.variants !== 79 || counts.approved !== 79 || counts.inventory !== 0 || counts.movements !== 0) {
      throw new Error(`Post-write verification failed: ${JSON.stringify(counts)}`);
    }

    const result = { manifestSha256: SKU_INITIALIZATION_MANIFEST_SHA256, productsCreated, variantsCreated, variantsApproved, ...counts };
    await tx`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, after_data, request_id, ip_hash)
      VALUES (${randomUUID()}, ${actor.userId}, 'catalogue.sku_initialization', 'catalogue_manifest', ${SKU_INITIALIZATION_MANIFEST_SHA256},
        ${tx.json(toJson(result))}, ${actor.requestId || null}, ${actor.ipHash || null})`;
    return result;
  });
}
