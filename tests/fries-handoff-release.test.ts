import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { hasPermission } from "../lib/admin/permissions";

test("human handoff release is explicit, permissioned, audited and durable", async () => {
  assert.equal(hasPermission("support", "support:write"), true);
  assert.equal(hasPermission("viewer", "support:write"), false);
  const route = await readFile(new URL("../app/api/admin/support/[id]/handoff/release/route.ts", import.meta.url), "utf8");
  const repository = await readFile(new URL("../lib/customer-service/repository.ts", import.meta.url), "utf8");
  assert.match(route, /requireAdmin\(request, "support:write", true\)/);
  assert.match(repository, /human_handoff_requested=false,status='waiting_customer'/);
  assert.match(repository, /support\.handoff_released/);
  assert.match(repository, /handoff_released/);
});
