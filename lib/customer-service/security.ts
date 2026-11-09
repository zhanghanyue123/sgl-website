import { createHash } from "node:crypto";
import { safePublicOrigin } from "@/lib/admin/security";
import { decodeUtf8Body, readBoundedRequestBody, RequestBodyError } from "@/lib/http/read-bounded-body";

const injectionPatterns = [
  /ignore (all|any|the|previous|prior) instructions/i,
  /reveal (the )?(system|developer|hidden) prompt/i,
  /show (me )?(api|access|secret|admin) (key|token|credential)/i,
  /execute (sql|shell|code|command)/i,
  /internal (agent|retail|employee|sales) (api|data|record)/i
];

export function assertPublicMutation(request: Request) {
  if (!safePublicOrigin(request)) throw Object.assign(new Error("Invalid request origin"), { status: 403 });
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("application/json")) throw Object.assign(new Error("JSON content type required"), { status: 415 });
}

export function sanitizeCustomerMessage(value: unknown) {
  if (typeof value !== "string") throw Object.assign(new Error("message is required"), { status: 400 });
  const message = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();
  if (!message || message.length > 2000) throw Object.assign(new Error("message must be between 1 and 2000 characters"), { status: 400 });
  return { message, suspicious: injectionPatterns.some((pattern) => pattern.test(message)) };
}

export async function readPublicJson(request: Request, maxBytes = 16_384) {
  const text = decodeUtf8Body(await readBoundedRequestBody(request, maxBytes));
  if (!text) throw new RequestBodyError(400, "Request body is required");
  try { return JSON.parse(text) as unknown; }
  catch { throw new RequestBodyError(400, "Request body must be valid JSON"); }
}

const sensitivePatterns: Array<[RegExp, string]> = [
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email redacted]"],
  [/(?:\+?\d[\d\s().-]{7,}\d)/g, "[phone redacted]"],
  [/(?:\d[ -]*?){13,19}/g, "[payment number redacted]"],
  [/\b(?:account|acct|iban|账号|账户|계좌|conto)\s*[:#：]?\s*[A-Z0-9-]{4,}\b/gi, "[account redacted]"],
];

export function redactSupportTextForLlm(value: string) {
  let text = value;
  let redacted = false;
  for (const [pattern, replacement] of sensitivePatterns) {
    text = text.replace(pattern, () => { redacted = true; return replacement; });
  }
  return { text, redacted };
}

export function hashConversationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
function consumeMemoryRateLimit(key:string,limit:number,windowMs:number){
  const now = Date.now(); const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (current.count >= limit) return false;
  current.count += 1; return true;
}

export async function consumePublicRateLimit(key:string,limit=20,windowMs=60_000,environment:Readonly<Record<string,string|undefined>>=process.env,fetcher:typeof fetch=fetch){
  const baseUrl=(environment.UPSTASH_REDIS_REST_URL||environment.KV_REST_API_URL)?.trim(),token=(environment.UPSTASH_REDIS_REST_TOKEN||environment.KV_REST_API_TOKEN)?.trim();
  if(baseUrl&&token){try{const response=await fetcher(`${baseUrl.replace(/\/$/,"")}/pipeline`,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify([["INCR",key],["PEXPIRE",key,String(windowMs),"NX"]]),signal:AbortSignal.timeout(3_000)});if(!response.ok)throw new Error("rate_limit_http_error");const body=await response.json() as Array<{result?:number|string}>;const count=Number(body[0]?.result);if(!Number.isFinite(count))throw new Error("rate_limit_invalid_response");return count<=limit}catch{if(environment.NODE_ENV==="production")throw Object.assign(new Error("Rate limiting is temporarily unavailable"),{status:503})}}
  if(environment.NODE_ENV==="production")throw Object.assign(new Error("Shared rate limiting is not configured"),{status:503});
  return consumeMemoryRateLimit(key,limit,windowMs);
}

export function rateLimitKey(request: Request, scope: string) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return `${scope}:${createHash("sha256").update(address).digest("hex")}`;
}

export function validateOptionalContact(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw Object.assign(new Error("contact is invalid"), { status: 400 });
  const email = value.trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error("email is invalid"), { status: 400 });
  return email;
}
