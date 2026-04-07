import { z } from "zod";

export const ScraperInputSchema = z.object({
  configId: z.string().optional(),
  sector: z.string(),
  countries: z.array(z.string()).min(1),
  cities: z.array(z.string()).optional(),
  keywords: z.array(z.string()).min(1),
  maxResults: z.number().int().min(1).max(500).default(100),
});

export const ScrapedBusinessSchema = z.object({
  companyName: z.string(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  website: z.string().url().optional(),
  googleMapsUrl: z.string().url().optional(),
  googleRating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  country: z.string(),
  city: z.string().optional(),
  region: z.string().optional(),
  sector: z.string(),
  hasWebsite: z.boolean().default(false),
  employeeEstimate: z.number().int().optional(),
});

export const ScraperOutputSchema = z.object({
  businesses: z.array(ScrapedBusinessSchema),
  totalFound: z.number().int(),
  newProspects: z.number().int(),
  duplicatesSkipped: z.number().int(),
  configId: z.string().optional(),
});

export type ScraperInput = z.infer<typeof ScraperInputSchema>;
export type ScrapedBusiness = z.infer<typeof ScrapedBusinessSchema>;
export type ScraperOutput = z.infer<typeof ScraperOutputSchema>;
