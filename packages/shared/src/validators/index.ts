import { z } from "zod";
import {
  SECTORS,
  SUPPORTED_COUNTRIES,
  PROSPECT_STATUSES,
  CLIENT_STATUSES,
  AGENT_JOB_STATUSES,
} from "../constants/index.js";

// ─── Primitives ───────────────────────────────────────────────────────────────

export const EmailSchema = z.string().email("Invalid email address");
export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long");
export const CuidSchema = z.string().cuid();
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Admin Auth ───────────────────────────────────────────────────────────────

export const AdminLoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password required"),
});

export const AdminCreateSchema = z.object({
  email: EmailSchema,
  name: z.string().min(2).max(100),
  password: PasswordSchema,
  role: z.enum(["SUPER_ADMIN", "ADMIN", "OPERATOR"]).default("OPERATOR"),
});

export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;
export type AdminCreateInput = z.infer<typeof AdminCreateSchema>;

// ─── Client Auth ──────────────────────────────────────────────────────────────

export const ClientLoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password required"),
});

export const ClientCreateSchema = z.object({
  companyName: z.string().min(2).max(200),
  contactName: z.string().min(2).max(100),
  email: EmailSchema,
  phone: z.string().optional(),
  password: PasswordSchema,
  country: z.enum(SUPPORTED_COUNTRIES),
  city: z.string().optional(),
  sector: z.enum(SECTORS),
  language: z.string().default("de"),
});

export type ClientLoginInput = z.infer<typeof ClientLoginSchema>;
export type ClientCreateInput = z.infer<typeof ClientCreateSchema>;

// ─── Prospect ────────────────────────────────────────────────────────────────

export const ProspectFilterSchema = z.object({
  ...PaginationSchema.shape,
  country: z.enum(SUPPORTED_COUNTRIES).optional(),
  sector: z.enum(SECTORS).optional(),
  status: z.enum(PROSPECT_STATUSES).optional(),
  minLeadScore: z.coerce.number().int().min(0).max(100).optional(),
  maxLeadScore: z.coerce.number().int().min(0).max(100).optional(),
  hasWebsite: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const ProspectCreateSchema = z.object({
  companyName: z.string().min(2).max(300),
  contactName: z.string().optional(),
  contactEmail: EmailSchema.optional(),
  contactPhone: z.string().optional(),
  website: z.string().url().optional(),
  googleMapsUrl: z.string().url().optional(),
  googleRating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  country: z.enum(SUPPORTED_COUNTRIES),
  city: z.string().optional(),
  region: z.string().optional(),
  sector: z.enum(SECTORS),
  employeeEstimate: z.number().int().min(0).optional(),
  hasWebsite: z.boolean().default(false),
  source: z.enum(["GOOGLE_MAPS", "BRIGHTDATA", "MANUAL", "REFERRAL"]),
});

export const ProspectUpdateSchema = ProspectCreateSchema.partial().extend({
  status: z.enum(PROSPECT_STATUSES).optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
});

export type ProspectFilterInput = z.infer<typeof ProspectFilterSchema>;
export type ProspectCreateInput = z.infer<typeof ProspectCreateSchema>;
export type ProspectUpdateInput = z.infer<typeof ProspectUpdateSchema>;

// ─── Client ───────────────────────────────────────────────────────────────────

export const ClientFilterSchema = z.object({
  ...PaginationSchema.shape,
  status: z.enum(CLIENT_STATUSES).optional(),
  country: z.enum(SUPPORTED_COUNTRIES).optional(),
  sector: z.enum(SECTORS).optional(),
  search: z.string().optional(),
});

export const ClientUpdateSchema = z.object({
  companyName: z.string().min(2).max(200).optional(),
  contactName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
});

export type ClientFilterInput = z.infer<typeof ClientFilterSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;

// ─── Agent Job ────────────────────────────────────────────────────────────────

export const AgentJobCreateSchema = z.object({
  agentType: z.enum(["SCRAPER", "ANALYZER", "BUILDER", "OUTREACH", "CHATBOT", "QA"]),
  input: z.record(z.unknown()),
  prospectId: CuidSchema.optional(),
  clientId: CuidSchema.optional(),
});

export const AgentJobFilterSchema = z.object({
  ...PaginationSchema.shape,
  agentType: z.enum(["SCRAPER", "ANALYZER", "BUILDER", "OUTREACH", "CHATBOT", "QA"]).optional(),
  status: z.enum(AGENT_JOB_STATUSES).optional(),
  prospectId: CuidSchema.optional(),
  clientId: CuidSchema.optional(),
});

export type AgentJobCreateInput = z.infer<typeof AgentJobCreateSchema>;
export type AgentJobFilterInput = z.infer<typeof AgentJobFilterSchema>;

// ─── Scrape Config ────────────────────────────────────────────────────────────

export const ScrapeConfigCreateSchema = z.object({
  name: z.string().min(2).max(100),
  sector: z.enum(SECTORS),
  countries: z.array(z.enum(SUPPORTED_COUNTRIES)).min(1),
  cities: z.array(z.string()).optional(),
  keywords: z.array(z.string()).min(1).max(20),
  excludeKeywords: z.array(z.string()).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxResults: z.number().int().min(1).max(1000).default(100),
  schedule: z.string().optional(),
});

export type ScrapeConfigCreateInput = z.infer<typeof ScrapeConfigCreateSchema>;

// ─── Website ──────────────────────────────────────────────────────────────────

export const WebsiteUpdateRequestSchema = z.object({
  type: z.enum(["content", "design", "seo", "new_page", "bug"]),
  description: z.string().min(10).max(2000),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  attachmentUrls: z.array(z.string().url()).optional(),
});

export type WebsiteUpdateRequestInput = z.infer<typeof WebsiteUpdateRequestSchema>;

// ─── Chatbot ──────────────────────────────────────────────────────────────────

export const ChatbotUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  personality: z
    .object({
      tone: z.enum(["professional", "friendly", "casual", "formal"]),
      language: z.string(),
      greeting: z.string().max(500),
      fallbackMessage: z.string().max(500),
    })
    .optional(),
  widgetConfig: z
    .object({
      position: z.enum(["bottom-right", "bottom-left"]),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      title: z.string().max(50),
      subtitle: z.string().max(100).optional(),
      avatarUrl: z.string().url().optional(),
    })
    .optional(),
});

