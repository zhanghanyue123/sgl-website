import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { friesDatabaseHealth } from "../lib/customer-service/health";

test("Fries database health is Not Connected without server database configuration", async () => {
  assert.equal(await friesDatabaseHealth({}), "unconfigured");
});

test("Fries health requires the support, contact and leased outbox migrations", async () => {
  const source = await readFile(new URL("../lib/customer-service/health.ts", import.meta.url), "utf8");
  assert.match(source, /support_conversations/);
  assert.match(source, /support_tickets/);
  assert.match(source, /support_contact_submissions/);
  assert.match(source, /lease_token_hash/);
  assert.match(source, /migration_required/);
});
