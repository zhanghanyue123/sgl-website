import FutureModule from "@/components/admin/FutureModule"; import { PermissionDenied } from "@/components/admin/AdminPage"; import { currentAdminWithPermission } from "@/lib/admin/current";
export default async function Page() { return await currentAdminWithPermission("orders:read") ? <FutureModule title="Orders" phase="Phase 3" /> : <PermissionDenied />; }
