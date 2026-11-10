export type BaiduSearchResourceStatus = {
  configured: boolean;
  connected: false;
  site: string | null;
  reason: string;
};

/**
 * Baidu's public API documentation currently covers resource submission, while
 * traffic and keyword analytics are exposed in the Search Resource Platform UI.
 * This status deliberately stays disconnected until SGL configures and approves
 * a verified read-only evidence provider. A site name alone never implies data
 * connectivity.
 */
export function baiduSearchResourceStatus(
  environment: Readonly<Record<string, string | undefined>> = process.env
): BaiduSearchResourceStatus {
  const site = environment.BAIDU_SEARCH_RESOURCE_SITE?.trim() || null;
  return {
    configured: Boolean(site),
    connected: false,
    site,
    reason: site
      ? "Verified Baidu read-only analytics provider is not configured"
      : "Baidu Search Resource Platform site is not configured"
  };
}
