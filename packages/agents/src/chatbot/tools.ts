import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const chatbotTools: Tool[] = [
  {
    name: "generate_knowledge_base",
    description: "Generate a knowledge base for a business chatbot based on available information.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessInfo: {
          type: "object",
          properties: {
            name: { type: "string" },
            sector: { type: "string" },
            language: { type: "string" },
            city: { type: "string" },
          },
        },
        websiteContent: {
          type: "string",
          description: "Text content scraped from the business website",
        },
      },
      required: ["businessInfo"],
    },
  },
  {
    name: "save_chatbot",
    description: "Save the generated chatbot configuration to the database.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string" },
        chatbotId: { type: "string" },
        name: { type: "string" },
        knowledgeBase: { type: "object" },
        personality: { type: "object" },
        widgetConfig: { type: "object" },
      },
      required: ["clientId", "name", "knowledgeBase"],
    },
  },
];
