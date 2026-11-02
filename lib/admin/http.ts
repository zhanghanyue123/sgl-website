import { NextResponse } from "next/server";
import { AdminAuthError } from "./auth";
import { AdminValidationError } from "./validation";

export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminAuthError || error instanceof AdminValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
    return NextResponse.json({ error: "A unique value is already in use" }, { status: 409 });
  }
  console.error("[admin]", error);
  return NextResponse.json({ error: "Admin operation failed" }, { status: 500 });
}
