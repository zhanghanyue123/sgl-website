import { productContentJsonSchema } from "./schema";

export const productContentAgentTools = [{
  name: "create_product_content_draft",
  description: "Save an editable product content bundle for human review. This tool never publishes content.",
  method: "POST",
  path: "/api/agent/v1/content-drafts",
  requiredScope: "content:draft",
  inputSchema: {
    type: "object", additionalProperties: false, required: ["productId", "title", "payload"],
    properties: { productId: { type: "string", format: "uuid" }, title: { type: "string" }, payload: productContentJsonSchema }
  }
}] as const;
