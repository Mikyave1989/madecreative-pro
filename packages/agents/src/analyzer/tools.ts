import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const analyzerTools: Tool[] = [
  {
    name: "analyze_website",
    description:
      "Analyze a website URL and return quality metrics including SEO score, mobile optimization, load speed, and design quality.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The website URL to analyze",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "check_social_presence",
    description:
      "Check a business's social media presence across platforms (Facebook, Instagram, Google My Business).",
    input_schema: {
      type: "object" as const,
      properties: {
        companyName: {
          type: "string",
          description: "The company name to search for",
        },
        country: {
          type: "string",
          description: "The country code (e.g., DE, IT, FR)",
        },
        website: {
          type: "string",
          description: "The company website URL if available",
        },
      },
      required: ["companyName", "country"],
    },
  },
  {
    name: "save_analysis",
    description:
      "Save the analysis results back to the prospect record in the database.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: {
          type: "string",
          description: "The prospect ID to update",
        },
        leadScore: {
          type: "number",
          description: "Lead score from 0-100",
        },
        websiteQuality: {
          type: "number",
          description: "Website quality score from 0-100",
        },
        socialPresence: {
          type: "number",
          description: "Social presence score from 0-100",
        },
        painPoints: {
          type: "array",
          description: "Array of identified pain points",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              description: { type: "string" },
              severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            },
          },
        },
        suggestedServices: {
          type: "array",
          description: "Array of suggested services",
          items: {
            type: "object",
            properties: {
              serviceType: { type: "string" },
              priority: { type: "number" },
              rationale: { type: "string" },
              estimatedValue: { type: "number" },
            },
          },
        },
        aiAnalysis: {
          type: "string",
          description: "Full AI analysis text",
        },
      },
      required: ["prospectId", "leadScore", "painPoints", "suggestedServices", "aiAnalysis"],
    },
  },
];
