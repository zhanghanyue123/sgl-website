import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDb, toJson } from "@/lib/admin/db";
import { hashToken } from "@/lib/admin/security";

const customerStatuses = ["active", "inactive", "prospect", "archived"] as const;
const taskStatuses = ["open", "in_progress", "completed", "cancelled"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;
const commandTypes = ["station.customer.update", "station.task.update"] as const;

type Customer = { id: string; email: string; name: string; source: string; lastContactAt: string; status: string };
type Task = { id: string; customerId: string; source: string; type: string; title: string; summary: string; priority: string; status: string; createdAt: string; dueAt: string | null; completedAt: string | null };
export type StationOperations = Record<"daily" | "inventory" | "purchaseSuggestions" | "staff" | "schedule" | "products" | "materials" | "purchases" | "camera" | "miniCatalog" | "miniOrders" | "miniSales", unknown>;
export type StationSnapshot = { version: number; generatedAt: string; customers: Customer[]; tasks: Task[]; operations: StationOperations };
export type StationCommandRow = { id: string; event_type: string; aggregate_id: string; status: string; attempts: number; last_error_code: string | null; created_at: Date; delivered_at: Date | null; failed_at: Date | null };
export type StationScope = { organizationId: string; storeId: string };
export class StationAdminInputError extends Error {}

function uuid(value: unknown, field: string) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new StationAdminInputError(`${field} must be a UUID`);
  return value;
}
function text(value: unknown, field: string, max: number, optional = false) {
  if (optional && value == null) return null;
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new StationAdminInputError(`${field} is invalid`);
  return value.trim();
}
function iso(value: unknown, field: string, optional = false) {
  if (optional && value == null) return null;
  const raw = text(value, field, 40); const date = new Date(raw!);
  if (!Number.isFinite(date.valueOf())) throw new StationAdminInputError(`${field} is invalid`);
  return date.toISOString();
}
function oneOf<T extends string>(value: unknown, values: readonly T[], field: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new StationAdminInputError(`${field} is invalid`);
  return value as T;
}

export function parseStationSnapshot(value: unknown): StationSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new StationAdminInputError("snapshot body is required");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["version", "generatedAt", "customers", "tasks", "operations"].includes(key))) throw new StationAdminInputError("snapshot contains an unknown field");
  const version = Number(input.version);
  if (!Number.isSafeInteger(version) || version < 1) throw new StationAdminInputError("version is invalid");
  const generatedAt = iso(input.generatedAt, "generatedAt")!;
  if (!Array.isArray(input.customers) || input.customers.length > 500) throw new StationAdminInputError("customers must contain at most 500 rows");
  if (!Array.isArray(input.tasks) || input.tasks.length > 1000) throw new StationAdminInputError("tasks must contain at most 1000 rows");
  const customers = input.customers.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new StationAdminInputError(`customers[${index}] is invalid`);
    const item = row as Record<string, unknown>;
    return { id: uuid(item.id, "customer.id"), email: text(item.email, "customer.email", 254)!, name: typeof item.name === "string" ? item.name.trim().slice(0, 300) : "", source: text(item.source, "customer.source", 80)!, lastContactAt: iso(item.lastContactAt, "customer.lastContactAt")!, status: oneOf(item.status, customerStatuses, "customer.status") };
  });
  const customerIds = new Set(customers.map((row) => row.id));
  const tasks = input.tasks.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new StationAdminInputError(`tasks[${index}] is invalid`);
    const item = row as Record<string, unknown>; const customerId = uuid(item.customerId, "task.customerId");
    if (!customerIds.has(customerId)) throw new StationAdminInputError("task references a customer outside this snapshot");
    return { id: uuid(item.id, "task.id"), customerId, source: text(item.source, "task.source", 80)!, type: text(item.type, "task.type", 80)!, title: text(item.title, "task.title", 300)!, summary: text(item.summary, "task.summary", 1200)!, priority: oneOf(item.priority, priorities, "task.priority"), status: oneOf(item.status, taskStatuses, "task.status"), createdAt: iso(item.createdAt, "task.createdAt")!, dueAt: iso(item.dueAt, "task.dueAt", true), completedAt: iso(item.completedAt, "task.completedAt", true) };
  });
  const operationKeys = ["daily", "inventory", "purchaseSuggestions", "staff", "schedule", "products", "materials", "purchases", "camera", "miniCatalog", "miniOrders", "miniSales"] as const;
  const rawOperations = input.operations;
  if (!rawOperations || typeof rawOperations !== "object" || Array.isArray(rawOperations)) throw new StationAdminInputError("operations is invalid");
  const operationsInput = rawOperations as Record<string, unknown>;
  if (Object.keys(operationsInput).some((key) => !operationKeys.includes(key as typeof operationKeys[number]))) throw new StationAdminInputError("operations contains an unknown field");
  const operations = Object.fromEntries(operationKeys.map((key) => [key, operationsInput[key] ?? null])) as StationOperations;
  if (JSON.stringify(operations).length > 400_000) throw new StationAdminInputError("operations exceeds the bounded snapshot size");
  return { version, generatedAt, customers, tasks, operations };
}

