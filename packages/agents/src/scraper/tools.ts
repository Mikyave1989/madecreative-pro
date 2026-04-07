import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const scraperTools: Tool[] = [
  {
    name: "search_google_maps",
    description:
      "Search Google Maps for businesses matching the given criteria. Returns a list of businesses with their details.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query (e.g., 'restaurants in Berlin')",
        },
        location: {
          type: "string",
          description: "The location to search in (city or country)",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of results to return (max 100)",
        },
      },
      required: ["query", "location"],
    },
  },
  {
    name: "check_website_exists",
    description:
      "Check if a website URL is valid and returns basic info about it.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The website URL to check",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "extract_contact_info",
    description:
      "Extract contact information from a business website (phone, email, address).",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The website URL to extract contact info from",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "save_prospects",
    description:
      "Save a list of scraped businesses to the database as prospects.",
    input_schema: {
      type: "object" as const,
      properties: {
        businesses: {
          type: "array",
          description: "Array of business objects to save",
          items: {
            type: "object",
            properties: {
              companyName: { type: "string" },
              contactEmail: { type: "string" },
              contactPhone: { type: "string" },
              website: { type: "string" },
              googleRating: { type: "number" },
              reviewCount: { type: "number" },
              country: { type: "string" },
              city: { type: "string" },
              sector: { type: "string" },
              hasWebsite: { type: "boolean" },
            },
            required: ["companyName", "country", "sector"],
          },
        },
        source: {
          type: "string",
          description: "Source of the data (GOOGLE_MAPS, BRIGHTDATA, etc.)",
        },
      },
      required: ["businesses", "source"],
    },
  },
];
