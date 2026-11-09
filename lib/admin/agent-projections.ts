import { databaseConfigured, getDb } from "./db";

export async function readStoredAgentProjection(source: "retail" | "hello", kind: "operations" | "overview") {
  if (!databaseConfigured()) return null;
  try {
    const rows = await getDb()<Array<{ payload: unknown; created_at: Date }>>`
      SELECT data->${kind} AS payload,created_at
      FROM agent_audit_logs
      WHERE action='agent.operations.snapshot' AND outcome='success' AND data->>'source'=${source}
      ORDER BY created_at DESC LIMIT 1`;
    return rows[0]?.payload && typeof rows[0].payload === "object" ? rows[0].payload : null;
  } catch { return null; }
}
