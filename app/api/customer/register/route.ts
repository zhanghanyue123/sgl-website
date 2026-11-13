import { NextRequest, NextResponse } from "next/server";
import { registerCustomer } from "@/lib/customer-auth/auth";
import { customerAuthError } from "@/lib/customer-auth/http";
import { readCustomerJson } from "@/lib/customer-auth/security";

export async function POST(request: NextRequest) {
  try {
    const body = await readCustomerJson(request);
    await registerCustomer({
      email: String(body.email || ""),
      password: String(body.password || ""),
      displayName: body.name
    }, request);
    return NextResponse.json({ accepted: true }, {
      status: 202,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) { return customerAuthError(error); }
}
