import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createCategory, listCategories } from "@/lib/admin/catalog";
import { adminErrorResponse } from "@/lib/admin/http";
import { parseCategory } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, "products:read");
    return NextResponse.json({ categories: await listCategories() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request, "products:write", true);
    const id = await createCategory(parseCategory(await request.json()), { userId: session.userId, requestId: request.headers.get("x-request-id") });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
