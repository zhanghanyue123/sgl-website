import { getDb } from "@/lib/admin/db";
import { localizedPath, type Locale } from "@/lib/i18n";
import { WEBSITE_ORGANIZATION_ID } from "./constants";
import type { ApprovedPolicyFact, PublicProductFact } from "./types";

export async function readApprovedPublicKnowledge(locale: string) {
  const selectedLocale = locale as Locale;
  const rows = await getDb()<Array<Record<string, any>>>`SELECT p.id,p.slug,c.slug AS category,COALESCE(l.title,en.title,p.slug) AS title,
      COALESCE(l.description,en.description,'') AS description,p.details,p.base_price_cents,p.currency,p.sold_out_override,
      (SELECT url FROM product_images WHERE product_id=p.id ORDER BY position,id LIMIT 1) AS image,
      COALESCE(jsonb_agg(jsonb_build_object('id',v.id,'sku',v.sku,'title',v.title,'options',v.options,'priceCents',v.price_cents,
        'currency',v.currency,'availability',CASE WHEN i.variant_id IS NULL THEN 'not_recorded' WHEN p.sold_out_override OR i.available<=0 THEN 'out_of_stock'
          WHEN i.updated_at<now()-interval '24 hours' THEN 'stale' ELSE 'available' END)) FILTER(WHERE v.id IS NOT NULL),'[]'::jsonb) AS variants
    FROM products p JOIN product_categories c ON c.id=p.category_id
    LEFT JOIN product_localizations l ON l.product_id=p.id AND l.locale=${selectedLocale}
    LEFT JOIN product_localizations en ON en.product_id=p.id AND en.locale='en'
    LEFT JOIN product_variants v ON v.product_id=p.id AND v.active=true
    LEFT JOIN inventory_levels i ON i.variant_id=v.id
    WHERE p.status='published' GROUP BY p.id,c.slug,l.title,en.title,l.description,en.description ORDER BY p.updated_at DESC`;
  const products = rows.map<PublicProductFact>((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const availability = product.sold_out_override || (variants.length > 0 && variants.every((item:any)=>item.availability==="out_of_stock")) ? "out_of_stock"
      : variants.some((item:any)=>item.availability==="available") ? "available"
      : variants.some((item:any)=>item.availability==="stale") ? "stale" : "not_recorded";
    return { id: product.id, slug: product.slug, title: product.title, category: product.category, description: product.description,
      details: Array.isArray(product.details) ? product.details.filter((item:unknown):item is string=>typeof item==="string") : [], image: product.image || null,
      priceCents: Number(product.base_price_cents), currency: product.currency, link: localizedPath(`/shop/${product.slug}`, selectedLocale), availability, variants };
  });
  const policies = await getDb()<ApprovedPolicyFact[]>`SELECT id::text,title,category,body FROM knowledge_base_articles
    WHERE organization_id=${WEBSITE_ORGANIZATION_ID} AND locale=${locale} AND status='published'
      AND category IN ('brand','shipping','returns','faq','instruction','product','specification')
    ORDER BY updated_at DESC LIMIT 50`;
  return { products, policies };
}

export function selectRelevantKnowledge(message: string, products: PublicProductFact[], policies: ApprovedPolicyFact[]) {
  const normalized = message.toLocaleLowerCase();
  const terms = new Set(normalized.split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 1));
  for (const sequence of normalized.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu) || []) {
    for (let index = 0; index < sequence.length - 1; index += 1) terms.add(sequence.slice(index, index + 2));
  }
  const score = (text: string) => [...terms].reduce((total, term) => total + (text.toLocaleLowerCase().includes(term) ? 1 : 0), 0);
  const selectedProducts = products.map((item) => ({ item, score: score(`${item.title} ${item.category} ${item.description} ${item.details.join(" ")}`) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(({ item }) => item);
  const selectedPolicies = policies.map((item) => ({ item, score: score(`${item.title} ${item.category} ${item.body}`) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(({ item }) => item);
  return { products: selectedProducts, policies: selectedPolicies };
}
