import type { SearchPerformanceRow } from "./types";

export type SearchPerformanceQuery = { startDate: string; endDate: string; dimensions: Array<"query" | "page" | "country" | "device" | "language"> };
export interface SearchPerformanceProvider {
  readonly providerName: "google_search_console" | "bing_webmaster" | "ga4";
  query(input: SearchPerformanceQuery): Promise<SearchPerformanceRow[]>;
}
export class SearchPerformanceUnavailableError extends Error {}
export class DisabledSearchPerformanceProvider implements SearchPerformanceProvider {
  readonly providerName = "google_search_console" as const;
  async query(_input: SearchPerformanceQuery): Promise<never> { throw new SearchPerformanceUnavailableError("Search performance provider is not configured"); }
}

export function analyzeSearchPerformance(rows: readonly SearchPerformanceRow[]) {
  return {
    highImpressionLowCtr: rows.filter((row) => (row.impressions || 0) >= 100 && row.ctr !== undefined && row.ctr < 0.02),
    rankingOpportunities: rows.filter((row) => row.averagePosition !== undefined && row.averagePosition > 4 && row.averagePosition <= 20 && (row.impressions || 0) > 0),
    pages: [...new Set(rows.flatMap((row) => row.page ? [row.page] : []))]
  };
}

const rowKey = (row: SearchPerformanceRow) => `${row.query || ""}\0${row.page || ""}\0${row.country || ""}\0${row.device || ""}\0${row.language || ""}`;
export function compareSearchPerformance(current: readonly SearchPerformanceRow[], previous: readonly SearchPerformanceRow[]) {
  const before = new Map(previous.map((row) => [rowKey(row), row]));
  return current.flatMap((row) => {
    const prior = before.get(rowKey(row)); if (!prior) return [];
    const impressionChange = (row.impressions || 0) - (prior.impressions || 0);
    const clickChange = (row.clicks || 0) - (prior.clicks || 0);
    return [{ row, prior, impressionChange, clickChange }];
  });
}

export function configuredSearchProviders(environment: Readonly<Record<string, string | undefined>> = process.env): SearchPerformanceProvider[] {
  // OAuth clients are intentionally injected by deployment-specific adapters.
  // Presence flags alone never produce metrics or pretend an integration works.
  void environment;
  return [];
}
