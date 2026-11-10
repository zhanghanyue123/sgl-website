import type { KeywordOpportunity, SeoEvidence, SeoIntent } from "./types";
import { assertEvidenceReferences } from "./evidence";

const tokens = (value: string) => new Set(value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter((item) => item.length > 1));

export function classifySearchIntent(keyword: string): SeoIntent {
  const value = keyword.toLowerCase();
  if (/\b(buy|price|shop|order|for sale|购买|价格)\b/.test(value)) return "transactional";
  if (/\b(best|review|compare|vs|推荐|测评|对比)\b/.test(value)) return "commercial";
  if (/\b(how|what|why|guide|tips|如何|什么|指南)\b/.test(value)) return "informational";
  if (/\b(seagull labs|sgl|theseagulllabs)\b/.test(value)) return "navigational";
  return "unknown";
}

export function clusterKeywords(keywords: readonly string[]) {
  const clusters = new Map<string, string[]>();
  for (const keyword of keywords) {
    const words = [...tokens(keyword)]; const key = words.slice(0, 2).sort().join(" ") || keyword.toLowerCase();
    clusters.set(key, [...(clusters.get(key) || []), keyword]);
  }
  return clusters;
}

export function mapKeywordToCatalog(keyword: string, catalog: readonly { id: string; title: string; categoryId: string; category: string }[]) {
  const query = tokens(keyword);
  return catalog.map((item) => {
    const product = tokens(`${item.title} ${item.category}`); const matches = [...query].filter((token) => product.has(token)).length;
    return { ...item, relevance: query.size ? matches / query.size : 0 };
  }).filter((item) => item.relevance > 0).sort((a, b) => b.relevance - a.relevance);
}

export function detectKeywordCannibalization(mappings: readonly { keyword: string; pageUrl: string; evidenceIds: string[] }[], evidence: readonly SeoEvidence[]) {
  const groups = new Map<string, typeof mappings>();
  for (const mapping of mappings) groups.set(mapping.keyword.toLowerCase(), [...(groups.get(mapping.keyword.toLowerCase()) || []), mapping]);
  return [...groups.entries()].flatMap(([keyword, rows]) => {
    const pages = [...new Set(rows.map((row) => row.pageUrl))]; if (pages.length < 2) return [];
    const evidenceIds = assertEvidenceReferences(rows.flatMap((row) => row.evidenceIds), evidence);
    return [{ keyword, pages, evidenceIds }];
  });
}

export function keywordsWithoutLandingPages(keywords: readonly KeywordOpportunity[], mappedKeywords: ReadonlySet<string>) {
  return keywords.filter((item) => !mappedKeywords.has(item.keyword.toLowerCase()));
}

export interface KeywordDataProvider {
  readonly providerName: string;
  discover(input: { seed: string; locale: string }): Promise<{ opportunities: KeywordOpportunity[]; evidence: SeoEvidence[] }>;
}

export class KeywordProviderUnavailableError extends Error {}
export class DisabledKeywordProvider implements KeywordDataProvider {
  readonly providerName = "unconfigured";
  async discover(_input: { seed: string; locale: string }): Promise<never> { throw new KeywordProviderUnavailableError("Verified keyword data provider is not configured"); }
}
