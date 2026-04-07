import { z } from "zod";

// ─── Input ────────────────────────────────────────────────────────────────────

export const BuilderInputSchema = z.object({
  /** Either clientId or prospectId must be supplied */
  clientId: z.string().cuid().optional(),
  prospectId: z.string().cuid().optional(),
  websiteId: z.string().cuid().optional(),
  templateSlug: z.string().optional(),
  customizations: z.record(z.unknown()).optional(),
});

export type BuilderInput = z.infer<typeof BuilderInputSchema>;

// ─── Photo ────────────────────────────────────────────────────────────────────

export const PhotoSchema = z.object({
  url: z.string().url(),
  source: z.enum(["google_maps", "facebook", "instagram", "tripadvisor", "pexels", "unsplash", "existing_site"]),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  score: z.number().min(0).max(10).optional(),
  scoreReason: z.string().optional(),
});

export type Photo = z.infer<typeof PhotoSchema>;

// ─── Color Palette ────────────────────────────────────────────────────────────

export const ColorPaletteSchema = z.object({
  primary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
});

export type ColorPalette = z.infer<typeof ColorPaletteSchema>;

// ─── Generated Content ────────────────────────────────────────────────────────

export const GeneratedContentSchema = z.object({
  tagline: z.string(),
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  aboutText: z.string(),
  cta: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
});

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;

// ─── Build Result ─────────────────────────────────────────────────────────────

export const BuildResultSchema = z.object({
  previewUrl: z.string().url().optional(),
  screenshotDesktopUrl: z.string().url().optional(),
  screenshotMobileUrl: z.string().url().optional(),
  outputDir: z.string().optional(),
  deployedAt: z.string().datetime().optional(),
  colors: ColorPaletteSchema,
  content: GeneratedContentSchema,
  photoCount: z.number().int(),
  sector: z.string(),
  slug: z.string(),
  status: z.enum(["PREVIEW_READY", "DEPLOY_FAILED", "BUILD_ONLY"]),
  warning: z.string().optional(),
});

export type BuildResult = z.infer<typeof BuildResultSchema>;

// ─── Legacy schemas for backwards compat ─────────────────────────────────────

export const GeneratedPageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  sections: z.array(
    z.object({
      type: z.string(),
      content: z.record(z.unknown()),
      order: z.number().int(),
    })
  ),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const DesignTokensSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  fontHeading: z.string(),
  fontBody: z.string(),
  borderRadius: z.string(),
  logoUrl: z.string().url().optional(),
});

export const BuilderOutputSchema = z.object({
  websiteId: z.string().optional(),
  pages: z.array(GeneratedPageSchema).optional(),
  designTokens: DesignTokensSchema.optional(),
  seoConfig: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }).optional(),
  status: z.string(),
  previewUrl: z.string().url().optional(),
  buildResult: BuildResultSchema.optional(),
});

export type BuilderOutput = z.infer<typeof BuilderOutputSchema>;
export type GeneratedPage = z.infer<typeof GeneratedPageSchema>;
