import type { AgentContext } from "./auth";
import { AgentValidationError } from "./http";

export type OperationsSnapshotSource = "retail" | "hello";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AgentValidationError("Snapshot must be an object");
  return value as Record<string, unknown>;
}

export function validateOperationsSnapshot(value: unknown, context: AgentContext) {
  const body = object(value);
  const source = body.source;
  if (source !== "retail" && source !== "hello") throw new AgentValidationError("Snapshot source is invalid");
  if (!context.clientName.toLowerCase().includes(source)) throw new AgentValidationError("Snapshot source is outside the agent scope");
  const operations = object(body.operations);
  const overview = object(body.overview);
  if (operations.schemaVersion !== "sgl.admin.agent-operations.v1" || operations.source !== source) throw new AgentValidationError("Agent Operations contract is invalid");
  if (overview.schemaVersion !== "sgl.admin.overview.v1" || overview.source !== source) throw new AgentValidationError("Overview contract is invalid");
  const encoded = JSON.stringify({ source, operations, overview });
  if (Buffer.byteLength(encoded, "utf8") > 64 * 1024) throw new AgentValidationError("Snapshot exceeds 64 KiB");
  return { source: source as OperationsSnapshotSource, operations, overview };
}
