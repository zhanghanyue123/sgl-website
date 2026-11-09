import { getDb } from "@/lib/admin/db";
import { storefrontProducts } from "@/data/products";
import { localizedProduct } from "@/lib/localized-copy";
import type { Locale } from "@/lib/i18n";
import { WEBSITE_ORGANIZATION_ID } from "./constants";
import type { ApprovedPolicyFact, PublicProductFact } from "./types";

export async function readApprovedPublicKnowledge(locale: string) {
  const localized = locale === "en" ? storefrontProducts : storefrontProducts.map((product) => localizedProduct(product, locale as Exclude<Locale, "en">));
  const products = localized.map<PublicProductFact>((product) => ({
    id: product.slug, slug: product.slug, title: product.title, category: product.category,
    description: product.description, details: product.details || [],
    variants: product.variants.map((variant) => ({ options: variant.options }))
  }));
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
