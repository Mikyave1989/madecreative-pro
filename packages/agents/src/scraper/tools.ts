import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

/**
 * Claude Tool Use definitions for the Scraper Agent.
 * Each tool corresponds to a handler in ScraperAgent.handleToolCall().
 */
export const scraperTools: Tool[] = [
  // ─── Tool 1: search_google_maps ───────────────────────────────────────────
  {
    name: "search_google_maps",
    description:
      "Search Google Maps for businesses matching a sector query in a specific city. " +
      "Returns a list of business listing URLs and basic metadata. " +
      "Use this as the first step for each target city.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "The search query combining sector keywords and city, " +
            "e.g. 'Zahnarzt München' or 'Friseursalon Berlin'",
        },
        city: {
          type: "string",
          description: "Target city name, e.g. 'München'",
        },
        country: {
          type: "string",
          description: "ISO-2 country code, e.g. 'DE'",
        },
      },
      required: ["query", "city", "country"],
    },
  },

  // ─── Tool 2: extract_business_details ────────────────────────────────────
  {
    name: "extract_business_details",
    description:
      "Visit a Google Maps business listing URL and extract all available details: " +
      "company name, address, phone, website, rating, review count, category, " +
      "opening hours, and up to 3 photo URLs. " +
      "Applies a random 3-8 second delay to avoid rate limiting.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessUrl: {
          type: "string",
          description: "Full Google Maps URL of the business listing",
        },
      },
      required: ["businessUrl"],
    },
  },

  // ─── Tool 3: check_duplicate ─────────────────────────────────────────────
  {
    name: "check_duplicate",
    description:
      "Check whether a business already exists as a Prospect or Client in the database. " +
      "Performs exact match on phone/email and fuzzy match on name+city (Fuse.js threshold 0.2). " +
      "Returns { isDuplicate: boolean, matchedId?: string, matchReason?: string }.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Business/company name",
        },
        city: {
          type: "string",
          description: "City where the business is located",
        },
        phone: {
          type: "string",
          description: "Normalized phone number (optional)",
        },
        email: {
          type: "string",
          description: "Contact email address (optional)",
        },
      },
      required: ["name"],
    },
  },

  // ─── Tool 4: save_prospect ───────────────────────────────────────────────
  {
    name: "save_prospect",
    description:
      "Save a business as a new Prospect in the database with status SCRAPED. " +
      "Only call this after check_duplicate returned isDuplicate=false.",
    input_schema: {
      type: "object" as const,
      properties: {
        companyName: { type: "string", description: "Business name" },
        contactEmail: {
          type: "string",
          description: "Email address (optional)",
        },
        contactPhone: {
          type: "string",
          description: "Phone number (optional)",
        },
        website: { type: "string", description: "Website URL (optional)" },
        googleMapsUrl: {
          type: "string",
          description: "Full Google Maps URL of this listing",
        },
        googleRating: {
          type: "number",
          description: "Google rating 0-5 (optional)",
        },
        reviewCount: {
          type: "number",
          description: "Number of Google reviews (optional)",
        },
        country: { type: "string", description: "ISO-2 country code" },
        city: { type: "string", description: "City name (optional)" },
        sector: { type: "string", description: "Business sector" },
        hasWebsite: {
          type: "boolean",
          description: "Whether the business has a website",
        },
        address: {
          type: "string",
          description: "Full address string (optional)",
        },
        openingHours: {
          type: "string",
          description: "Opening hours as a string (optional)",
        },
        photoUrls: {
          type: "array",
          items: { type: "string" },
          description: "Up to 3 photo URLs (optional)",
        },
      },
      required: ["companyName", "country", "sector", "hasWebsite", "googleMapsUrl"],
    },
  },

  // ─── Tool 5: rotate_proxy_session ────────────────────────────────────────
  {
    name: "rotate_proxy_session",
    description:
      "Create a new Bright Data proxy session to rotate the outbound IP address. " +
      "Call this when you encounter a CAPTCHA, rate limit (429), or 3+ consecutive errors. " +
      "Returns { success: boolean, newSessionId: string }.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];
