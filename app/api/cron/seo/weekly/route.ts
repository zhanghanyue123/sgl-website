import { NextRequest, NextResponse } from "next/server";
import { authorizeSeoCron, executeSeoCron, SeoCronError } from "@/lib/seo-growth/cron";

export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const maxDuration = 300;
export async function GET(request: NextRequest) {
  try {
    authorizeSeoCron(request.headers.get("authorization"));
    return NextResponse.json(await executeSeoCron("weekly"));
  } catch (error) {
    const status = error instanceof SeoCronError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "SEO cron failed" : (error as Error).message }, { status });
  }
}
