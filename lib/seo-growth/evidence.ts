import type { SeoEvidence } from "./types";

export function validateEvidence(value: unknown): SeoEvidence {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("SEO evidence must be an object");
  const row = value as Record<string, unknown>;
  const types = new Set(["crawl", "catalog", "search_performance", "verified_provider", "manual"]);
  if (typeof row.id !== "string" || !/^[a-z0-9][a-z0-9._:-]{2,159}$/i.test(row.id)) throw new Error("SEO evidence id is invalid");
  if (typeof row.type !== "string" || !types.has(row.type)) throw new Error("SEO evidence type is invalid");
  if (typeof row.label !== "string" || !row.label.trim() || row.label.length > 300) throw new Error("SEO evidence label is invalid");
  if (typeof row.observedAt !== "string" || Number.isNaN(Date.parse(row.observedAt))) throw new Error("SEO evidence timestamp is invalid");
  if (row.sourceUrl !== undefined) {
    if (typeof row.sourceUrl !== "string") throw new Error("SEO evidence URL is invalid");
    const url = new URL(row.sourceUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("SEO evidence URL is invalid");
  }
  return row as SeoEvidence;
}

export function assertEvidenceReferences(references: readonly string[], evidence: readonly SeoEvidence[]) {
  if (references.length === 0) throw new Error("Every factual SEO insight requires evidence");
  const known = new Set(evidence.map((item) => item.id));
  if (references.some((id) => !known.has(id))) throw new Error("SEO insight references unknown evidence");
  return [...new Set(references)];
}

export function crawlEvidence(pageUrl: string, field: string, value: SeoEvidence["value"], observedAt: string): SeoEvidence {
  return {
    id: `crawl:${Buffer.from(pageUrl).toString("base64url").slice(0, 48)}:${field}`,
    type: "crawl",
    label: `${field} observed during website crawl`,
    sourceUrl: pageUrl,
    observedAt,
    value
  };
}
