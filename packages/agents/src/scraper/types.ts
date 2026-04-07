import { z } from "zod";

// ─── Input ────────────────────────────────────────────────────────────────────

export const ScraperInputSchema = z.object({
  /** DB id of the ScrapeConfig that triggered this job (optional for ad-hoc runs) */
  scrapeConfigId: z.string().optional(),
  /** Legacy alias kept for backward compatibility with existing orchestrator code */
  configId: z.string().optional(),
  sector: z.string(),
  country: z.string().optional(),
  countries: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  keywords: z.array(z.string()).min(1),
  maxResults: z.number().int().min(1).max(500).default(100),
  minRating: z.number().min(0).max(5).optional(),
});

export type ScraperInput = z.infer<typeof ScraperInputSchema>;

// ─── Business data extracted from Google Maps ─────────────────────────────────

export const BusinessDataSchema = z.object({
  companyName: z.string(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  website: z.string().url().optional(),
  googleMapsUrl: z.string(),
  googleRating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  country: z.string(),
  city: z.string().optional(),
  sector: z.string(),
  hasWebsite: z.boolean(),
  photoUrls: z.array(z.string()).optional(),
  address: z.string().optional(),
  openingHours: z.string().optional(),
  // kept for backward compat
  contactName: z.string().optional(),
  region: z.string().optional(),
  employeeEstimate: z.number().int().optional(),
});

export type BusinessData = z.infer<typeof BusinessDataSchema>;

/** Legacy alias used by existing save_prospects tool handler */
export type ScrapedBusiness = BusinessData;

// ─── Scrape config (mirror of DB model) ──────────────────────────────────────

export interface ScrapeConfigRecord {
  id: string;
  name: string;
  sector: string;
  countries: string[];
  cities: string[] | null;
  keywords: string[];
  maxResults: number;
  minRating: number | null;
  isActive: boolean;
  lastRunAt: Date | null;
  totalFound: number;
  schedule: string | null;
}

// ─── Tool input schemas ───────────────────────────────────────────────────────

export const SearchGoogleMapsInputSchema = z.object({
  query: z.string().describe("Search query, e.g. 'Zahnarzt München'"),
  city: z.string().describe("City name"),
  country: z.string().describe("ISO-2 country code, e.g. DE"),
});

export const ExtractBusinessDetailsInputSchema = z.object({
  businessUrl: z
    .string()
    .url()
    .describe("Full Google Maps URL of the business listing"),
});

export const CheckDuplicateInputSchema = z.object({
  name: z.string(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export const SaveProspectInputSchema = BusinessDataSchema;

export const RotateProxySessionInputSchema = z.object({}).describe(
  "No parameters — creates a new Bright Data proxy session"
);

export type SearchGoogleMapsInput = z.infer<typeof SearchGoogleMapsInputSchema>;
export type ExtractBusinessDetailsInput = z.infer<
  typeof ExtractBusinessDetailsInputSchema
>;
export type CheckDuplicateInput = z.infer<typeof CheckDuplicateInputSchema>;
export type SaveProspectInput = z.infer<typeof SaveProspectInputSchema>;

// ─── Output ───────────────────────────────────────────────────────────────────

export const ScraperOutputSchema = z.object({
  businesses: z.array(BusinessDataSchema),
  totalFound: z.number().int(),
  newProspects: z.number().int(),
  duplicatesSkipped: z.number().int(),
  configId: z.string().optional(),
});

export type ScraperOutput = z.infer<typeof ScraperOutputSchema>;

// ─── Proxy session ────────────────────────────────────────────────────────────

export interface ProxySession {
  sessionId: string;
  proxyUrl: string;
  requestCount: number;
  createdAt: Date;
}
