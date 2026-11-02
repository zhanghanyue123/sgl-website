export const adminRoles = ["owner", "admin", "editor", "inventory", "fulfillment", "support", "viewer"] as const;
export type AdminRole = (typeof adminRoles)[number];

export const adminPermissions = [
  "dashboard:read",
  "products:read",
  "products:write",
  "products:publish",
  "inventory:read",
  "inventory:adjust",
  "orders:read",
  "shipping:write",
  "customers:read",
  "payments:read",
  "settings:read",
  "settings:write",
  "users:manage",
  "audit:read"
] as const;
export type AdminPermission = (typeof adminPermissions)[number];

const all = new Set<AdminPermission>(adminPermissions);
const readOnly = new Set<AdminPermission>(["dashboard:read", "products:read", "inventory:read", "orders:read", "customers:read", "payments:read", "settings:read"]);

export const rolePermissions: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  owner: all,
  admin: new Set([...all].filter((permission) => permission !== "users:manage")),
  editor: new Set(["dashboard:read", "products:read", "products:write", "products:publish", "inventory:read", "settings:read"]),
  inventory: new Set(["dashboard:read", "products:read", "inventory:read", "inventory:adjust"]),
  fulfillment: new Set(["dashboard:read", "products:read", "inventory:read", "orders:read", "shipping:write", "customers:read"]),
  support: new Set(["dashboard:read", "products:read", "inventory:read", "orders:read", "customers:read", "payments:read"]),
  viewer: readOnly
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && adminRoles.includes(value as AdminRole);
}

export function hasPermission(role: AdminRole, permission: AdminPermission) {
  return rolePermissions[role].has(permission);
}
