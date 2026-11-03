export const agentScopes = [
  "catalog:read", "inventory:read", "orders:read", "fulfillment:read", "analytics:read", "actions:read",
  "inventory:propose", "shipping:propose", "content:propose", "pricing:propose", "refund:propose"
] as const;

export type AgentScope = (typeof agentScopes)[number];

export const agentActionPolicies = {
  inventory_adjustment: { scope: "inventory:propose", targetType: "product_variant" },
  shipping_dispatch: { scope: "shipping:propose", targetType: "order" },
  product_content_update: { scope: "content:propose", targetType: "product" },
  price_change: { scope: "pricing:propose", targetType: "product_variant" },
  refund: { scope: "refund:propose", targetType: "order" }
} as const satisfies Record<string, { scope: AgentScope; targetType: string }>;

export type AgentActionType = keyof typeof agentActionPolicies;

export function isAgentScope(value: unknown): value is AgentScope {
  return typeof value === "string" && agentScopes.includes(value as AgentScope);
}

export function hasAgentScope(scopes: readonly string[], required: AgentScope) {
  return scopes.includes(required);
}

export function isAgentActionType(value: unknown): value is AgentActionType {
  return typeof value === "string" && value in agentActionPolicies;
}

export function parseBearerToken(header: string | null) {
  const match = header?.match(/^Bearer (sgla_[A-Za-z0-9_-]{40,60})$/);
  return match?.[1] || null;
}
