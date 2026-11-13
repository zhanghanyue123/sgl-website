import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_COOKIE, customerCookieOptions, getCustomerSession, loginCustomer, revokeCustomerSession } from "@/lib/customer-auth/auth";
import { customerAuthError } from "@/lib/customer-auth/http";
import { readCustomerJson, requireCustomerOrigin } from "@/lib/customer-auth/security";

export async function GET(request: NextRequest) {
  const session = await getCustomerSession(request.cookies.get(CUSTOMER_COOKIE)?.value);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ authenticated: true, customer: { id: session.customerId, email: session.email, name: session.displayName } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await readCustomerJson(request);
    const result = await loginCustomer(String(body.email || ""), String(body.password || ""), request);
    const response = NextResponse.json({ authenticated: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(CUSTOMER_COOKIE, result.token, customerCookieOptions(result.expiresAt));
    return response;
  } catch (error) { return customerAuthError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    requireCustomerOrigin(request);
    await revokeCustomerSession(request.cookies.get(CUSTOMER_COOKIE)?.value);
    const response = NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(CUSTOMER_COOKIE, "", { ...customerCookieOptions(new Date(0)), maxAge: 0 });
    return response;
  } catch (error) { return customerAuthError(error); }
}
