import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const outreachTools: Tool[] = [
  {
    name: "get_prospect_details",
    description: "Fetch detailed prospect information from the database for personalization.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: { type: "string" },
      },
      required: ["prospectId"],
    },
  },
  {
    name: "save_outreach_email",
    description: "Save the generated outreach email to the database.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: { type: "string" },
        stepNumber: { type: "number" },
        subject: { type: "string" },
        body: { type: "string" },
        language: { type: "string" },
      },
      required: ["prospectId", "stepNumber", "subject", "body", "language"],
    },
  },
  {
    name: "check_previous_steps",
    description: "Check if previous email steps have been sent to avoid duplicate sends.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: { type: "string" },
        stepNumber: { type: "number" },
      },
      required: ["prospectId", "stepNumber"],
    },
  },
];
