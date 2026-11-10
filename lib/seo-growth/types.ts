export type SeoSeverity = "critical" | "high" | "medium" | "low" | "info";
export type SeoIntent = "informational" | "commercial" | "transactional" | "navigational" | "unknown";

export type SeoEvidence = {
  id: string;
  type: "crawl" | "catalog" | "search_performance" | "verified_provider" | "manual";
  label: string;
  sourceUrl?: string;
  observedAt: string;
  recordId?: string;
  value?: string | number | boolean | null;
};

export type CrawledImage = { src: string; alt: string | null };
export type CrawledPage = {
  url: string;
  normalizedUrl: string;
  statusCode: number;
  redirectChain: string[];
  canonicalUrl: string | null;
  locale: string | null;
  title: string | null;
  metaDescription: string | null;
  headings: { h1: string[]; h2: string[] };
  hreflang: Record<string, string>;
  internalLinks: string[];
  images: CrawledImage[];
  schemaTypes: string[];
  mobileMetrics: Record<string, number | null>;
  responseMs: number | null;
  fetchedAt: string;
};

export type SeoIssue = {
  type: string;
  severity: SeoSeverity;
  pageUrl: string | null;
  summary: string;
  evidence: SeoEvidence[];
};

export type KeywordOpportunity = {
  keyword: string;
  locale: string;
  intent: SeoIntent;
  cluster: string;
  sourceType: "catalog" | "search_console" | "bing" | "verified_provider" | "manual";
  sourceReference: string;
  metrics: Record<string, number>;
  evidenceIds: string[];
};

export type SearchPerformanceRow = {
  query?: string;
  page?: string;
  country?: string;
  device?: string;
  language?: string;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  averagePosition?: number;
  sessions?: number;
  evidence: SeoEvidence;
};
