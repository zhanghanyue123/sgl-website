import { cache } from "react";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, getAdminSession } from "./auth";
import { type AdminPermission, hasPermission } from "./permissions";

export const currentAdminSession = cache(async function currentAdminSession() {
  return getAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
});

export async function currentAdminWithPermission(permission: AdminPermission) {
  const session = await currentAdminSession();
  return session && hasPermission(session.role, permission) ? session : null;
}
