import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminProduct, updateAdminProduct } from "@/lib/admin/catalog";
import { adminErrorResponse } from "@/lib/admin/http";
import { parseAdminProduct } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request, "products:read");
    const { id } = await params;
    const product = await getAdminProduct(id);
    return product ? NextResponse.json({ product }) : NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request, "products:write", true);
    const input = parseAdminProduct(await request.json(), false);
    if (input.status === "published" || input.status === "archived") await requireAdmin(request, "products:publish", true);
    const route = await params;
    const id = await updateAdminProduct(route.id, input, { userId: session.userId, requestId: request.headers.get("x-request-id") });
    if (id) revalidateTag("admin-overview", { expire: 0 });
    return id ? NextResponse.json({ id }) : NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
