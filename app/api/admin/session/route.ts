import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, authenticateAdmin, getAdminSession, revokeAdminSession } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, user: { email: session.email, displayName: session.displayName, role: session.role } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const { token, expiresAt } = await authenticateAdmin(email, password, request);
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions(expiresAt));
    return response;
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await revokeAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
    const response = NextResponse.json({ authenticated: false });
    response.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions(new Date(0)), maxAge: 0 });
    return response;
  } catch (error) {
    return adminErrorResponse(error);
  }
}
