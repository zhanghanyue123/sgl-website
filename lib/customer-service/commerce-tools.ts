import { randomUUID } from "node:crypto";
import { getDb, toJson } from "@/lib/admin/db";
import { localizedPath, type Locale } from "@/lib/i18n";
import type { CommerceCustomerSession } from "./customer-session";

export const commerceToolNames = [
  "commerce_search_products",
  "commerce_get_product",
  "commerce_get_variant_stock",
  "commerce_get_shipping_options",
  "commerce_get_order_status",
  "commerce_get_tracking",
  "commerce_get_customer_addresses",
  "commerce_recommend_products"
] as const;
export type CommerceToolName = (typeof commerceToolNames)[number];
export type CommerceStockState = "available" | "out_of_stock" | "not_recorded" | "not_connected" | "stale";
export type CommerceAudience = "public" | "customer" | "staff";

const locales = new Set(["en", "zh-CN", "ja-JP", "ko-KR", "it-IT"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const country = /^[A-Z]{2}$/;

export function isCommerceToolName(value: unknown): value is CommerceToolName {
  return typeof value === "string" && commerceToolNames.includes(value as CommerceToolName);
}

export const commerceToolSchemas: Record<CommerceToolName, Record<string, unknown>> = {
  commerce_search_products: { type: "object", additionalProperties: false, required: ["query", "locale"], properties: { query: { type: "string" }, locale: { type: "string", enum: [...locales] }, category: { type: "string" }, maxPriceCents: { type: "integer" }, limit: { type: "integer" } } },
  commerce_get_product: { type: "object", additionalProperties: false, required: ["product", "locale"], properties: { product: { type: "string" }, locale: { type: "string", enum: [...locales] } } },
  commerce_get_variant_stock: { type: "object", additionalProperties: false, properties: { variantId: { type: "string" }, sku: { type: "string" } } },
  commerce_get_shipping_options: { type: "object", additionalProperties: false, required: ["countryCode"], properties: { countryCode: { type: "string" } } },
  commerce_get_order_status: { type: "object", additionalProperties: false, required: ["orderNumber"], properties: { orderNumber: { type: "string" } } },
  commerce_get_tracking: { type: "object", additionalProperties: false, required: ["orderNumber"], properties: { orderNumber: { type: "string" } } },
  commerce_get_customer_addresses: { type: "object", additionalProperties: false, properties: {} },
  commerce_recommend_products: { type: "object", additionalProperties: false, required: ["query", "locale"], properties: { query: { type: "string" }, locale: { type: "string", enum: [...locales] }, budgetCents: { type: "integer" }, category: { type: "string" }, limit: { type: "integer" } } }
};

export class CommerceToolError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function cleanText(value: unknown, name: string, max = 200, required = true) {
  const result = typeof value === "string" ? value.trim().replace(/[\u0000-\u001f\u007f]/g, "") : "";
  if ((required && !result) || result.length > max) throw new CommerceToolError(400, `${name} is invalid`);
  return result;
}
function cleanLocale(value: unknown): Locale {
  const result = cleanText(value, "locale", 10);
  if (!locales.has(result)) throw new CommerceToolError(400, "locale is unsupported");
  return result as Locale;
}
function cleanLimit(value: unknown, fallback = 4) {
  const result = value == null ? fallback : Number(value);
  if (!Number.isInteger(result) || result < 1 || result > 4) throw new CommerceToolError(400, "limit must be between 1 and 4");
  return result;
}
function optionalMoney(value: unknown, name: string) {
  if (value == null) return null;
  const result = Number(value);
  if (!Number.isInteger(result) || result < 0 || result > 100_000_000) throw new CommerceToolError(400, `${name} is invalid`);
  return result;
}

export function parseCommerceToolInput(tool: CommerceToolName, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CommerceToolError(400, "tool input must be an object");
  const body = value as Record<string, unknown>;
  if (tool === "commerce_search_products") return { query: cleanText(body.query, "query", 200), locale: cleanLocale(body.locale), category: cleanText(body.category, "category", 100, false) || null, maxPriceCents: optionalMoney(body.maxPriceCents, "maxPriceCents"), limit: cleanLimit(body.limit) };
  if (tool === "commerce_get_product") return { product: cleanText(body.product, "product", 200), locale: cleanLocale(body.locale) };
  if (tool === "commerce_get_variant_stock") {
    const variantId = cleanText(body.variantId, "variantId", 36, false); const sku = cleanText(body.sku, "sku", 100, false);
    if ((!variantId && !sku) || (variantId && sku) || (variantId && !uuid.test(variantId))) throw new CommerceToolError(400, "provide exactly one valid variantId or SKU");
    return { variantId: variantId || null, sku: sku || null };
  }
  if (tool === "commerce_get_shipping_options") { const countryCode = cleanText(body.countryCode, "countryCode", 2).toUpperCase(); if (!country.test(countryCode)) throw new CommerceToolError(400, "countryCode is invalid"); return { countryCode }; }
  if (tool === "commerce_get_order_status" || tool === "commerce_get_tracking") return { orderNumber: cleanText(body.orderNumber, "orderNumber", 100) };
  if (tool === "commerce_get_customer_addresses") return {};
  return { query: cleanText(body.query, "query", 200), locale: cleanLocale(body.locale), budgetCents: optionalMoney(body.budgetCents, "budgetCents"), category: cleanText(body.category, "category", 100, false) || null, limit: cleanLimit(body.limit, 3) };
}

export function stockState(row: { inventory_recorded: boolean; available: number | null; sold_out_override?: boolean; updated_at?: Date | string | null }, now = Date.now()): CommerceStockState {
  if (!row.inventory_recorded) return "not_recorded";
  if (row.sold_out_override || Number(row.available) <= 0) return "out_of_stock";
  if (row.updated_at && now - new Date(row.updated_at).getTime() > 24 * 60 * 60 * 1000) return "stale";
  return "available";
}

export function recommendAvailableProducts<T extends { variants: Array<{ stockState: CommerceStockState }> }>(products: T[], limit = 3) {
  return products.filter(item => item.variants.some(variant => variant.stockState === "available")).slice(0, Math.min(Math.max(limit, 1), 4));
}

function productLink(slug: string, locale: Locale) { return localizedPath(`/shop/${slug}`, locale); }
function requireVerifiedCustomer(session: CommerceCustomerSession | null) {
  if (!session) throw new CommerceToolError(401, "customer login is required");
  if (!session.emailVerified) throw new CommerceToolError(403, "verified customer account is required");
  return session;
}
function maskLine(value: string) { return value.length <= 4 ? "••••" : `${value.slice(0, 2)}${"•".repeat(Math.min(value.length - 2, 8))}`; }

async function logActivity(input: { tool: CommerceToolName; audience: CommerceAudience; customerId?: string | null; conversationId?: string | null; outcome: string; entityType?: string | null; entityId?: string | null; metadata?: Record<string, unknown> }) {
  await getDb()`INSERT INTO fries_commerce_tool_activity(id,tool_name,audience,customer_id,conversation_id,outcome,entity_type,entity_id,metadata)
    VALUES(${randomUUID()},${input.tool},${input.audience},${input.customerId || null},${input.conversationId || null},${input.outcome},${input.entityType || null},${input.entityId || null},${getDb().json(toJson(input.metadata || {}))})`;
}

async function productRows(input: { locale: Locale; query?: string; product?: string; category?: string | null; maxPriceCents?: number | null; limit: number }) {
  const db = getDb(); const queryTerms = input.query?.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(term=>term.length>1).slice(0,12) || []; const product = input.product || null;
  return db<Array<Record<string, unknown>>>`SELECT p.id,p.slug,c.slug AS category,COALESCE(l.title,en.title,p.slug) AS name,
      COALESCE(l.description,en.description,'') AS description,p.base_price_cents,p.currency,p.sold_out_override,p.updated_at,
      (SELECT url FROM product_images WHERE product_id=p.id ORDER BY position,id LIMIT 1) AS image,
      COALESCE(jsonb_agg(jsonb_build_object('id',v.id,'sku',v.sku,'name',v.title,'options',v.options,'priceCents',v.price_cents,
        'currency',v.currency,'stockState',CASE WHEN i.variant_id IS NULL THEN 'not_recorded' WHEN p.sold_out_override OR i.available<=0 THEN 'out_of_stock'
          WHEN i.updated_at < now()-interval '24 hours' THEN 'stale' ELSE 'available' END)) FILTER(WHERE v.id IS NOT NULL),'[]'::jsonb) AS variants
    FROM products p JOIN product_categories c ON c.id=p.category_id
    LEFT JOIN product_localizations l ON l.product_id=p.id AND l.locale=${input.locale}
    LEFT JOIN product_localizations en ON en.product_id=p.id AND en.locale='en'
    LEFT JOIN product_variants v ON v.product_id=p.id AND v.active=true
    LEFT JOIN inventory_levels i ON i.variant_id=v.id
    WHERE p.status='published'
      AND (${product}::text IS NULL OR p.id::text=${product} OR p.slug=${product})
      AND (${queryTerms.length}=0 OR EXISTS (SELECT 1 FROM unnest(${queryTerms}::text[]) term
        WHERE lower(COALESCE(l.title,en.title,p.slug)||' '||COALESCE(l.description,en.description,'')||' '||c.slug) LIKE '%'||term||'%'))
      AND (${input.category || null}::text IS NULL OR c.slug=${input.category || null})
      AND (${input.maxPriceCents ?? null}::int IS NULL OR p.base_price_cents<=${input.maxPriceCents ?? null})
    GROUP BY p.id,c.slug,l.title,en.title,l.description,en.description ORDER BY p.updated_at DESC LIMIT ${input.limit}`;
}

type CommerceProductResult = { id: unknown; name: unknown; description: unknown; image: unknown; priceCents: unknown; currency: unknown; category: unknown; link: string; variants: Array<{ stockState: CommerceStockState; [key:string]:unknown }> };
function publicProduct(row: Record<string, unknown>, locale: Locale): CommerceProductResult {
  const variants = Array.isArray(row.variants) ? row.variants.filter((item): item is { stockState: CommerceStockState; [key:string]:unknown } => Boolean(item && typeof item === "object" && ["available","out_of_stock","not_recorded","stale"].includes(String((item as {stockState?:unknown}).stockState)))) : [];
  return { id: row.id, name: row.name, description: row.description, image: row.image, priceCents: row.base_price_cents, currency: row.currency, category: row.category, link: productLink(String(row.slug), locale), variants };
}

export async function executeCommerceTool(tool: CommerceToolName, rawInput: unknown, context: { session: CommerceCustomerSession | null; conversationId?: string | null; audience?: CommerceAudience }) {
  const input = parseCommerceToolInput(tool, rawInput) as any;
  const audience = context.audience || (context.session ? "customer" : "public");
  try {
    let result: unknown; let entity: { type?: string; id?: string } = {};
    if (tool === "commerce_search_products" || tool === "commerce_recommend_products") {
      const rows = await productRows({ ...input, limit: input.limit });
      const products = rows.map(row => publicProduct(row, input.locale));
      const recommendations = recommendAvailableProducts(products, input.limit);
      result = tool === "commerce_recommend_products"
        ? { products: recommendations, excludedUnavailable: products.length - recommendations.length }
        : { products };
    } else if (tool === "commerce_get_product") {
      const rows = await productRows({ locale: input.locale, product: input.product, limit: 1 }); result = rows[0] ? publicProduct(rows[0], input.locale) : null; entity = rows[0] ? { type: "product", id: String(rows[0].id) } : {};
    } else if (tool === "commerce_get_variant_stock") {
      const rows = await getDb()<Array<{ variant_id:string;sku:string|null;available:number|null;reserved:number|null;updated_at:Date|null;inventory_recorded:boolean;sold_out_override:boolean }>>`
        SELECT v.id AS variant_id,v.sku,i.available,i.reserved,i.updated_at,(i.variant_id IS NOT NULL) AS inventory_recorded,p.sold_out_override
        FROM product_variants v JOIN products p ON p.id=v.product_id LEFT JOIN inventory_levels i ON i.variant_id=v.id
        WHERE p.status='published' AND v.active=true AND (${input.variantId}::uuid IS NOT NULL AND v.id=${input.variantId}::uuid OR ${input.sku}::text IS NOT NULL AND upper(v.sku)=upper(${input.sku})) LIMIT 1`;
      const row=rows[0]; result=row?{variantId:row.variant_id,sku:row.sku,state:stockState(row),lastUpdated:row.updated_at,...(audience==="staff"?{available:row.available,reserved:row.reserved}:{})}:null; entity=row?{type:"product_variant",id:row.variant_id}:{};
    } else if (tool === "commerce_get_shipping_options") {
      const rows=await getDb()<Array<{code:string;name:string}>>`SELECT code,name FROM shipping_regions WHERE active=true AND country_codes ? ${input.countryCode} ORDER BY name`;
      result={countryCode:input.countryCode,supported:rows.length>0,regions:rows,shippingMethods:"not_recorded",shippingCost:"not_recorded",dispatchTime:"not_recorded",deliveryWindow:"not_recorded"};
    } else if (tool === "commerce_get_order_status") {
      const session=requireVerifiedCustomer(context.session); const rows=await getDb()<Array<Record<string,unknown>>>`SELECT id,order_number,payment_status,fulfillment_status,order_status,updated_at FROM orders WHERE customer_id=${session.customerId} AND order_number=${input.orderNumber} LIMIT 1`; result=rows[0]||null; entity=rows[0]?{type:"order",id:String(rows[0].id)}:{};
    } else if (tool === "commerce_get_tracking") {
      const session=requireVerifiedCustomer(context.session); const rows=await getDb()<Array<Record<string,unknown>>>`SELECT o.id AS order_id,o.order_number,o.fulfillment_status,s.carrier,s.tracking_number,s.tracking_url,s.status,s.dispatched_at,s.delivered_at,s.updated_at FROM orders o LEFT JOIN fulfillment_shipments s ON s.order_id=o.id WHERE o.customer_id=${session.customerId} AND o.order_number=${input.orderNumber} ORDER BY s.created_at DESC NULLS LAST LIMIT 1`; result=rows[0]||null; entity=rows[0]?{type:"order",id:String(rows[0].order_id)}:{};
    } else {
      const session=requireVerifiedCustomer(context.session); const rows=await getDb()<Array<Record<string,unknown>>>`SELECT id,label,recipient_name,line1,city,region,postal_code,country_code,is_default,updated_at FROM customer_addresses WHERE customer_id=${session.customerId} ORDER BY is_default DESC,created_at`;
      result={addresses:rows.map(row=>({...row,line1:maskLine(String(row.line1)),recipient_name:maskLine(String(row.recipient_name))}))};
    }
    await logActivity({tool,audience,customerId:context.session?.customerId,conversationId:context.conversationId,outcome:"success",entityType:entity.type,entityId:entity.id,metadata:{resultFound:result!==null}});
    return result;
  } catch (error) {
    await logActivity({tool,audience,customerId:context.session?.customerId,conversationId:context.conversationId,outcome:"failed",metadata:{code:error instanceof CommerceToolError?`http_${error.status}`:"internal_error"}}).catch(()=>undefined);
    throw error;
  }
}

export async function listCommerceToolActivity(limit=100) {
  return getDb()`SELECT id,tool_name,audience,outcome,entity_type,entity_id,metadata,created_at FROM fries_commerce_tool_activity ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limit,1),250)}`;
}