export const ChatbotMessageSchema = z.object({
  chatbotId: CuidSchema,
  sessionId: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
  metadata: z.record(z.string()).optional(),
});

export type ChatbotUpdateInput = z.infer<typeof ChatbotUpdateSchema>;
export type ChatbotMessageInput = z.infer<typeof ChatbotMessageSchema>;

// ─── Scraper Agent Input ──────────────────────────────────────────────────────

export const ScraperAgentInputSchema = z.object({
  configId: CuidSchema.optional(),
  sector: z.enum(SECTORS),
  countries: z.array(z.enum(SUPPORTED_COUNTRIES)).min(1),
  cities: z.array(z.string()).optional(),
  keywords: z.array(z.string()).min(1),
  maxResults: z.number().int().min(1).max(500).default(100),
});

export type ScraperAgentInput = z.infer<typeof ScraperAgentInputSchema>;

// ─── Analyzer Agent Input ─────────────────────────────────────────────────────

export const AnalyzerAgentInputSchema = z.object({
  prospectId: CuidSchema,
  forceReanalyze: z.boolean().default(false),
});

export type AnalyzerAgentInput = z.infer<typeof AnalyzerAgentInputSchema>;

// ─── Builder Agent Input ──────────────────────────────────────────────────────

export const BuilderAgentInputSchema = z.object({
  clientId: CuidSchema,
  websiteId: CuidSchema.optional(),
  templateSlug: z.enum([
    "restaurant",
    "dental",
    "legal",
    "fitness",
    "beauty",
    "hotel",
    "ecommerce",
    "realestate",
    "medical",
    "professional",
  ]),
  customizations: z.record(z.unknown()).optional(),
});

export type BuilderAgentInput = z.infer<typeof BuilderAgentInputSchema>;

// ─── Outreach Agent Input ─────────────────────────────────────────────────────

export const OutreachAgentInputSchema = z.object({
  prospectId: CuidSchema,
  stepNumber: z.number().int().min(1).max(4),
  language: z.string().default("de"),
  senderName: z.string().optional(),
});

export type OutreachAgentInput = z.infer<typeof OutreachAgentInputSchema>;
