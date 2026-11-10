import type { ContentDraftStatus } from "./types";

const transitions: Record<ContentDraftStatus, readonly ContentDraftStatus[]> = {
  draft: ["review"],
  review: ["draft", "approved"],
  approved: ["review", "published"],
  published: []
};

export class DraftWorkflowError extends Error {}

export function publishingEnabled(environment: Readonly<Record<string, string | undefined>> = process.env) {
  return environment.CONTENT_EXTERNAL_PUBLISHING_ENABLED === "true";
}

export function assertDraftTransition(input: {
  from: ContentDraftStatus;
  to: ContentDraftStatus;
  canApprove: boolean;
  externalPublishingEnabled?: boolean;
}) {
  if (!transitions[input.from].includes(input.to)) {
    throw new DraftWorkflowError(`Invalid draft transition: ${input.from} -> ${input.to}`);
  }
  if ((input.to === "approved" || input.to === "published") && !input.canApprove) {
    throw new DraftWorkflowError("Approval permission is required");
  }
  if (input.to === "published" && !input.externalPublishingEnabled) {
    throw new DraftWorkflowError("External publishing is disabled");
  }
}

export function workflowAction(from: ContentDraftStatus, to: ContentDraftStatus) {
  if (from === "draft" && to === "review") return "submitted_for_review" as const;
  if (from === "review" && to === "draft") return "returned_to_draft" as const;
  if (to === "approved") return "approved" as const;
  if (to === "published") return "published" as const;
  if (from === "approved" && to === "review") return "submitted_for_review" as const;
  throw new DraftWorkflowError(`Unsupported draft transition: ${from} -> ${to}`);
}
