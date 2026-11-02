import FutureModule from "@/components/admin/FutureModule"; import { PermissionDenied } from "@/components/admin/AdminPage"; import { currentAdminWithPermission } from "@/lib/admin/current";
export default async function Page() { return await currentAdminWithPermission("payments:read") ? <FutureModule title="Payments" phase="Phase 5" /> : <PermissionDenied />; }
