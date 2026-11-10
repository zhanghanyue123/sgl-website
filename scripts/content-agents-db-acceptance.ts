import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { closeDb, getDb } from "../lib/admin/db";
import { createContentDraft, getContentDraft, updateContentDraft } from "../lib/content-drafts/repository";
import { assertSafeMigrationTarget } from "./db-migrate";

async function main() {
  const target = assertSafeMigrationTarget();
  if (target.mode !== "local-sandbox") throw new Error("Content agent DB acceptance requires a local sandbox database");
  const db = getDb(); const adminId = randomUUID(); const categoryId = randomUUID(); const productId = randomUUID();
  await db`INSERT INTO admin_users(id,email,display_name,password_hash,password_salt,role)
    VALUES(${adminId},${`content-agent-test-${adminId}@example.invalid`},'TEST ONLY Content Reviewer','test-hash','test-salt','owner')`;
  await db`INSERT INTO product_categories(id,slug,name) VALUES(${categoryId},${`test-${categoryId}`},'TEST ONLY')`;
  await db`INSERT INTO products(id,legacy_key,slug,original_handle,category_id,status,base_price_cents,currency)
    VALUES(${productId},${`test-${productId}`},${`test-${productId}`},${`test-${productId}`},${categoryId},'draft',100,'USD')`;
  const created = await createContentDraft({ module: "product_content", kind: "product_content_bundle", productId, title: "TEST ONLY draft", payload: { test: true }, sourceSnapshot: { productId } }, { type: "admin", adminId, requestId: "test-create" });
  assert.equal(created.status, "draft"); assert.equal((await getContentDraft(created.id))?.version, 1);
  const review = await updateContentDraft({ id: created.id, expectedVersion: 1, nextStatus: "review", canApprove: false }, { type: "admin", adminId, requestId: "test-review" });
  assert.equal(review?.status, "review"); assert.equal(review?.version, 2);
  const approved = await updateContentDraft({ id: created.id, expectedVersion: 2, nextStatus: "approved", canApprove: true }, { type: "admin", adminId, requestId: "test-approve" });
  assert.equal(approved?.status, "approved"); assert.equal(approved?.version, 3);
  await assert.rejects(() => updateContentDraft({ id: created.id, expectedVersion: 3, nextStatus: "published", canApprove: true }, { type: "admin", adminId, requestId: "test-publish" }), /disabled/);
  const events = await db<{ count: number }[]>`SELECT count(*)::int AS count FROM content_draft_events WHERE draft_id=${created.id}`;
  assert.equal(events[0]?.count, 3);
  console.log(JSON.stringify({ event: "content_agents.db_acceptance.passed", database: target.database, draftStatus: approved?.status, events: events[0]?.count }));
}

main().then(closeDb).catch(async (error) => { console.error(error instanceof Error ? error.message : "Content agent DB acceptance failed"); await closeDb(); process.exitCode = 1; });
