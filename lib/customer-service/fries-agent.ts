import { randomUUID } from "node:crypto";
import type { LlmProviderHealth, StructuredGenerationRequest, StructuredLlmProvider } from "@/lib/ai/provider";
import { LlmProviderRequestError, LlmUnavailableError } from "@/lib/ai/provider";

type Environment = Readonly<Record<string, string | undefined>>;
type AdapterOptions = {
  fetcher?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
  timeoutMs?: number;
  maxAttempts?: number;
};

const MAX_RESPONSE_BYTES = 256 * 1024;
const delay = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const retryableStatus = (status: number) => status === 408 || status === 425 || status === 429 || status >= 500;
const boundedInteger = (value: string | undefined, fallback: number, minimum: number, maximum: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
};

export function friesAdapterConfigurationStatus(environment: Environment = process.env) {
  const healthUrl = environment.SGL_FRIES_ADAPTER_HEALTH_URL?.trim();
  return {
    configured: Boolean(environment.SGL_FRIES_ADAPTER_URL?.trim() && healthUrl && environment.SGL_FRIES_ADAPTER_TOKEN?.trim() && environment.SGL_FRIES_OPENCLAW_AGENT?.trim()),
    provider: "openclaw-fries-adapter",
    agent: environment.SGL_FRIES_OPENCLAW_AGENT?.trim() || null,
    healthUrl: healthUrl || null,
    timeoutMs: boundedInteger(environment.SGL_FRIES_ADAPTER_TIMEOUT_MS, 45_000, 1_000, 120_000),
    maxAttempts: boundedInteger(environment.SGL_FRIES_ADAPTER_MAX_ATTEMPTS, 2, 1, 3)
  };
}

export async function probeFriesAdapterHealth(
  environment: Environment = process.env,
  fetcher: typeof fetch = fetch
): Promise<LlmProviderHealth> {
  const status = friesAdapterConfigurationStatus(environment);
  const checkedAt = new Date().toISOString();
  if (!status.configured || !status.healthUrl || !status.agent) {
    return { configured: false, ok: false, provider: status.provider, model: status.agent || "not-configured", status: "unavailable", latencyMs: null, checkedAt, errorCode: "not_configured" };
  }
  let endpoint: URL;
  try { endpoint = new URL(status.healthUrl); }
  catch { return { configured: true, ok: false, provider: status.provider, model: status.agent, status: "error", latencyMs: null, checkedAt, errorCode: "invalid_health_url" }; }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.hash) {
    return { configured: true, ok: false, provider: status.provider, model: status.agent, status: "error", latencyMs: null, checkedAt, errorCode: "invalid_health_url" };
  }
  const started = Date.now();
  try {
    const response = await fetcher(endpoint, {
      method: "GET", redirect: "error", cache: "no-store",
      headers: { accept: "application/json", authorization: `Bearer ${environment.SGL_FRIES_ADAPTER_TOKEN?.trim()}` },
      signal: AbortSignal.timeout(3_000)
    });
    if (!response.ok) return { configured: true, ok: false, provider: status.provider, model: status.agent, status: "error", latencyMs: Date.now() - started, checkedAt, errorCode: `http_${response.status}` };
    const body = await response.json().catch(() => null) as { status?: unknown; agent?: unknown } | null;
    const ok = body?.status === "ok" && body.agent === status.agent;
    return { configured: true, ok, provider: status.provider, model: status.agent, status: ok ? "ready" : "error", latencyMs: Date.now() - started, checkedAt, ...(ok ? {} : { errorCode: "invalid_health_response" }) };
  } catch {
    return { configured: true, ok: false, provider: status.provider, model: status.agent, status: "error", latencyMs: Date.now() - started, checkedAt, errorCode: "network_error" };
  }
}

class DisabledFriesAgentProvider implements StructuredLlmProvider {
  readonly providerName = "openclaw-fries-adapter";
  readonly modelName = "not-configured";
  async generateObject(): Promise<never> { throw new LlmUnavailableError("Fries OpenClaw Adapter is not configured"); }
  async healthCheck(): Promise<LlmProviderHealth> {
    return { configured: false, ok: false, provider: this.providerName, model: this.modelName, status: "unavailable", latencyMs: null, checkedAt: new Date().toISOString(), errorCode: "not_configured" };
  }
}

