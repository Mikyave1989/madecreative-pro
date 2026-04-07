import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const analyzerTools: Tool[] = [
  {
    name: "analyze_website",
    description:
      "Visit a website using a headless browser and measure quality: LCP, FCP, mobile-friendliness, SEO (title, description, h1), design, content quality, call-to-actions. Returns score 1-100 with detailed breakdown.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The website URL to analyze (must include http:// or https://)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "analyze_social",
    description:
      "Check the business social media presence by inspecting the website HTML for social links (Facebook, Instagram) and Google My Business signals. Returns score 1-100.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessName: {
          type: "string",
          description: "The business name",
        },
        website: {
          type: "string",
          description: "The business website URL if available",
        },
        country: {
          type: "string",
          description: "Country code (e.g. IT, DE, FR)",
        },
      },
      required: ["businessName", "country"],
    },
  },
  {
    name: "check_website_tech",
    description:
      "Detect the technology stack of a website: CMS (WordPress, Wix, Squarespace, Jimdo, Shopify, custom), SSL, analytics (GA/GTM), copyright year, site language.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The website URL to inspect",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "score_lead",
    description:
      "Use Claude to calculate a lead score 1-100 from all gathered data. Returns score, pain points array, suggested services array, and a summary (max 200 words in English).",
    input_schema: {
      type: "object" as const,
      properties: {
        businessName: {
          type: "string",
          description: "Business name",
        },
        sector: {
          type: "string",
          description: "Business sector (e.g. restaurant, dental, hotel)",
        },
        country: {
          type: "string",
          description: "Country code",
        },
        websiteScore: {
          type: "number",
          description: "Website quality score 0-100 (0 if no website)",
        },
        socialScore: {
          type: "number",
          description: "Social presence score 0-100",
        },
        techData: {
          type: "object",
          description: "Tech detection results from check_website_tech",
          properties: {
            cms: { type: "string" },
            hasSSL: { type: "boolean" },
            hasAnalytics: { type: "boolean" },
            copyrightYear: { type: "number" },
            estimatedAge: { type: "number" },
          },
        },
        googleRating: {
          type: "number",
          description: "Google Maps rating (null if not available)",
        },
        reviewCount: {
          type: "number",
          description: "Number of Google reviews (null if not available)",
        },
        hasWebsite: {
          type: "boolean",
          description: "Whether the business has a website",
        },
      },
      required: ["businessName", "sector", "country", "websiteScore", "socialScore", "hasWebsite"],
    },
  },
  {
    name: "update_prospect_status",
    description:
      "Persist the final analysis results to the database and update the prospect status.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: {
          type: "string",
          description: "The prospect CUID",
        },
        status: {
          type: "string",
          enum: ["QUALIFIED", "ANALYZED"],
          description: "QUALIFIED if leadScore > 60, otherwise ANALYZED",
        },
        leadScore: {
          type: "number",
          description: "Final lead score 0-100",
        },
        websiteQuality: {
          type: "number",
          description: "Website quality score 0-100",
        },
        socialPresence: {
          type: "number",
          description: "Social presence score 0-100",
        },
        painPoints: {
          type: "array",
          description: "Array of pain point strings",
          items: { type: "string" },
        },
        suggestedServices: {
          type: "array",
          description: "Array of suggested service identifiers",
          items: {
            type: "string",
            enum: ["website_rebuild", "chatbot", "lead_gen", "social_management", "seo_optimization"],
          },
        },
        summary: {
          type: "string",
          description: "AI-generated analysis summary (max 200 words)",
        },
      },
      required: ["prospectId", "status", "leadScore", "painPoints", "suggestedServices", "summary"],
    },
  },
];
