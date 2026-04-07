import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const builderTools: Tool[] = [
  {
    name: "fetch_template",
    description: "Fetch a website template structure for a given sector.",
    input_schema: {
      type: "object" as const,
      properties: {
        templateSlug: {
          type: "string",
          description: "The template slug (e.g., restaurant, dental, legal)",
        },
      },
      required: ["templateSlug"],
    },
  },
  {
    name: "generate_page_content",
    description:
      "Generate content for a specific page of the website in the client's language.",
    input_schema: {
      type: "object" as const,
      properties: {
        pageType: {
          type: "string",
          description: "The type of page (home, about, services, contact, faq)",
        },
        businessInfo: {
          type: "object",
          description: "Business information to use in the content",
          properties: {
            name: { type: "string" },
            sector: { type: "string" },
            city: { type: "string" },
            language: { type: "string" },
            description: { type: "string" },
          },
        },
      },
      required: ["pageType", "businessInfo"],
    },
  },
  {
    name: "select_design_tokens",
    description:
      "Select appropriate design tokens (colors, fonts) based on the business sector and client preferences.",
    input_schema: {
      type: "object" as const,
      properties: {
        sector: {
          type: "string",
          description: "The business sector",
        },
        preferences: {
          type: "object",
          description: "Any client color/style preferences",
        },
      },
      required: ["sector"],
    },
  },
  {
    name: "save_website",
    description: "Save the generated website content to the database.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string" },
        websiteId: { type: "string" },
        name: { type: "string" },
        pages: { type: "array", items: { type: "object" } },
        designTokens: { type: "object" },
        seoConfig: { type: "object" },
      },
      required: ["clientId", "name", "pages", "designTokens"],
    },
  },
];
