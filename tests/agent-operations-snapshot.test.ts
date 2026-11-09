import assert from "node:assert/strict";
import test from "node:test";
import { validateOperationsSnapshot } from "../lib/agent/operations-snapshot";

const context = { clientId: "c", clientName: "Retail Sales Agent", tokenId: "t", scopes: ["operations:snapshot:write"], organizationId: "o", storeId: null };
const valid = {
  source: "retail",
  operations: { schemaVersion: "sgl.admin.agent-operations.v1", source: "retail", lastUpdated: "2026-11-09T00:00:00Z" },
  overview: { schemaVersion: "sgl.admin.overview.v1", source: "retail", updatedAt: "2026-11-09T00:00:00Z" }
};

test("accepts a source-scoped bounded snapshot", () => {
  assert.equal(validateOperationsSnapshot(valid, context).source, "retail");
});

test("rejects a snapshot outside the client source", () => {
  assert.throws(() => validateOperationsSnapshot({ ...valid, source: "hello", operations: { ...valid.operations, source: "hello" }, overview: { ...valid.overview, source: "hello" } }, context), /outside/);
});

test("rejects an invalid projection contract", () => {
  assert.throws(() => validateOperationsSnapshot({ ...valid, operations: { source: "retail" } }, context), /contract/);
});
