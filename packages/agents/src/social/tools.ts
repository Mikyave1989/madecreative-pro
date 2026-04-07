import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const socialTools: Tool[] = [
  {
    name: "generate_post_content",
    description: "Generate social media post content including caption and hashtags.",
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
    description: "Save the generated social media post to the database.",
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
      required: ["clientId", "platform", "type", "caption", "language", "scheduledFor"],
    },
  },
  {
    name: "publish_to_instagram",
    description: "Publish a post to Instagram using the Meta Graph API.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string" },
        postId: { type: "string" },
        mediaUrl: { type: "string" },
        caption: { type: "string" },
      },
      required: ["clientId", "postId", "caption"],
    },
  },
];
