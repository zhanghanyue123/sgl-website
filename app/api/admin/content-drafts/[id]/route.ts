import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { adminErrorResponse } from "@/lib/admin/http";
import { hasPermission } from "@/lib/admin/permissions";
import { getContentDraft, updateContentDraft } from "@/lib/content-drafts/repository";
import { contentDraftStatuses, type ContentDraftModule, type ContentDraftStatus } from "@/lib/content-drafts/types";
import { DraftWorkflowError } from "@/lib/content-drafts/workflow";
import { parseMarketingPlanPayload } from "@/lib/marketing/schema";
import { parseProductContentPayload } from "@/lib/product-content/schema";
import { parseSeoOptimizationProposal } from "@/lib/seo-growth/optimizer";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const module: ContentDraftModule = body?.module;
    if (module !== "product_content" && module !== "marketing" && module !== "seo_growth") return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    const writePermission = module === "product_content" ? "content:write" : module === "marketing" ? "marketing:write" : "seo:write";
    const session = await requireAdmin(request, writePermission, true);
    const { id } = await params; const current = await getContentDraft(id);
    if (!current || current.module !== module) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (!Number.isInteger(body.expectedVersion) || body.expectedVersion < 1) return NextResponse.json({ error: "expectedVersion is required" }, { status: 400 });
    const nextStatus = body.nextStatus === undefined ? undefined : body.nextStatus as ContentDraftStatus;
    if (nextStatus !== undefined && !contentDraftStatuses.includes(nextStatus)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const title = body.title === undefined ? undefined : String(body.title).trim();
    if (title !== undefined && (!title || title.length > 240)) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    let payload: Record<string, unknown> | undefined;
    if (body.payload !== undefined) {
      if (module === "product_content") payload = parseProductContentPayload(body.payload) as unknown as Record<string, unknown>;
      else if (module === "marketing") {
        const productIds = new Set(Array.isArray(current.source_snapshot.productIds) ? current.source_snapshot.productIds.filter((item): item is string => typeof item === "string") : []);
        const facts = Array.isArray(current.source_snapshot.facts) ? current.source_snapshot.facts as { id?: unknown }[] : [];
        const evidenceIds = new Set(facts.flatMap((item) => typeof item.id === "string" ? [item.id] : []));
        payload = parseMarketingPlanPayload(body.payload, productIds, evidenceIds) as unknown as Record<string, unknown>;
      } else {
        const evidence = Array.isArray(current.source_snapshot.evidence) ? current.source_snapshot.evidence : [];
        const productIds = new Set(current.product_id ? [current.product_id] : []);
        payload = parseSeoOptimizationProposal(body.payload, evidence, productIds) as unknown as Record<string, unknown>;
      }
    }
    const canApprove = hasPermission(session.role, module === "product_content" ? "content:approve" : module === "marketing" ? "marketing:approve" : "seo:approve");
    const updated = await updateContentDraft({ id, expectedVersion: body.expectedVersion, title, payload, nextStatus, canApprove }, { type: "admin", adminId: session.userId, requestId: request.headers.get("x-request-id") });
    return updated ? NextResponse.json({ draft: updated }) : NextResponse.json({ error: "Draft changed; refresh and try again" }, { status: 409 });
  } catch (error) {
    if (error instanceof DraftWorkflowError || (error instanceof Error && /invalid|unknown|must|required|disabled/i.test(error.message))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return adminErrorResponse(error);
  }
}