type AdapterResponse = { schemaVersion?: unknown; requestId?: unknown; status?: unknown; agent?: unknown; output?: unknown };

export class FriesOpenClawAdapterProvider implements StructuredLlmProvider {
  readonly providerName = "openclaw-fries-adapter";
  readonly modelName: string;
  private readonly fetcher: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly createRequestId: () => string;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;

  constructor(private readonly endpoint: string, private readonly token: string, private readonly agentId: string, options: AdapterOptions = {}) {
    this.modelName = `openclaw/${agentId}`;
    this.fetcher = options.fetcher || fetch;
    this.sleep = options.sleep || delay;
    this.createRequestId = options.requestId || randomUUID;
    this.timeoutMs = options.timeoutMs || 45_000;
    this.maxAttempts = Math.max(1, Math.min(options.maxAttempts || 2, 3));
  }

  async generateObject(request: StructuredGenerationRequest) {
    const requestId = this.createRequestId();
    const payload = { schemaVersion: "sgl.fries.adapter.request.v1", requestId, agent: this.agentId, task: "structured_generation", input: { name: request.name, system: request.system, prompt: request.prompt, schema: request.schema } };
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        const response = await this.fetcher(this.endpoint, {
          method: "POST", redirect: "error",
          headers: { accept: "application/json", authorization: `Bearer ${this.token}`, "content-type": "application/json", "idempotency-key": requestId },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(this.timeoutMs)
        });
        if (!response.ok) throw new LlmProviderRequestError(`Fries Adapter request failed with HTTP ${response.status}`, response.status, retryableStatus(response.status));
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("application/json")) throw new LlmProviderRequestError("Fries Adapter returned a non-JSON response", null, false);
        const text = await response.text();
        if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) throw new LlmProviderRequestError("Fries Adapter response exceeded the size limit", null, false);
        let body: AdapterResponse;
        try { body = JSON.parse(text) as AdapterResponse; }
        catch { throw new LlmProviderRequestError("Fries Adapter returned invalid JSON", null, false); }
        if (body.schemaVersion !== "sgl.fries.adapter.response.v1" || body.requestId !== requestId || body.status !== "completed" || body.agent !== this.agentId || !body.output || typeof body.output !== "object" || Array.isArray(body.output)) {
          throw new LlmProviderRequestError("Fries Adapter response contract is invalid", null, false);
        }
        return body.output;
      } catch (error) {
        if (error instanceof LlmProviderRequestError) {
          lastError = error;
          if (!error.retryable || attempt === this.maxAttempts) throw error;
        } else {
          lastError = new LlmProviderRequestError(error instanceof DOMException && error.name === "TimeoutError" ? "Fries Adapter request timed out" : "Fries Adapter network request failed", null, true);
          if (attempt === this.maxAttempts) throw lastError;
        }
        await this.sleep(200 * 2 ** (attempt - 1));
      }
    }
    throw lastError;
  }
}

export function configuredFriesAgentProvider(environment: Environment = process.env, options: AdapterOptions = {}): StructuredLlmProvider {
  const status = friesAdapterConfigurationStatus(environment);
  const endpoint = environment.SGL_FRIES_ADAPTER_URL?.trim();
  const token = environment.SGL_FRIES_ADAPTER_TOKEN?.trim();
  const agentId = environment.SGL_FRIES_OPENCLAW_AGENT?.trim();
  if (!status.configured || !endpoint || !token || !agentId) return new DisabledFriesAgentProvider();
  let parsed: URL;
  try { parsed = new URL(endpoint); }
  catch { throw new LlmUnavailableError("SGL_FRIES_ADAPTER_URL is invalid"); }
  const allowedProtocols = new Set(["https:", ...(environment.NODE_ENV === "development" ? ["http:"] : [])]);
  if (!allowedProtocols.has(parsed.protocol)) throw new LlmUnavailableError("The Fries Adapter endpoint must use HTTPS");
  if (parsed.username || parsed.password || parsed.hash) throw new LlmUnavailableError("The Fries Adapter endpoint contains unsupported URL credentials or fragments");
  return new FriesOpenClawAdapterProvider(endpoint, token, agentId, { ...options, timeoutMs: options.timeoutMs || status.timeoutMs, maxAttempts: options.maxAttempts || status.maxAttempts });
}
