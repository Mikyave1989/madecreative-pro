import { z } from "zod";

export const AnalyzerInputSchema = z.object({
  prospectId: z.string().cuid(),
  forceReanalyze: z.boolean().default(false),
});

// ─── Website Analysis ────────────────────────────────────────────────────────

export const WebsitePerformanceSchema = z.object({
  lcp: z.number().nullable(),
  fcp: z.number().nullable(),
  tti: z.number().nullable(),
});

export const WebsiteSEOSchema = z.object({
  hasTitle: z.boolean(),
  hasDescription: z.boolean(),
  hasH1: z.boolean(),
  hasSitemap: z.boolean(),
  titleLength: z.number().nullable(),
  descriptionLength: z.number().nullable(),
});

export const WebsiteMobileSchema = z.object({
  hasViewportMeta: z.boolean(),
  hasResponsiveCSS: z.boolean(),
});

export const WebsiteAnalysisSchema = z.object({
  reachable: z.boolean(),
  url: z.string().optional(),
  score: z.number().min(0).max(100),
  hasSSL: z.boolean(),
  performance: WebsitePerformanceSchema,
  seo: WebsiteSEOSchema,
  mobile: WebsiteMobileSchema,
  hasContactForm: z.boolean(),
  hasCTA: z.boolean(),
  imageCount: z.number(),
  textQualityScore: z.number().min(0).max(100),
  breakdown: z.record(z.string(), z.number()),
});

// ─── Tech Detection ──────────────────────────────────────────────────────────

export const WebsiteTechSchema = z.object({
  cms: z.enum(["wordpress", "wix", "squarespace", "jimdo", "shopify", "webflow", "custom", "unknown"]),
  hasSSL: z.boolean(),
  hasAnalytics: z.boolean(),
  analyticsType: z.string().nullable(),
  copyrightYear: z.number().nullable(),
  estimatedAge: z.number().nullable(),
  siteLanguage: z.string().nullable(),
  metaGenerator: z.string().nullable(),
});

// ─── Social Analysis ─────────────────────────────────────────────────────────

export const SocialAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  hasFacebook: z.boolean(),
  facebookUrl: z.string().nullable(),
  hasInstagram: z.boolean(),
  instagramUrl: z.string().nullable(),
  hasGoogleMyBusiness: z.boolean(),
  gmbComplete: z.boolean(),
  breakdown: z.record(z.string(), z.number()),
});

// ─── Lead Scoring ────────────────────────────────────────────────────────────

export const SuggestedServiceEnum = z.enum([
  "website_rebuild",
  "chatbot",
  "lead_gen",
  "social_management",
  "seo_optimization",
]);

export const LeadScoreResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  painPoints: z.array(z.string()),
  suggestedServices: z.array(SuggestedServiceEnum),
  summary: z.string().max(2000),
});

// ─── Legacy pain point / service schemas (kept for DB compat) ────────────────

export const PainPointSchema = z.object({
  category: z.string(),
  description: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const SuggestedServiceSchema = z.object({
  serviceType: z.string(),
  priority: z.number().int().min(1).max(10),
  rationale: z.string(),
  estimatedValue: z.number().min(0),
});

// ─── Full analyzer output ─────────────────────────────────────────────────────

export const AnalyzerOutputSchema = z.object({
  leadScore: z.number().int().min(0).max(100),
  websiteQuality: z.number().int().min(0).max(100).optional(),
  socialPresence: z.number().int().min(0).max(100).optional(),
  painPoints: z.array(PainPointSchema),
  suggestedServices: z.array(SuggestedServiceSchema),
  aiAnalysis: z.string(),
  estimatedMonthlyValue: z.number().optional(),
});

// ─── Exported types ───────────────────────────────────────────────────────────

export type AnalyzerInput = z.infer<typeof AnalyzerInputSchema>;
export type AnalyzerOutput = z.infer<typeof AnalyzerOutputSchema>;
export type PainPoint = z.infer<typeof PainPointSchema>;
export type SuggestedService = z.infer<typeof SuggestedServiceSchema>;
export type WebsiteAnalysis = z.infer<typeof WebsiteAnalysisSchema>;
export type WebsiteTech = z.infer<typeof WebsiteTechSchema>;
export type SocialAnalysis = z.infer<typeof SocialAnalysisSchema>;
export type LeadScoreResult = z.infer<typeof LeadScoreResultSchema>;
export type SuggestedServiceType = z.infer<typeof SuggestedServiceEnum>;