export async function storeStationSnapshot(scope: StationScope, value: unknown) {
  const snapshot = parseStationSnapshot(value); const db = getDb();
  const serialized = JSON.stringify(snapshot); const digest = createHash("sha256").update(serialized).digest("hex");
  const rows = await db<{ version: string }[]>`INSERT INTO station_admin_snapshots(organization_id,store_id,version,generated_at,payload,payload_digest)
    VALUES(${scope.organizationId},${scope.storeId},${snapshot.version},${snapshot.generatedAt},${db.json(toJson(snapshot))},${digest})
    ON CONFLICT(organization_id,store_id) DO UPDATE SET version=excluded.version,generated_at=excluded.generated_at,
      received_at=now(),payload=excluded.payload,payload_digest=excluded.payload_digest
    WHERE station_admin_snapshots.version < excluded.version RETURNING version`;
  return { accepted: Boolean(rows[0]), version: snapshot.version, digest };
}

export function parseStationCommand(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new StationAdminInputError("command body is required");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["type", "entityId", "idempotencyKey", "changes"].includes(key))) throw new StationAdminInputError("command contains an unknown field");
  const type = oneOf(input.type, commandTypes, "type"); const entityId = uuid(input.entityId, "entityId");
  const idempotencyKey = text(input.idempotencyKey, "idempotencyKey", 120)!;
  if (idempotencyKey.length < 8 || !/^[A-Za-z0-9:._-]+$/.test(idempotencyKey)) throw new StationAdminInputError("idempotencyKey is invalid");
  if (!input.changes || typeof input.changes !== "object" || Array.isArray(input.changes)) throw new StationAdminInputError("changes is invalid");
  const raw = input.changes as Record<string, unknown>; let changes: Record<string, unknown>;
  if (type === "station.customer.update") {
    if (Object.keys(raw).some((key) => !["name", "status"].includes(key))) throw new StationAdminInputError("customer changes contain an unknown field");
    changes = { ...(raw.name === undefined ? {} : { name: text(raw.name, "name", 300, true) ?? "" }), ...(raw.status === undefined ? {} : { status: oneOf(raw.status, customerStatuses, "status") }) };
  } else {
    if (Object.keys(raw).some((key) => !["status", "priority", "dueAt"].includes(key))) throw new StationAdminInputError("task changes contain an unknown field");
    changes = { ...(raw.status === undefined ? {} : { status: oneOf(raw.status, taskStatuses, "status") }), ...(raw.priority === undefined ? {} : { priority: oneOf(raw.priority, priorities, "priority") }), ...(raw.dueAt === undefined ? {} : { dueAt: iso(raw.dueAt, "dueAt", true) }) };
  }
  if (!Object.keys(changes).length) throw new StationAdminInputError("at least one approved change is required");
  return { type, entityId, idempotencyKey, changes };
}

