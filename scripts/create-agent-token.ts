import { randomBytes, randomUUID } from "node:crypto";
import { closeDb, getDb } from "../lib/admin/db";
import { normalizeEmail, hashToken } from "../lib/admin/security";
import { agentScopes, isAgentScope } from "../lib/agent/policy";

async function main() {
  const name = (process.env.AGENT_NAME || "").trim();
  const email = normalizeEmail(process.env.ADMIN_EMAIL || "");
  const scopes = (process.env.AGENT_SCOPES || "").split(",").map((scope) => scope.trim()).filter(Boolean);
  const days = Number(process.env.AGENT_TOKEN_DAYS || 30);
  if (name.length < 2 || name.length > 120) throw new Error("Set AGENT_NAME (2-120 characters)");
  if (!email) throw new Error("Set ADMIN_EMAIL to the owner/admin creating this client");
  if (!scopes.length || !scopes.every(isAgentScope)) throw new Error(`AGENT_SCOPES must contain only: ${agentScopes.join(", ")}`);
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error("AGENT_TOKEN_DAYS must be between 1 and 365");
  const db = getDb(); const admins = await db<{ id: string; role: string }[]>`SELECT id, role FROM admin_users WHERE lower(email) = ${email} AND active LIMIT 1`;
  const admin = admins[0]; if (!admin || !["owner", "admin"].includes(admin.role)) throw new Error("ADMIN_EMAIL must identify an active owner or admin");
  const clientId = randomUUID(); const tokenId = randomUUID(); const token = `sgla_${randomBytes(32).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + days * 86400000);
  await db.begin(async (tx) => {
    await tx`INSERT INTO agent_clients (id, name, created_by) VALUES (${clientId}, ${name}, ${admin.id})`;
    await tx`INSERT INTO agent_tokens (id, client_id, token_hash, token_prefix, scopes, expires_at, created_by)
      VALUES (${tokenId}, ${clientId}, ${hashToken(token)}, ${token.slice(0, 12)}, ${tx.json(scopes)}, ${expiresAt}, ${admin.id})`;
    await tx`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, after_data)
      VALUES (${randomUUID()}, ${admin.id}, 'agent_client.create', 'agent_client', ${clientId}, ${tx.json({ name, scopes, expiresAt })})`;
  });
  console.log(`Agent token created for ${name}. Copy it now; it will not be shown again:\n${token}`);
}
main().then(closeDb).catch(async (error) => { console.error(error); await closeDb(); process.exitCode = 1; });
