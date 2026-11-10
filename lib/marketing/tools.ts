import { marketingPlanJsonSchema } from "./schema";

export const marketingAgentTools = [{
  name: "create_marketing_draft",
  description: "Save an evidence-linked weekly marketing plan for human review. This tool never schedules or publishes content.",
  method: "POST",
  path: "/api/agent/v1/marketing-drafts",
  requiredScope: "marketing:draft",
  inputSchema: {
    type: "object", additionalProperties: false, required: ["title", "payload"],
    properties: { title: { type: "string" }, payload: marketingPlanJsonSchema }
  }
}] as const;
