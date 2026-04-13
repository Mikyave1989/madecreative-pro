import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const builderTools: Tool[] = [
  {
    name: "fetch_business_photos",
    description:
      "Fetch photos for the business from multiple sources in priority order: Google Maps scraped photos first, then Facebook/Instagram, then Pexels/Unsplash as fallback. Returns an array of photo objects with source metadata.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessName: {
          type: "string",
          description: "The business name to search for",
        },
        sector: {
          type: "string",
          description: "Business sector (restaurant, dental, legal, etc.)",
        },
        city: {
          type: "string",
          description: "City where the business is located",
        },
        country: {
          type: "string",
          description: "Country code",
        },
        existingPhotoUrls: {
          type: "array",
          items: { type: "string" },
          description: "Existing photo URLs already scraped from Google Maps",
        },
        facebookPageUrl: {
          type: "string",
          description: "Facebook page URL if available",
        },
        instagramHandle: {
          type: "string",
          description: "Instagram handle if available",
        },
      },
      required: ["businessName", "sector"],
    },
  },
  {
    name: "analyze_photo_quality",
    description:
      "Use Claude Vision to evaluate each photo for professional website use. Rates 1-10, keeps only photos scoring >= 7. Returns filtered array of high-quality photos (max 10).",
    input_schema: {
      type: "object" as const,
      properties: {
        photos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: { type: "string" },
              source: { type: "string" },
              width: { type: "number" },
              height: { type: "number" },
            },
          },
          description: "Array of photo objects to evaluate",
        },
        sector: {
          type: "string",
          description: "Business sector for context",
        },
      },
      required: ["photos", "sector"],
    },
  },
  {
    name: "extract_dominant_colors",
    description:
      "Extract a color palette from the best quality photo. Returns primary (dark), accent (characteristic), background (light), text colors. Ensures WCAG AA contrast compliance.",
    input_schema: {
      type: "object" as const,
      properties: {
        photoUrl: {
          type: "string",
          description: "URL of the best quality photo to extract colors from",
        },
        sector: {
          type: "string",
          description: "Business sector — used as fallback for sector-default palette",
        },
      },
      required: ["photoUrl", "sector"],
    },
  },
  {
    name: "generate_site_content",
    description:
      "Use Claude to generate all website text content: tagline, hero title, hero subtitle, about text, CTA, SEO meta. Never invents false information — uses 'su richiesta' for missing data. Writes in the prospect's language.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessName: {
          type: "string",
          description: "Business name",
        },
        description: {
          type: "string",
          description: "Business description from Google Maps or other sources",
        },
        sector: {
          type: "string",
          description: "Business sector",
        },
        country: {
          type: "string",
          description: "Country for language detection",
        },
        language: {
          type: "string",
          description: "Language code (it, en, fr, es, de, pt)",
        },
        city: {
          type: "string",
          description: "City for local SEO",
        },
        topReviews: {
          type: "array",
          items: { type: "string" },
          description: "Top 5 review texts for context",
        },
        googleRating: {
          type: "number",
          description: "Google rating 1-5",
        },
      },
      required: ["businessName", "sector", "country", "language"],
    },
  },
  {
    name: "build_preview_site",
    description:
      "Generate the static preview site files and deploy to preview.madecreative.pro/[slug]. Selects the correct sector template, combines all generated data, writes Next.js static files, deploys via Vercel API. Returns the preview URL.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description: "URL-safe slug for the preview (e.g. 'ristorante-mario-roma')",
        },
        sector: {
          type: "string",
          description: "Business sector to select the right template",
        },
        businessData: {
          type: "object",
          description: "Complete business data",
          properties: {
            businessName: { type: "string" },
            tagline: { type: "string" },
            heroTitle: { type: "string" },
            heroSubtitle: { type: "string" },
            aboutText: { type: "string" },
            cta: { type: "string" },
            metaTitle: { type: "string" },
            metaDescription: { type: "string" },
            address: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            googleRating: { type: "number" },
            reviewCount: { type: "number" },
            website: { type: "string", description: "Original website URL to scrape and rebuild" },
          },
        },
        prospectId: {
          type: "string",
          description: "Prospect ID for saving scraped content",
        },
        photos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: { type: "string" },
              source: { type: "string" },
            },
          },
          description: "Array of approved photos",
        },
        colors: {
          type: "object",
          description: "Color palette: primary, accent, background, text",
          properties: {
            primary: { type: "string" },
            accent: { type: "string" },
            background: { type: "string" },
            text: { type: "string" },
          },
        },
      },
      required: ["slug", "sector", "businessData", "photos", "colors"],
    },
  },
  {
    name: "take_screenshot",
    description:
      "Take Playwright screenshots of the deployed preview site at 1440px (desktop) and 390px (mobile) widths. Saves to Cloudflare R2 and returns CDN URLs.",
    input_schema: {
      type: "object" as const,
      properties: {
        previewUrl: {
          type: "string",
          description: "The deployed preview URL to screenshot",
        },
        slug: {
          type: "string",
          description: "Slug used for filename generation",
        },
      },
      required: ["previewUrl", "slug"],
    },
  },
  {
    name: "update_prospect_preview",
    description:
      "Update the Prospect record in the database: set previewSiteUrl, previewGeneratedAt, and status=PREVIEW_GENERATED.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: {
          type: "string",
          description: "The prospect ID to update",
        },
        previewSiteUrl: {
          type: "string",
          description: "The deployed preview URL",
        },
        screenshotDesktopUrl: {
          type: "string",
          description: "Desktop screenshot URL",
        },
        screenshotMobileUrl: {
          type: "string",
          description: "Mobile screenshot URL",
        },
      },
      required: ["prospectId", "previewSiteUrl"],
    },
  },
];
