import { z } from "zod";

// ─── Input schemas ────────────────────────────────────────────────────────────

export const SocialAgentInputSchema = z.object({
  clientId: z.string().cuid(),
  platform: z.enum(["INSTAGRAM", "FACEBOOK"]),
  postType: z.enum(["image", "carousel", "reel", "story"]),
  topic: z.string().optional(),
  scheduledFor: z.string().datetime(),
  /** Whether this is for our own @madecreative.pro channels */
  isOwnChannel: z.boolean().optional().default(false),
  /** Pre-selected content type for own-channel posts */
  contentType: z
    .enum([
      "showcase",
      "stat",
      "tips",
      "behind_scenes",
      "reel",
    ])
    .optional(),
});

// ─── Tool input schemas ───────────────────────────────────────────────────────

export const GenerateShowcasePostSchema = z.object({
  clientId: z.string(),
  metrics: z
    .object({
      visits: z.number().optional(),
      leads: z.number().optional(),
      timeSavedHours: z.number().optional(),
    })
    .optional(),
  language: z.string().default("de"),
});

export const GenerateStatPostSchema = z.object({
  language: z.string().default("de"),
  stats: z.object({
    totalSitesLive: z.number(),
    leadsThisWeek: z.number(),
    timeSavedHoursThisWeek: z.number(),
  }),
});

export const GenerateTipsPostSchema = z.object({
  topic: z.enum(["SEO", "chatbot", "automazioni", "email", "social"]),
  language: z.string().default("de"),
});

export const GenerateClientPostSchema = z.object({
  clientId: z.string(),
  sector: z.string(),
  language: z.string(),
  platform: z.enum(["INSTAGRAM", "FACEBOOK"]),
  photoUrls: z.array(z.string()).optional(),
  brandColors: z
    .object({ primary: z.string().optional(), secondary: z.string().optional() })
    .optional(),
});

export const SchedulePostSchema = z.object({
  platform: z.enum(["INSTAGRAM", "FACEBOOK"]),
  type: z.string(),
  contentType: z.string(),
  caption: z.string(),
  hashtags: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  language: z.string(),
  scheduledFor: z.string().datetime().optional(),
  clientId: z.string().optional(),
  isOwnChannel: z.boolean().optional().default(false),
});

export const PublishToInstagramSchema = z.object({
  clientId: z.string(),
  postId: z.string(),
  mediaUrl: z.string().optional(),
  caption: z.string(),
});

export const PublishToFacebookSchema = z.object({
  clientId: z.string(),
  postId: z.string(),
  message: z.string(),
  photoUrl: z.string().optional(),
});

// ─── Output schemas ───────────────────────────────────────────────────────────

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

// ─── TypeScript types ─────────────────────────────────────────────────────────

export type SocialAgentInput = z.infer<typeof SocialAgentInputSchema>;
export type SocialAgentOutput = z.infer<typeof SocialAgentOutputSchema>;
export type GeneratedPost = z.infer<typeof GeneratedPostSchema>;
export type GenerateShowcasePostInput = z.infer<typeof GenerateShowcasePostSchema>;
export type GenerateStatPostInput = z.infer<typeof GenerateStatPostSchema>;
export type GenerateTipsPostInput = z.infer<typeof GenerateTipsPostSchema>;
export type GenerateClientPostInput = z.infer<typeof GenerateClientPostSchema>;
export type SchedulePostInput = z.infer<typeof SchedulePostSchema>;
export type PublishToInstagramInput = z.infer<typeof PublishToInstagramSchema>;
export type PublishToFacebookInput = z.infer<typeof PublishToFacebookSchema>;
