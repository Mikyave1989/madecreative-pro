import { z } from "zod";

export const BuilderInputSchema = z.object({
  clientId: z.string().cuid(),
  websiteId: z.string().cuid().optional(),
  templateSlug: z.string(),
  customizations: z.record(z.unknown()).optional(),
});

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
  websiteId: z.string(),
  pages: z.array(GeneratedPageSchema),
  designTokens: DesignTokensSchema,
  seoConfig: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  status: z.string(),
});

export type BuilderInput = z.infer<typeof BuilderInputSchema>;
export type BuilderOutput = z.infer<typeof BuilderOutputSchema>;
export type GeneratedPage = z.infer<typeof GeneratedPageSchema>;
