import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerEmail } from "@/lib/customer-auth/auth";
import { customerAuthError } from "@/lib/customer-auth/http";
import { readCustomerJson } from "@/lib/customer-auth/security";

export async function POST(request: NextRequest) {
  try {
    const body = await readCustomerJson(request);
    await verifyCustomerEmail(String(body.token || ""), request);
    return NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return customerAuthError(error); }
}
