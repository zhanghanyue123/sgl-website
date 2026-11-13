import { NextResponse } from "next/server";
import { CustomerAuthError } from "./types";

export function customerAuthError(error: unknown) {
  if (error instanceof CustomerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error("customer_auth_request_failed", { errorType: error instanceof Error ? error.name : "unknown" });
  return NextResponse.json({ error: "Customer authentication is temporarily unavailable" }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
