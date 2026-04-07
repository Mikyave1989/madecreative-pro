import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const socialTools: Tool[] = [
  // ── Own-channel tools ──────────────────────────────────────────────────────

  {
    name: "generate_showcase_post",
    description:
      "Generate a showcase post for @madecreative.pro featuring a client website with metrics and a device mockup caption. Caption priority: DE > IT > EN.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: {
          type: "string",
          description: "The client ID whose work to showcase",
        },
        metrics: {
          type: "object",
          description: "Optional client metrics to include in the caption",
          properties: {
            visits: { type: "number" },
            leads: { type: "number" },
            timeSavedHours: { type: "number" },
          },
        },
        language: {
          type: "string",
          description: "Language for caption (de/it/en)",
          enum: ["de", "it", "en"],
        },
      },
      required: ["clientId"],
    },
  },

  {
    name: "generate_stat_post",
    description:
      "Generate a statistics post for @madecreative.pro with real platform metrics (total live sites, leads generated this week, hours saved). Creates a 1080x1080 visual.",
    input_schema: {
      type: "object" as const,
      properties: {
        language: {
          type: "string",
          description: "Language for caption",
          enum: ["de", "it", "en"],
        },
        stats: {
          type: "object",
          description: "Real platform stats to display",
          properties: {
            totalSitesLive: { type: "number" },
            leadsThisWeek: { type: "number" },
            timeSavedHoursThisWeek: { type: "number" },
          },
          required: ["totalSitesLive", "leadsThisWeek", "timeSavedHoursThisWeek"],
        },
      },
      required: ["stats"],
    },
  },

  {
    name: "generate_tips_post",
    description:
      "Generate an educational tips carousel (5 slides) for @madecreative.pro on a digital topic (SEO, chatbot, automazioni, email, social). Each slide has a visual HTML template.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "Topic for the tips carousel",
          enum: ["SEO", "chatbot", "automazioni", "email", "social"],
        },
        language: {
          type: "string",
          description: "Language for the carousel",
          enum: ["de", "it", "en"],
        },
      },
      required: ["topic"],
    },
  },

  {
    name: "schedule_our_post",
    description:
      "Save a post for @madecreative.pro to the SocialPost table. Automatically calculates the next available slot based on the content calendar.",
    input_schema: {
      type: "object" as const,
      properties: {
        platform: {
          type: "string",
          enum: ["INSTAGRAM", "FACEBOOK"],
        },
        type: {
          type: "string",
          description: "Post format: image / carousel / reel / story",
        },
        contentType: {
          type: "string",
          description: "Content category: showcase / stat / tips / behind_scenes / reel",
        },
        caption: { type: "string" },
        hashtags: { type: "string" },
        mediaUrls: {
          type: "array",
          items: { type: "string" },
        },
        language: { type: "string" },
        scheduledFor: {
          type: "string",
          description:
            "ISO datetime for scheduling. Leave empty to auto-calculate next slot.",
        },
      },
      required: ["platform", "type", "contentType", "caption", "language"],
    },
  },

  // ── Client post tools ──────────────────────────────────────────────────────

  {
    name: "generate_client_post",
    description:
      "Generate a social media post for a client business. Respects the client's sector, language, and brand colors. Uses real client photos from R2 when available.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string" },
        sector: {
          type: "string",
          description:
            "Client business sector (restaurant, dental, fitness, etc.)",
        },
        language: {
          type: "string",
          description: "Caption language (de/it/en/fr/es etc.)",
        },
        platform: {
          type: "string",
          enum: ["INSTAGRAM", "FACEBOOK"],
        },
        photoUrls: {
          type: "array",
          items: { type: "string" },
          description: "Real client photos from R2 to use in the post",
        },
        brandColors: {
          type: "object",
          properties: {
            primary: { type: "string" },
            secondary: { type: "string" },
          },
        },
      },
      required: ["clientId", "sector", "language", "platform"],
    },
  },

  {
    name: "publish_to_instagram",
    description:
      "Publish a post to Instagram using the Meta Graph API. Requires the client to have a connected IG account.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string" },
        postId: { type: "string" },
        mediaUrl: {
          type: "string",
          description: "Public URL of the image/video to publish",
        },
        caption: { type: "string" },
      },
      required: ["clientId", "postId", "caption"],
    },
  },

  {
    name: "publish_to_facebook",
    description:
      "Publish a post to a Facebook Page using the Meta Graph API. Requires the client to have a connected FB page.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string" },
        postId: { type: "string" },
        message: { type: "string" },
        photoUrl: {
          type: "string",
          description: "Public URL of the photo to post (optional)",
        },
      },
      required: ["clientId", "postId", "message"],
    },
  },

  {
    name: "schedule_client_post",
    description:
      "Save a generated post for a client to the ClientSocialPost table. Status is 'scheduled' if auto-publish is enabled, 'draft' otherwise.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string" },
        platform: {
          type: "string",
          enum: ["INSTAGRAM", "FACEBOOK"],
        },
        type: {
          type: "string",
          description: "Post format: image / carousel / reel / story",
        },
        caption: { type: "string" },
        hashtags: { type: "string" },
        mediaUrls: {
          type: "array",
          items: { type: "string" },
        },
        language: { type: "string" },
        scheduledFor: {
          type: "string",
          description: "ISO datetime. Auto-calculated if not provided.",
        },
      },
      required: ["clientId", "platform", "type", "caption", "language"],
    },
  },

  // ── Legacy ─────────────────────────────────────────────────────────────────

  {
    name: "generate_post_content",
    description:
      "Generate social media post content including caption and hashtags (legacy — prefer generate_client_post).",
    input_schema: {
      type: "object" as const,
      properties: {
        businessName: { type: "string" },
        sector: { type: "string" },
        platform: { type: "string", enum: ["INSTAGRAM", "FACEBOOK"] },
        postType: { type: "string" },
        language: { type: "string" },
        topic: { type: "string" },
      },
      required: ["businessName", "sector", "platform", "language"],
    },
  },

  {
    name: "save_social_post",
    description:
      "Save the generated social media post to the database (legacy — prefer schedule_client_post).",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string" },
        platform: { type: "string" },
        type: { type: "string" },
        caption: { type: "string" },
        hashtags: { type: "string" },
        mediaUrls: { type: "array", items: { type: "string" } },
        language: { type: "string" },
        scheduledFor: { type: "string" },
      },
      required: [
        "clientId",
        "platform",
        "type",
        "caption",
        "language",
        "scheduledFor",
      ],
    },
  },
];
