import FutureModule from "@/components/admin/FutureModule"; import { PermissionDenied } from "@/components/admin/AdminPage"; import { currentAdminWithPermission } from "@/lib/admin/current";
export default async function Page() { return await currentAdminWithPermission("customers:read") ? <FutureModule title="Customers" phase="Phase 3" /> : <PermissionDenied />; }