export async function enqueueStationCommand(scope: StationScope, actorUserId: string, value: unknown) {
  const command = parseStationCommand(value); const db = getDb(); const id = randomUUID();
  return db.begin(async (tx) => {
    const rows = await tx<{ id: string }[]>`INSERT INTO integration_outbox
      (id,organization_id,store_id,destination,source,event_type,aggregate_type,aggregate_id,payload,dedupe_key)
      VALUES(${id},${scope.organizationId},${scope.storeId},'station','website',${command.type},${command.type === "station.customer.update" ? "station_customer" : "station_task"},${command.entityId},${tx.json(toJson(command.changes))},${command.idempotencyKey})
      ON CONFLICT(destination,dedupe_key) DO NOTHING RETURNING id`;
    const eventId = rows[0]?.id ?? null;
    if (eventId) await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data)
      VALUES(${randomUUID()},${actorUserId},'station.command.enqueued','integration_outbox',${eventId},${tx.json(toJson({ type: command.type, entityId: command.entityId }))})`;
    return { id: eventId, created: Boolean(eventId) };
  });
}

export async function getStationAdminView(scope: StationScope) {
  try {
    const db = getDb();
    const [snapshots, commands] = await Promise.all([
      db<{ payload: StationSnapshot; generated_at: Date; received_at: Date; version: string }[]>`SELECT payload,generated_at,received_at,version FROM station_admin_snapshots WHERE organization_id=${scope.organizationId} AND store_id=${scope.storeId} LIMIT 1`,
      db<StationCommandRow[]>`SELECT id,event_type,aggregate_id,status,attempts,last_error_code,created_at,delivered_at,failed_at FROM integration_outbox WHERE organization_id=${scope.organizationId} AND store_id=${scope.storeId} AND destination='station' AND source='website' ORDER BY created_at DESC LIMIT 50`
    ]);
    const snapshot = snapshots[0];
    return { connected: Boolean(snapshot), stale: snapshot ? Date.now() - new Date(snapshot.received_at).valueOf() > 15 * 60_000 : false, version: snapshot ? Number(snapshot.version) : null, generatedAt: snapshot?.generated_at?.toISOString() ?? null, receivedAt: snapshot?.received_at?.toISOString() ?? null, data: snapshot?.payload ?? null, commands, error: null };
  } catch {
    return { connected: false, stale: false, version: null, generatedAt: null, receivedAt: null, data: null, commands: [] as StationCommandRow[], error: "station_projection_unavailable" };
  }
}

export async function pullStationCommands(clientId: string, scope: StationScope, limit = 25) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new StationAdminInputError("limit is invalid");
  const db = getDb();
  return db.begin(async (tx) => {
    await tx`UPDATE integration_outbox SET status=CASE WHEN attempts>=max_attempts THEN 'failed' ELSE 'pending' END,
      failed_at=CASE WHEN attempts>=max_attempts THEN now() ELSE failed_at END,next_attempt_at=CASE WHEN attempts>=max_attempts THEN NULL ELSE now()+interval '30 seconds' END,
      locked_at=NULL,lease_expires_at=NULL,leased_by_agent_client_id=NULL,lease_token_hash=NULL,updated_at=now()
      WHERE destination='station' AND source='website' AND organization_id=${scope.organizationId} AND store_id=${scope.storeId} AND status='processing' AND lease_expires_at<=now()`;
    const rows = await tx<any[]>`SELECT id,event_type,aggregate_type,aggregate_id,payload,created_at FROM integration_outbox
      WHERE destination='station' AND source='website' AND organization_id=${scope.organizationId} AND store_id=${scope.storeId}
        AND status='pending' AND (next_attempt_at IS NULL OR next_attempt_at<=now()) ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT ${limit}`;
    const result = [];
    for (const row of rows) {
      const receipt = randomBytes(32).toString("base64url");
      const updated = await tx<{ lease_expires_at: Date }[]>`UPDATE integration_outbox SET status='processing',attempts=attempts+1,locked_at=now(),lease_expires_at=now()+interval '60 seconds',leased_by_agent_client_id=${clientId},lease_token_hash=${hashToken(receipt)},updated_at=now() WHERE id=${row.id} RETURNING lease_expires_at`;
      result.push({ id: row.id, type: row.event_type, entityId: row.aggregate_id, changes: row.payload, createdAt: row.created_at.toISOString(), leaseExpiresAt: updated[0].lease_expires_at.toISOString(), receipt });
    }
    return result;
  });
}

export async function acknowledgeStationCommand(clientId: string, scope: StationScope, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new StationAdminInputError("ack body is required");
  const input = value as Record<string, unknown>; const eventId = uuid(input.eventId, "eventId");
  const receipt = text(input.receipt, "receipt", 120)!; const success = input.success === true;
  const errorCode = input.errorCode == null ? null : text(input.errorCode, "errorCode", 80);
  const db = getDb();
  const rows = await db<{ id: string }[]>`UPDATE integration_outbox SET status=${success ? "delivered" : "failed"},delivered_at=${success ? new Date() : null},acknowledged_at=now(),failed_at=${success ? null : new Date()},last_error_code=${success ? null : errorCode || "station_command_failed"},ack_idempotency_key=${`station:${eventId}`},updated_at=now()
    WHERE id=${eventId} AND destination='station' AND source='website' AND organization_id=${scope.organizationId} AND store_id=${scope.storeId} AND status='processing' AND leased_by_agent_client_id=${clientId} AND lease_token_hash=${hashToken(receipt)} AND lease_expires_at>now() RETURNING id`;
  return rows[0] ? { accepted: true, status: success ? "delivered" : "failed" } : null;
}
