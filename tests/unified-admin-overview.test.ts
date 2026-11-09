import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { buildSmallBagMetrics, parseSmallBagSkus } from "../lib/admin/unified-overview";

test("Small Bags target is separate from actual inventory", () => {
  const result = buildSmallBagMetrics({ available: 1875, configured: true, asOf: "2026-11-08T00:00:00.000Z" });
  assert.equal(result.target.value, 2500);
  assert.equal(result.actual.value, 1875);
  assert.equal(result.progress.value, 25);
  assert.match(result.target.definition, /not an inventory count/i);
});

test("Small Bags actual inventory stays unavailable without an explicit SKU mapping", () => {
  const result = buildSmallBagMetrics({ available: null, configured: false, asOf: "2026-11-08T00:00:00.000Z" });
  assert.equal(result.target.value, 2500);
  assert.equal(result.actual.value, null);
  assert.equal(result.actual.status, "not_connected");
  assert.equal(result.progress.value, null);
  assert.equal(result.actual.errorCode, "small_bag_sku_mapping_missing");
});

test("Small Bags SKU configuration is normalized and deduplicated", () => {
  assert.deepEqual(parseSmallBagSkus(" SGL-BAG-1,sgl-bag-1, SGL-BAG-2 ,,"), ["sgl-bag-1", "sgl-bag-2"]);
});

test("Unified Overview BFF is read-only, session protected and uncached", async () => {
  const route = await readFile(new URL("../app/api/admin/unified/overview/route.ts", import.meta.url), "utf8");
  assert.match(route, /requireAdmin\(request, "dashboard:read"\)/);
  assert.match(route, /cache-control.*private, no-store/i);
  assert.doesNotMatch(route, /export async function (POST|PATCH|PUT|DELETE)/);
});

test("Unified Overview external adapters remain server-side", async () => {
  const source = await readFile(new URL("../lib/admin/unified-overview.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /NEXT_PUBLIC_/);
  assert.match(source, /sgl\.admin\.overview\.v1/);
  assert.match(source, /AbortSignal\.timeout\(3000\)/);
});
