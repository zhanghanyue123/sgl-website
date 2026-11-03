import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDb, toJson } from "@/lib/admin/db";
import { hashToken } from "@/lib/admin/security";
import { type AgentScope, hasAgentScope, parseBearerToken } from "./policy";

export class AgentAuthError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export type AgentContext = { clientId: string; clientName: string; tokenId: string; scopes: string[] };

export async function requireAgent(request: NextRequest, required: AgentScope): Promise<AgentContext> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) throw new AgentAuthError(401, "A valid agent bearer token is required");
  const db = getDb();
  const rows = await db<{ token_id: string; client_id: string; client_name: string; scopes: string[] }[]>`
    SELECT t.id AS token_id, c.id AS client_id, c.name AS client_name, t.scopes
    FROM agent_tokens t JOIN agent_clients c ON c.id = t.client_id
    WHERE t.token_hash = ${hashToken(token)} AND t.revoked_at IS NULL AND t.expires_at > now()
      AND c.active = true AND c.revoked_at IS NULL LIMIT 1`;
  const row = rows[0];
  if (!row) throw new AgentAuthError(401, "Agent token is expired, revoked or unknown");
  const scopes = Array.isArray(row.scopes) ? row.scopes : [];
  if (!hasAgentScope(scopes, required)) {
    await db`INSERT INTO agent_audit_logs (id, client_id, token_id, method, path, action, request_id, outcome, data)
      VALUES (${randomUUID()}, ${row.client_id}, ${row.token_id}, ${request.method}, ${request.nextUrl.pathname}, 'auth.scope_denied',
        ${request.headers.get("x-request-id")}, 'denied', ${db.json({ requiredScope: required })})`;
    throw new AgentAuthError(403, `Missing agent scope: ${required}`);
  }
  await db`UPDATE agent_tokens SET last_used_at = now() WHERE id = ${row.token_id}`;
  return { clientId: row.client_id, clientName: row.client_name, tokenId: row.token_id, scopes };
}

export async function logAgentAction(request: NextRequest, context: AgentContext, action: string, outcome: "success" | "denied" | "failed", entity?: { type: string; id: string }, data: Record<string, unknown> = {}) {
  const db = getDb();
  await db`INSERT INTO agent_audit_logs (id, client_id, token_id, method, path, action, entity_type, entity_id, request_id, outcome, data)
    VALUES (${randomUUID()}, ${context.clientId}, ${context.tokenId}, ${request.method}, ${request.nextUrl.pathname}, ${action},
      ${entity?.type || null}, ${entity?.id || null}, ${request.headers.get("x-request-id")}, ${outcome}, ${db.json(toJson(data))})`;
}
