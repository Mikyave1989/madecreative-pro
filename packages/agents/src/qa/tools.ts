import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const qaTools: Tool[] = [
  {
    name: "check_grammar",
    description: "Check text for grammar and spelling errors in a given language.",
    input_schema: {
      type: "object" as const,
      properties: {
        text: { type: "string" },
        language: { type: "string" },
      },
      required: ["text", "language"],
    },
  },
  {
    name: "check_seo",
    description: "Check SEO quality of website content.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
      },
      required: ["title", "description", "content"],
    },
  },
  {
    name: "save_qa_result",
    description: "Save QA results and update the target status.",
    input_schema: {
      type: "object" as const,
      properties: {
        targetType: { type: "string" },
        targetId: { type: "string" },
        score: { type: "number" },
        passed: { type: "boolean" },
        issues: { type: "array", items: { type: "object" } },
        summary: { type: "string" },
      },
      required: ["targetType", "targetId", "score", "passed", "summary"],
    },
  },
];
