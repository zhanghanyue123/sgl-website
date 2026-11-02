"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminButton, adminInput } from "./AdminPage";

const localeNames = { en: "English", "zh-CN": "简体中文", "ja-JP": "日本語", "ko-KR": "한국어", "it-IT": "Italiano" } as const;
const localeKeys = Object.keys(localeNames) as (keyof typeof localeNames)[];

type Category = { id: string; name: string };
type Localization = { locale: string; title: string; description: string; seoTitle: string; seoDescription: string; imageAlt: string };
type Image = { url: string; altText: string };
type Variant = { id?: string; sku: string; title: string; optionsText: string; priceCents: number; currency: string; imageUrl: string; active: boolean };

function initialLocalizations(product?: any): Localization[] {
  return localeKeys.map((locale) => {
    const found = product?.localizations?.find((item: any) => item.locale === locale);
    return { locale, title: found?.title || "", description: found?.description || "", seoTitle: found?.seo_title || "", seoDescription: found?.seo_description || "", imageAlt: found?.image_alt || "" };
  });
}

export default function ProductEditor({ product, categories }: { product?: any; categories: Category[] }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>(product?.slug || "");
  const [categoryId, setCategoryId] = useState<string>(product?.category_id || categories[0]?.id || "");
  const [status, setStatus] = useState<string>(product?.status || "draft");
  const [basePriceCents, setBasePriceCents] = useState<number>(product?.base_price_cents || 0);
  const [currency, setCurrency] = useState<string>(product?.currency || "USD");
  const [soldOutOverride, setSoldOutOverride] = useState(Boolean(product?.sold_out_override));
  const [badge, setBadge] = useState<string>(product?.badge || "");
  const [details, setDetails] = useState<string>(Array.isArray(product?.details) ? product.details.join("\n") : "");
  const [localizations, setLocalizations] = useState(() => initialLocalizations(product));
  const [images, setImages] = useState<Image[]>(() => product?.images?.map((image: any) => ({ url: image.url, altText: image.alt_text || "" })) || [{ url: "", altText: "" }]);
  const [variants, setVariants] = useState<Variant[]>(() => product?.variants?.map((variant: any) => ({ id: variant.id, sku: variant.sku || "", title: variant.title, optionsText: JSON.stringify(variant.options || []), priceCents: variant.price_cents, currency: variant.currency, imageUrl: variant.image_url || "", active: variant.active })) || [{ sku: "", title: "Default", optionsText: "[]", priceCents: 0, currency: "USD", imageUrl: "", active: true }]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function updateLocalization(index: number, key: keyof Localization, value: string) { setLocalizations((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  function updateImage(index: number, key: keyof Image, value: string) { setImages((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  function updateVariant(index: number, key: keyof Variant, value: string | number | boolean) { setVariants((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item)); }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const normalizedVariants = variants.map(({ optionsText, ...variant }) => ({ ...variant, sku: variant.sku || null, imageUrl: variant.imageUrl || null, options: JSON.parse(optionsText || "[]") }));
      const body = { slug, originalHandle: slug, categoryId, status, basePriceCents: Number(basePriceCents), currency, soldOutOverride, badge: badge || null, details: details.split("\n").map((item) => item.trim()).filter(Boolean), buyLinks: product?.buy_links || {}, localizations, images: images.filter((image) => image.url.trim()), variants: normalizedVariants };
      const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", { method: product ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save product");
      setMessage("Saved.");
      if (!product) router.push(`/admin/products/${result.id}`); else router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save product"); }
    finally { setSaving(false); }
  }

  return <form onSubmit={save} className="space-y-8">
    <section className="grid gap-4 border border-sglInk bg-white p-5 md:grid-cols-2 xl:grid-cols-4"><label className="text-sm font-bold">Slug<input className={adminInput} value={slug} disabled={Boolean(product)} onChange={(e) => setSlug(e.target.value)} required /></label><label className="text-sm font-bold">Category<select className={adminInput} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="text-sm font-bold">Status<select className={adminInput} value={status} onChange={(e) => setStatus(e.target.value)}>{["draft", "published", "unpublished", "archived"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm font-bold">Base price (cents)<input className={adminInput} type="number" min="0" value={basePriceCents} onChange={(e) => setBasePriceCents(Number(e.target.value))} /></label><label className="text-sm font-bold">Currency<input className={adminInput} maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} /></label><label className="text-sm font-bold">Badge<input className={adminInput} value={badge} onChange={(e) => setBadge(e.target.value)} /></label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={soldOutOverride} onChange={(e) => setSoldOutOverride(e.target.checked)} /> Force sold out</label><label className="text-sm font-bold md:col-span-2 xl:col-span-4">Details, one per line<textarea className={adminInput} rows={4} value={details} onChange={(e) => setDetails(e.target.value)} /></label></section>
    <section><h2 className="mb-3 text-2xl font-black uppercase">Localized content</h2><div className="space-y-4">{localizations.map((item, index) => <details key={item.locale} open={item.locale === "en"} className="border border-sglInk bg-white p-4"><summary className="cursor-pointer font-black uppercase">{localeNames[item.locale as keyof typeof localeNames]}</summary><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">Title<input className={adminInput} value={item.title} onChange={(e) => updateLocalization(index, "title", e.target.value)} required /></label><label className="text-sm font-bold">Image alt<input className={adminInput} value={item.imageAlt} onChange={(e) => updateLocalization(index, "imageAlt", e.target.value)} /></label><label className="text-sm font-bold md:col-span-2">Description<textarea className={adminInput} rows={5} value={item.description} onChange={(e) => updateLocalization(index, "description", e.target.value)} required /></label><label className="text-sm font-bold">SEO title<input className={adminInput} value={item.seoTitle} onChange={(e) => updateLocalization(index, "seoTitle", e.target.value)} /></label><label className="text-sm font-bold">SEO description<textarea className={adminInput} rows={2} value={item.seoDescription} onChange={(e) => updateLocalization(index, "seoDescription", e.target.value)} /></label></div></details>)}</div></section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-2xl font-black uppercase">Images</h2><button type="button" className={adminButton} onClick={() => setImages((items) => [...items, { url: "", altText: "" }])}>Add image</button></div><div className="space-y-3">{images.map((image, index) => <div key={index} className="grid gap-3 border border-sglInk bg-white p-4 md:grid-cols-[1fr_1fr_auto]"><input aria-label="Image URL" className={adminInput} placeholder="/images/... or https://..." value={image.url} onChange={(e) => updateImage(index, "url", e.target.value)} /><input aria-label="Image alt" className={adminInput} placeholder="Alt text" value={image.altText} onChange={(e) => updateImage(index, "altText", e.target.value)} /><button type="button" className="font-black uppercase" onClick={() => setImages((items) => items.filter((_, i) => i !== index))}>Remove</button></div>)}</div></section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-2xl font-black uppercase">Variants</h2><button type="button" className={adminButton} onClick={() => setVariants((items) => [...items, { sku: "", title: "New variant", optionsText: "[]", priceCents: basePriceCents, currency, imageUrl: "", active: true }])}>Add variant</button></div><div className="space-y-3">{variants.map((variant, index) => <div key={variant.id || index} className="grid gap-3 border border-sglInk bg-white p-4 md:grid-cols-2 xl:grid-cols-4"><label className="text-sm font-bold">Title<input className={adminInput} value={variant.title} onChange={(e) => updateVariant(index, "title", e.target.value)} /></label><label className="text-sm font-bold">SKU (blank is preserved)<input className={adminInput} value={variant.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} /></label><label className="text-sm font-bold">Price cents<input className={adminInput} type="number" min="0" value={variant.priceCents} onChange={(e) => updateVariant(index, "priceCents", Number(e.target.value))} /></label><label className="text-sm font-bold">Currency<input className={adminInput} value={variant.currency} onChange={(e) => updateVariant(index, "currency", e.target.value.toUpperCase())} /></label><label className="text-sm font-bold xl:col-span-2">Options JSON<input className={adminInput} value={variant.optionsText} onChange={(e) => updateVariant(index, "optionsText", e.target.value)} /></label><label className="text-sm font-bold">Image URL<input className={adminInput} value={variant.imageUrl} onChange={(e) => updateVariant(index, "imageUrl", e.target.value)} /></label><div className="flex items-end justify-between"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={variant.active} onChange={(e) => updateVariant(index, "active", e.target.checked)} /> Active</label>{variants.length > 1 && <button type="button" className="font-black uppercase" onClick={() => setVariants((items) => items.filter((_, i) => i !== index))}>Remove</button>}</div></div>)}</div></section>
    <div className="sticky bottom-4 flex items-center gap-4 border border-sglInk bg-[#efefec] p-4 shadow-[6px_6px_0_#111]"><button className={adminButton} disabled={saving}>{saving ? "Saving…" : "Save product"}</button><p className="text-sm font-bold" role="status">{message}</p></div>
  </form>;
}
