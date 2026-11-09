import type { CommercialIntent, PublicProductFact } from "./types";

const patterns = {
  order: /\b(order|tracking|payment|refund)\b|订单|訂單|物流|支付|注文|追跡|支払い|주문|결제|배송 조회|ordine|pagamento|tracciamento/i,
  comparison: /\b(compare|comparison|difference|versus|vs\.?|which one)\b|对比|比较|違い|比較|비교|차이|confront|differenz/i,
  purchase: /\b(buy|purchase|checkout|interested|want one|recommend)\b|购买|想买|下单|購入|おすすめ|구매|사고 싶|comprare|acquist/i,
  shippingReturns: /\b(shipping|delivery|return|exchange)\b|配送|发货|退货|换货|返品|配送|배송|반품|spedizion|consegn|reso/i,
  storeActivity: /\b(store|shop|pop[- ]?up|opening hours|in person)\b|门店|店铺|快闪|营业时间|店舗|店頭|ポップアップ|매장|팝업|negozio|punto vendita/i,
  partnership: /\b(wholesale|retail partner|stockist|distributor|reseller|bulk order)\b|批发|零售合作|经销|代理|卸売|取扱店|小売提携|도매|리테일 파트너|유통|ingrosso|rivenditor|distributor/i,
  event: /\b(event|collaboration|collab|sponsor|activation)\b|活动合作|联名|赞助|イベント|コラボ|協業|이벤트|협업|콜라보|evento|collaboraz|sponsor/i,
  discovery: /\b(product|collection|available styles?|recommend)\b|产品|商品|系列|おすすめ|商品|제품|상품|prodot|collezion/i
};

export function classifyCommercialIntent(message: string, products: PublicProductFact[], needsHuman: boolean): CommercialIntent {
  let kind: CommercialIntent["kind"] = "general_support";
  let strength: CommercialIntent["strength"] = "low";
  if (patterns.order.test(message)) { kind = "order_support"; strength = "high"; }
  else if (patterns.partnership.test(message)) { kind = "wholesale_retail_partnership"; strength = "high"; }
  else if (patterns.event.test(message)) { kind = "event_collaboration"; strength = "high"; }
  else if (patterns.storeActivity.test(message)) { kind = "store_activity"; strength = "medium"; }
  else if (patterns.comparison.test(message)) { kind = "product_comparison"; strength = "medium"; }
  else if (patterns.purchase.test(message)) { kind = "purchase_interest"; strength = "high"; }
  else if (patterns.shippingReturns.test(message)) { kind = "shipping_returns"; strength = "medium"; }
  else if (patterns.discovery.test(message) || products.length) { kind = "product_discovery"; strength = products.length ? "medium" : "low"; }
  const requiresHuman = needsHuman || kind === "wholesale_retail_partnership" || kind === "event_collaboration" || kind === "order_support";
  return { kind, strength, productSlugs: [...new Set(products.map((product) => product.slug))].slice(0, 5), needsHuman: requiresHuman };
}
