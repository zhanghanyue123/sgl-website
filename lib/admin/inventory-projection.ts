import type { Product } from "@/data/products";
import { approvedSkuFor } from "./sku-standardization";

export type DatabaseInventoryRow = {
  variant_id: string;
  product_id: string;
  slug: string;
  product_title: string;
  variant_legacy_key: string;
  variant_title: string;
  sku: string | null;
  active: boolean;
  image_url: string | null;
  price_cents: number;
  currency: string;
  warehouse_id: string | null;
  warehouse_name: string | null;
  on_hand: number | null;
  reserved: number | null;
  available: number | null;
  low_stock_threshold: number | null;
  updated_at: Date | string | null;
};

export type InventoryCatalogueRow = {
  row_id: string;
  variant_id: string | null;
  product_id: string | null;
  slug: string;
  product_title: string;
  variant_title: string;
  sku: string | null;
  active: boolean;
  image_url: string | null;
  price_cents: number;
  currency: string;
  warehouse_id: string | null;
  warehouse_name: string | null;
  on_hand: number | null;
  reserved: number | null;
  available: number | null;
  low_stock_threshold: number | null;
  updated_at: Date | string | null;
  low_stock: boolean | null;
  inventory_status: "recorded" | "not_recorded";
  catalogue_source: "website" | "database_only";
};

function normalizedSku(value: string | null | undefined) {
  return value?.trim().toUpperCase() || null;
}

function databaseKey(row: DatabaseInventoryRow) {
  const sku = normalizedSku(row.sku);
  return sku ? `sku:${sku}` : `catalogue:${row.slug}:${row.variant_legacy_key}`;
}

function canonicalRows(products: Product[]) {
  return products.flatMap((product) => {
    const variants: Product["variants"] = product.variants.length ? product.variants : [{ options: [], price: product.price }];
    return variants.map((variant, index) => ({
      key: `sku:${normalizedSku(variant.sku) || approvedSkuFor(product.slug, index)?.sku}`,
      slug: product.slug,
      product_title: product.title,
      variant_title: variant.options.length
        ? variant.options.map((option) => `${option.name}: ${option.value}`).join(" / ")
        : "Default",
      sku: normalizedSku(variant.sku) || approvedSkuFor(product.slug, index)?.sku || null,
      active: !product.hidden,
      image_url: variant.image || product.images[0] || null,
      price_cents: Math.round((variant.price ?? product.price) * 100),
      currency: "USD",
    }));
  });
}

export function mergeWebsiteCatalogueWithInventory(products: Product[], databaseRows: DatabaseInventoryRow[]) {
  const byKey = new Map<string, DatabaseInventoryRow[]>();
  for (const row of databaseRows) {
    const key = databaseKey(row);
    byKey.set(key, [...(byKey.get(key) || []), row]);
  }

  const consumed = new Set<string>();
  const rows: InventoryCatalogueRow[] = [];
  for (const catalogue of canonicalRows(products)) {
    const matches = byKey.get(catalogue.key) || [];
    if (!matches.length) {
      rows.push({
        row_id: catalogue.key,
        variant_id: null,
        product_id: null,
        ...catalogue,
        warehouse_id: null,
        warehouse_name: null,
        on_hand: null,
        reserved: null,
        available: null,
        low_stock_threshold: null,
        updated_at: null,
        low_stock: null,
        inventory_status: "not_recorded",
        catalogue_source: "website",
      });
      continue;
    }
    consumed.add(catalogue.key);
    for (const match of matches) {
      const recorded = match.warehouse_id !== null;
      rows.push({
        row_id: `${catalogue.key}:${match.warehouse_id || "not-recorded"}`,
        variant_id: match.variant_id,
        product_id: match.product_id,
        ...catalogue,
        warehouse_id: match.warehouse_id,
        warehouse_name: match.warehouse_name,
        on_hand: recorded ? match.on_hand : null,
        reserved: recorded ? match.reserved : null,
        available: recorded ? match.available : null,
        low_stock_threshold: recorded ? match.low_stock_threshold : null,
        updated_at: recorded ? match.updated_at : null,
        low_stock: recorded && match.available !== null && match.low_stock_threshold !== null
          ? match.available <= match.low_stock_threshold
          : null,
        inventory_status: recorded ? "recorded" : "not_recorded",
        catalogue_source: "website",
      });
    }
  }

  for (const row of databaseRows) {
    if (consumed.has(databaseKey(row))) continue;
    const recorded = row.warehouse_id !== null;
    rows.push({
      row_id: `database:${row.variant_id}:${row.warehouse_id || "not-recorded"}`,
      variant_id: row.variant_id,
      product_id: row.product_id,
      slug: row.slug,
      product_title: row.product_title,
      variant_title: row.variant_title,
      sku: normalizedSku(row.sku),
      active: row.active,
      image_url: row.image_url,
      price_cents: row.price_cents,
      currency: row.currency,
      warehouse_id: row.warehouse_id,
      warehouse_name: row.warehouse_name,
      on_hand: recorded ? row.on_hand : null,
      reserved: recorded ? row.reserved : null,
      available: recorded ? row.available : null,
      low_stock_threshold: recorded ? row.low_stock_threshold : null,
      updated_at: recorded ? row.updated_at : null,
      low_stock: recorded && row.available !== null && row.low_stock_threshold !== null
        ? row.available <= row.low_stock_threshold
        : null,
      inventory_status: recorded ? "recorded" : "not_recorded",
      catalogue_source: "database_only",
    });
  }

  return rows.sort((a, b) => a.product_title.localeCompare(b.product_title) || a.variant_title.localeCompare(b.variant_title));
}

export function inventorySummary(rows: InventoryCatalogueRow[], movementCount: number) {
  const productSlugs = new Set(rows.filter((row) => row.catalogue_source === "website").map((row) => row.slug));
  const recorded = rows.filter((row) => row.inventory_status === "recorded");
  return {
    catalogue_products: productSlugs.size,
    catalogue_rows: rows.length,
    sku_count: new Set(rows.map((row) => row.sku).filter(Boolean)).size,
    inventory_records: recorded.length,
    recorded_zero: recorded.filter((row) => row.on_hand === 0).length,
    without_inventory: rows.filter((row) => row.inventory_status === "not_recorded").length,
    total_on_hand: recorded.reduce((sum, row) => sum + (row.on_hand || 0), 0),
    total_reserved: recorded.reduce((sum, row) => sum + (row.reserved || 0), 0),
    total_available: recorded.reduce((sum, row) => sum + (row.available || 0), 0),
    movement_records: movementCount,
    updated_at: recorded.reduce<string | null>((latest, row) => {
      if (!row.updated_at) return latest;
      const value = new Date(row.updated_at).toISOString();
      return !latest || value > latest ? value : latest;
    }, null),
  };
}
