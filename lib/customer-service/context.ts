import type { ConversationContextMessage } from "./types";

export const MAX_CONTEXT_MESSAGES = 8;
export const MAX_CONTEXT_CHARACTERS = 6000;

export function buildBoundedConversationContext(
  messages: ConversationContextMessage[],
  limits: { maxMessages?: number; maxCharacters?: number } = {}
) {
  const maxMessages = Math.min(32, Math.max(0, Math.floor(limits.maxMessages ?? MAX_CONTEXT_MESSAGES)));
  const maxCharacters = Math.min(20_000, Math.max(0, Math.floor(limits.maxCharacters ?? MAX_CONTEXT_CHARACTERS)));
  if (maxMessages === 0 || maxCharacters === 0) return [];
  const relevant = messages
    .filter((message) => message.senderType === "customer" || message.senderType === "ai" || message.senderType === "staff")
    .slice(-maxMessages);
  const selected: ConversationContextMessage[] = [];
  let remaining = maxCharacters;

  for (let index = relevant.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const message = relevant[index];
    const body = message.body.trim();
    if (!body) continue;
    if (body.length > remaining) continue;
    selected.unshift({ ...message, body });
    remaining -= body.length;
  }
  return selected;
}
