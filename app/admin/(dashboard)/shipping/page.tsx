import FutureModule from "@/components/admin/FutureModule"; import { PermissionDenied } from "@/components/admin/AdminPage"; import { currentAdminWithPermission } from "@/lib/admin/current";
export default async function Page() { return await currentAdminWithPermission("shipping:write") ? <FutureModule title="Shipping" phase="Phase 4" /> : <PermissionDenied />; }
