import { z } from "zod";

export const AnalyzerInputSchema = z.object({
  prospectId: z.string().cuid(),
  forceReanalyze: z.boolean().default(false),
});

export const WebsiteAnalysisSchema = z.object({
  hasWebsite: z.boolean(),
  url: z.string().url().optional(),
  mobileOptimized: z.boolean().optional(),
  loadSpeed: z.enum(["fast", "medium", "slow"]).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  designQuality: z.number().min(0).max(100).optional(),
  hasContactForm: z.boolean().optional(),
  hasSSL: z.boolean().optional(),
  lastUpdated: z.string().optional(),
  cms: z.string().optional(),
});

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

export const AnalyzerOutputSchema = z.object({
  leadScore: z.number().int().min(0).max(100),
  websiteQuality: z.number().int().min(0).max(100).optional(),
  socialPresence: z.number().int().min(0).max(100).optional(),
  painPoints: z.array(PainPointSchema),
  suggestedServices: z.array(SuggestedServiceSchema),
  aiAnalysis: z.string(),
  estimatedMonthlyValue: z.number().optional(),
});

export type AnalyzerInput = z.infer<typeof AnalyzerInputSchema>;
export type AnalyzerOutput = z.infer<typeof AnalyzerOutputSchema>;
export type PainPoint = z.infer<typeof PainPointSchema>;
export type SuggestedService = z.infer<typeof SuggestedServiceSchema>;
