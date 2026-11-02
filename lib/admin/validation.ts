import { locales } from "../i18n";

export class AdminValidationError extends Error {
  status = 400;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const statuses = ["draft", "published", "unpublished", "archived"] as const;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AdminValidationError("Expected an object");
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, max = 5000) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new AdminValidationError(`${field} is required`);
  return value.trim();
}

function optionalText(value: unknown, field: string, max = 5000) {
  if (value == null || value === "") return null;
  return text(value, field, max);
}

function integer(value: unknown, field: string, min = 0, max = 2_147_483_647) {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) throw new AdminValidationError(`${field} must be an integer between ${min} and ${max}`);
  return Number(value);
}

export type AdminProductInput = ReturnType<typeof parseAdminProduct>;

export function parseAdminProduct(value: unknown, create: boolean) {
  const data = object(value);
  const slug = create ? text(data.slug, "slug", 160) : undefined;
  if (slug && !slugPattern.test(slug)) throw new AdminValidationError("slug must use lower-case letters, numbers and hyphens");
  const categoryId = text(data.categoryId, "categoryId", 40);
  if (!uuidPattern.test(categoryId)) throw new AdminValidationError("categoryId is invalid");
  const status = text(data.status, "status", 20) as (typeof statuses)[number];
  if (!statuses.includes(status)) throw new AdminValidationError("status is invalid");
  const basePriceCents = integer(data.basePriceCents, "basePriceCents");
  const currency = text(data.currency, "currency", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new AdminValidationError("currency is invalid");

  if (!Array.isArray(data.localizations)) throw new AdminValidationError("localizations are required");
  const localizations = data.localizations.map((entry) => {
    const item = object(entry);
    const locale = text(item.locale, "locale", 10);
    if (!locales.includes(locale as never)) throw new AdminValidationError(`unsupported locale: ${locale}`);
    return {
      locale,
      title: text(item.title, `${locale}.title`, 240),
      description: text(item.description, `${locale}.description`, 10_000),
      seoTitle: optionalText(item.seoTitle, `${locale}.seoTitle`, 240),
      seoDescription: optionalText(item.seoDescription, `${locale}.seoDescription`, 500),
      imageAlt: optionalText(item.imageAlt, `${locale}.imageAlt`, 500)
    };
  });
  if (new Set(localizations.map((item) => item.locale)).size !== localizations.length) throw new AdminValidationError("localization locales must be unique");
  if (create && locales.some((locale) => !localizations.some((item) => item.locale === locale))) throw new AdminValidationError("all five localizations are required when creating a product");

  if (!Array.isArray(data.images)) throw new AdminValidationError("images are required");
  const images = data.images.map((entry, position) => {
    const item = object(entry);
    const url = text(item.url, `images.${position}.url`, 2000);
    if (!url.startsWith("/") && !/^https:\/\//.test(url)) throw new AdminValidationError("image URL must be an absolute HTTPS URL or a site path");
    return { id: optionalText(item.id, "image.id", 40), url, altText: optionalText(item.altText, "image.altText", 500), position };
  });
  if (new Set(images.map((item) => item.url)).size !== images.length) throw new AdminValidationError("image URLs must be unique");

  if (!Array.isArray(data.variants) || !data.variants.length) throw new AdminValidationError("at least one variant is required");
  const variants = data.variants.map((entry, position) => {
    const item = object(entry);
    const id = optionalText(item.id, "variant.id", 40);
    if (id && !uuidPattern.test(id)) throw new AdminValidationError("variant id is invalid");
    const sku = optionalText(item.sku, "variant.sku", 100)?.toUpperCase() || null;
    if (sku && !/^[A-Z0-9][A-Z0-9._-]*$/.test(sku)) throw new AdminValidationError("SKU contains unsupported characters");
    const options = Array.isArray(item.options) ? item.options.map((entry) => {
      const option = object(entry);
      return { name: text(option.name, "option.name", 100), value: text(option.value, "option.value", 200) };
    }) : [];
    return {
      id,
      sku,
      title: text(item.title, "variant.title", 240),
      options,
      priceCents: integer(item.priceCents, "variant.priceCents"),
      currency: text(item.currency || currency, "variant.currency", 3).toUpperCase(),
      imageUrl: optionalText(item.imageUrl, "variant.imageUrl", 2000),
      position,
      active: item.active !== false
    };
  });
  const skus = variants.flatMap((variant) => variant.sku ? [variant.sku] : []);
  if (new Set(skus).size !== skus.length) throw new AdminValidationError("SKUs must be unique within a product");

  return {
    slug,
    originalHandle: create ? text(data.originalHandle || slug, "originalHandle", 240) : undefined,
    categoryId,
    status,
    basePriceCents,
    currency,
    soldOutOverride: data.soldOutOverride === true,
    badge: optionalText(data.badge, "badge", 100),
    details: Array.isArray(data.details) ? data.details.map((item) => text(item, "detail", 1000)) : [],
    buyLinks: data.buyLinks && typeof data.buyLinks === "object" && !Array.isArray(data.buyLinks) ? data.buyLinks as Record<string, string> : {},
    localizations,
    images,
    variants
  };
}

export function parseInventoryAdjustment(value: unknown) {
  const data = object(value);
  const variantId = text(data.variantId, "variantId", 40);
  if (!uuidPattern.test(variantId)) throw new AdminValidationError("variantId is invalid");
  const deltaOnHand = integer(data.deltaOnHand, "deltaOnHand", -1_000_000, 1_000_000);
  const reason = text(data.reason, "reason", 500);
  if (deltaOnHand === 0) throw new AdminValidationError("inventory adjustment cannot be zero");
  return { variantId, deltaOnHand, reason };
}

export function parseCategory(value: unknown) {
  const data = object(value);
  const slug = text(data.slug, "slug", 100);
  if (!slugPattern.test(slug)) throw new AdminValidationError("category slug is invalid");
  return { slug, name: text(data.name, "name", 160), position: integer(data.position ?? 0, "position", 0, 10_000), active: data.active !== false };
}
