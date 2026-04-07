import { z } from "zod";

export const SocialAgentInputSchema = z.object({
  clientId: z.string().cuid(),
  platform: z.enum(["INSTAGRAM", "FACEBOOK"]),
  postType: z.enum(["image", "carousel", "reel", "story"]),
  topic: z.string().optional(),
  scheduledFor: z.string().datetime(),
});

export const GeneratedPostSchema = z.object({
  caption: z.string(),
  hashtags: z.string(),
  visualSuggestion: z.string(),
  scheduleSuggestion: z.string().optional(),
});

export const SocialAgentOutputSchema = z.object({
  postId: z.string(),
  platform: z.string(),
  caption: z.string(),
  hashtags: z.string(),
  status: z.string(),
  scheduledFor: z.string(),
});

export type SocialAgentInput = z.infer<typeof SocialAgentInputSchema>;
export type SocialAgentOutput = z.infer<typeof SocialAgentOutputSchema>;
export type GeneratedPost = z.infer<typeof GeneratedPostSchema>;
