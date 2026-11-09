import { configuredLlmProvider } from "@/lib/ai/provider";
import { readApprovedPublicKnowledge, selectRelevantKnowledge } from "./knowledge";
import { appendCustomerMessageForHuman, createConversation, createTicket, appendExchange, ownConversation, readConversationContext } from "./repository";
import { generateGroundedSupportAnswer } from "./provider";
import { sanitizeCustomerMessage, validateOptionalContact } from "./security";
import { supportCategories, supportLocales, type SupportCategory, type SupportLocale, type SupportPriority } from "./types";

const locales = new Set<string>(supportLocales);
export function parsePublicConversationInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("request body is invalid"), { status: 400 });
  const body = value as Record<string, unknown>; const locale: SupportLocale = typeof body.locale === "string" && locales.has(body.locale) ? body.locale as SupportLocale : "en";
  const message = sanitizeCustomerMessage(body.message); const email = validateOptionalContact(body.email);
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 160) : null;
  return { locale, ...message, email, name };
}

export async function startPublicConversation(value: unknown) {
  const input = parsePublicConversationInput(value); const knowledge = await readApprovedPublicKnowledge(input.locale);
  const selected = selectRelevantKnowledge(input.message, knowledge.products, knowledge.policies);
  const provider = configuredLlmProvider(); const answer = await generateGroundedSupportAnswer({ ...input, ...selected }, provider);
  return createConversation({ ...input, answer, provider: provider.providerName });
}

export async function chatInPublicConversation(id: string, token: string, value: unknown) {
  const owned = await ownConversation(id, token); if (!owned || owned.status === "closed") return null;
  const input = parsePublicConversationInput({ ...(value as object), locale: owned.locale });
  if (owned.human_handoff_requested || owned.status === "waiting_staff") {
    const appended = await appendCustomerMessageForHuman(id, input.message);
    return appended ? { aiLocked: true, reason: "human_handoff" as const } : null;
  }
  if (owned.status === "resolved") return null;
  const knowledge = await readApprovedPublicKnowledge(owned.locale);
  const selected = selectRelevantKnowledge(input.message, knowledge.products, knowledge.policies);
  const context = await readConversationContext(id);
  const provider = configuredLlmProvider(); const answer = await generateGroundedSupportAnswer({ ...input, ...selected, context }, provider);
  const appended = await appendExchange({ conversationId: id, message: input.message, answer, provider: provider.providerName });
  if (!appended) {
    const handedOff = await appendCustomerMessageForHuman(id, input.message);
    return handedOff ? { aiLocked: true, reason: "human_handoff" as const } : null;
  }
  return answer;
}

export async function createOwnedTicket(id: string, token: string, value: unknown) {
  const owned = await ownConversation(id, token); if (!owned) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("request body is invalid"), { status: 400 });
  const body = value as Record<string, unknown>; const category = body.category as SupportCategory;
  if (!supportCategories.includes(category)) throw Object.assign(new Error("category is invalid"), { status: 400 });
  const priority: SupportPriority = body.priority === "high" || body.priority === "urgent" || body.priority === "low" ? body.priority : "normal";
  const summary = sanitizeCustomerMessage(body.summary).message; const email = validateOptionalContact(body.email) || owned.customer_email;
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 160) : owned.customer_name;
  const ticketId = await createTicket({ conversationId: id, category, priority, summary, email, name });
  return { ticketId, emailDelivery: "not_attempted" as const };
}

export function orderLookupStatus() {
  return { enabled: false, reason: "Order lookup requires an authoritative order source, configured email OTP delivery, passed OTP security tests and server-side ownership verification." };
}
