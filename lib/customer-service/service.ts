import { readApprovedPublicKnowledge, selectRelevantKnowledge } from "./knowledge";
import { appendCustomerMessageForHuman, createConversation, createTicket, appendExchange, ownConversation, readConversationContext } from "./repository";
import { generateGroundedSupportAnswer } from "./provider";
import { configuredFriesAgentProvider } from "./fries-agent";
import { sanitizeCustomerMessage, validateOptionalContact } from "./security";
import { supportCategories, supportLocales, type SupportCategory, type SupportLocale, type SupportPriority } from "./types";
import { executeCommerceTool } from "./commerce-tools";
import type { CommerceCustomerSession } from "./customer-session";

const locales = new Set<string>(supportLocales);
export function parsePublicConversationInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("request body is invalid"), { status: 400 });
  const body = value as Record<string, unknown>; const locale: SupportLocale = typeof body.locale === "string" && locales.has(body.locale) ? body.locale as SupportLocale : "en";
  const message = sanitizeCustomerMessage(body.message); const email = validateOptionalContact(body.email);
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 160) : null;
  return { locale, ...message, email, name };
}

async function verifiedCommerceEvidence(message:string,locale:SupportLocale,session:CommerceCustomerSession|null,conversationId?:string) {
  if(/recommend|suggest|looking for|which product|推荐|适合.*商品|おすすめ|추천|consigli|quale prodotto/i.test(message)){
    const result=await executeCommerceTool("commerce_recommend_products",{query:message,locale,limit:4},{session,conversationId});
    return [{id:"commerce:recommendations",tool:"commerce_recommend_products",result}];
  }
  const countryCode=message.match(/\b(?:ship(?:ping)?\s+to|country)\s+([A-Z]{2})\b/i)?.[1]?.toUpperCase();
  if(countryCode){
    const result=await executeCommerceTool("commerce_get_shipping_options",{countryCode},{session,conversationId});
    return [{id:`commerce:shipping:${countryCode}`,tool:"commerce_get_shipping_options",result}];
  }
  if(!session?.emailVerified)return [];
  const orderNumber=message.match(/\bSGL-\d{8}-[A-Z0-9]{8}\b/i)?.[0]?.toUpperCase();
  if(orderNumber&&/track|shipment|carrier|package|物流|追踪|追跡|배송|tracci/i.test(message)){
    const result=await executeCommerceTool("commerce_get_tracking",{orderNumber},{session,conversationId});
    return [{id:`commerce:tracking:${orderNumber}`,tool:"commerce_get_tracking",result}];
  }
  if(orderNumber&&/order|payment|status|订单|支付|注文|支払|주문|결제|ordine|pagamento/i.test(message)){
    const result=await executeCommerceTool("commerce_get_order_status",{orderNumber},{session,conversationId});
    return [{id:`commerce:order:${orderNumber}`,tool:"commerce_get_order_status",result}];
  }
  if(/saved address|shipping address|我的地址|配送地址|保存.*住所|배송지|indirizz/i.test(message)){
    const result=await executeCommerceTool("commerce_get_customer_addresses",{},{session,conversationId});
    return [{id:"commerce:customer-addresses",tool:"commerce_get_customer_addresses",result}];
  }
  void locale;
  return [];
}

export async function startPublicConversation(value: unknown, customerSession:CommerceCustomerSession|null=null) {
  const input = parsePublicConversationInput(value); const knowledge = await readApprovedPublicKnowledge(input.locale);
  const selected = selectRelevantKnowledge(input.message, knowledge.products, knowledge.policies);
  const commerceEvidence=await verifiedCommerceEvidence(input.message,input.locale,customerSession);
  const provider = configuredFriesAgentProvider(); const answer = await generateGroundedSupportAnswer({ ...input, ...selected,commerceEvidence }, provider);
  return createConversation({ ...input, answer, provider: provider.providerName });
}

export async function chatInPublicConversation(id: string, token: string, value: unknown, customerSession:CommerceCustomerSession|null=null) {
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
  const commerceEvidence=await verifiedCommerceEvidence(input.message,input.locale,customerSession,id);
  const provider = configuredFriesAgentProvider(); const answer = await generateGroundedSupportAnswer({ ...input, ...selected, context,commerceEvidence }, provider);
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
