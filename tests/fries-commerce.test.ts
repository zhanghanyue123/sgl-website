import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { commerceToolNames, commerceToolSchemas, parseCommerceToolInput, recommendAvailableProducts, stockState } from "../lib/customer-service/commerce-tools";

test("Fries commerce exposes the eight bounded read-only tools", () => {
  assert.deepEqual(commerceToolNames, ["commerce_search_products","commerce_get_product","commerce_get_variant_stock","commerce_get_shipping_options","commerce_get_order_status","commerce_get_tracking","commerce_get_customer_addresses","commerce_recommend_products"]);
  for (const name of commerceToolNames) assert.equal(commerceToolSchemas[name].additionalProperties, false);
  assert.throws(() => parseCommerceToolInput("commerce_search_products", { query:"bag",locale:"en",limit:5 }));
  assert.throws(() => parseCommerceToolInput("commerce_get_variant_stock", { variantId:"bad" }));
  assert.deepEqual(parseCommerceToolInput("commerce_get_shipping_options", { countryCode:"us" }), { countryCode:"US" });
});

test("inventory state keeps absent, zero and stale records distinct", () => {
  assert.equal(stockState({ inventory_recorded:false,available:null }), "not_recorded");
  assert.equal(stockState({ inventory_recorded:true,available:0 }), "out_of_stock");
  assert.equal(stockState({ inventory_recorded:true,available:2,updated_at:new Date(0) }, Date.now()), "stale");
  assert.equal(stockState({ inventory_recorded:true,available:2,updated_at:new Date() }), "available");
});

test("recommendations exclude unavailable and stale products and stay bounded", () => {
  const products=[
    {id:"a",variants:[{stockState:"out_of_stock" as const}]},
    {id:"b",variants:[{stockState:"not_recorded" as const}]},
    {id:"c",variants:[{stockState:"available" as const}]},
    {id:"d",variants:[{stockState:"available" as const}]},
    {id:"e",variants:[{stockState:"available" as const}]},
    {id:"f",variants:[{stockState:"available" as const}]}
  ];
  assert.deepEqual(recommendAvailableProducts(products,3).map(item=>item.id),["c","d","e"]);
});

test("private commerce queries are bound to the verified customer identity", async () => {
  const source=await readFile(new URL("../lib/customer-service/commerce-tools.ts",import.meta.url),"utf8");
  assert.match(source,/requireVerifiedCustomer/);
  assert.match(source,/WHERE customer_id=\$\{session\.customerId\} AND order_number=/);
  assert.match(source,/WHERE o\.customer_id=\$\{session\.customerId\} AND o\.order_number=/);
  assert.match(source,/WHERE customer_id=\$\{session\.customerId\}/);
  assert.doesNotMatch(source,/customer_email\s*=\s*\$\{/);
});

test("commerce activity schema stores no raw query or address body", async () => {
  const sql=await readFile(new URL("../db/migrations/0017_fries_commerce_intelligence.sql",import.meta.url),"utf8");
  assert.match(sql,/fries_commerce_tool_activity/);
  assert.doesNotMatch(sql,/\n\s+(email|address|message|query_text)\s/i);
});
