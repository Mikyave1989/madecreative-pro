import type { PlanConfig, AgentType, ServiceType } from "../types/index.js";

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLANS: Record<string, PlanConfig> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    monthlyAmount: 297,
    setupFee: 497,
    stripePriceId: process.env["STRIPE_STARTER_PRICE_ID"] ?? "",
    limits: {
      maxWebsites: 1,
      maxAutomations: 3,
      maxChatbots: 1,
      maxLeadsPerMonth: 50,
      maxSocialPostsPerMonth: 12,
      aiAgentsEnabled: false,
      prioritySupport: false,
    },
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    monthlyAmount: 597,
    setupFee: 997,
    stripePriceId: process.env["STRIPE_GROWTH_PRICE_ID"] ?? "",
    limits: {
      maxWebsites: 3,
      maxAutomations: 10,
      maxChatbots: 2,
      maxLeadsPerMonth: 200,
      maxSocialPostsPerMonth: 30,
      aiAgentsEnabled: true,
      prioritySupport: false,
    },
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    monthlyAmount: 1297,
    setupFee: 1997,
    stripePriceId: process.env["STRIPE_ENTERPRISE_PRICE_ID"] ?? "",
    limits: {
      maxWebsites: 10,
      maxAutomations: 50,
      maxChatbots: 5,
      maxLeadsPerMonth: 1000,
      maxSocialPostsPerMonth: 90,
      aiAgentsEnabled: true,
      prioritySupport: true,
    },
  },
};

// ─── Agent Types ──────────────────────────────────────────────────────────────

export const AGENT_TYPES: AgentType[] = [
  "SCRAPER",
  "ANALYZER",
  "BUILDER",
  "OUTREACH",
  "CHATBOT",
  "QA",
  "SOCIAL",
];

export const AGENT_QUEUE_NAMES: Record<AgentType, string> = {
  SCRAPER: "scraper-queue",
  ANALYZER: "analyzer-queue",
  BUILDER: "builder-queue",
  OUTREACH: "outreach-queue",
  CHATBOT: "chatbot-queue",
  QA: "qa-queue",
  SOCIAL: "social-queue",
};

// ─── Status Values ────────────────────────────────────────────────────────────

export const PROSPECT_STATUSES = [
  "SCRAPED",
  "ANALYZED",
  "PREVIEW_GENERATED",
  "EMAIL_QUEUED",
  "EMAIL_SENT",
  "REPLIED",
  "CALL_SCHEDULED",
  "CONVERTED",
  "LOST",
  "BLACKLISTED",
] as const;

export const CLIENT_STATUSES = [
  "ONBOARDING",
  "ACTIVE",
  "PAUSED",
  "CHURNED",
  "SUSPENDED",
] as const;

export const AGENT_JOB_STATUSES = [
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export const WEBSITE_STATUSES = [
  "BUILDING",
  "REVIEW",
  "APPROVED",
  "DEPLOYING",
  "LIVE",
  "PAUSED",
] as const;

export const TICKET_TYPES = [
  "general",
  "technical",
  "billing",
  "website",
  "social",
  "chatbot",
] as const;

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

// ─── Service Types ────────────────────────────────────────────────────────────

export const SERVICE_TYPES: ServiceType[] = [
  "WEBSITE",
  "SEO",
  "SOCIAL_MEDIA",
  "CHATBOT",
  "EMAIL_MARKETING",
  "AUTOMATION",
  "REPUTATION_MANAGEMENT",
  "ADS",
  "CONTENT",
];

// ─── Sectors ──────────────────────────────────────────────────────────────────

export const SECTORS = [
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
  "retail",
  "automotive",
  "education",
  "finance",
  "other",
] as const;

export type Sector = (typeof SECTORS)[number];

// ─── Countries ────────────────────────────────────────────────────────────────

export const SUPPORTED_COUNTRIES = [
  "DE",
  "AT",
  "CH",
  "IT",
  "FR",
  "ES",
  "NL",
  "BE",
  "PL",
  "CZ",
  "HU",
  "RO",
  "BG",
  "HR",
  "SK",
  "SI",
] as const;

export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export const COUNTRY_LANGUAGES: Record<SupportedCountry, string> = {
  DE: "de",
  AT: "de",
  CH: "de",
  IT: "it",
  FR: "fr",
  ES: "es",
  NL: "nl",
  BE: "nl",
  PL: "pl",
  CZ: "cs",
  HU: "hu",
  RO: "ro",
  BG: "bg",
  HR: "hr",
  SK: "sk",
  SI: "sl",
};

// ─── Rate Limits ──────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  API_GENERAL: { requests: 100, windowMs: 60_000 },
  AUTH: { requests: 20, windowMs: 60_000 },
  CHATBOT_WIDGET: { requests: 50, windowMs: 60_000 },
  WEBHOOK: { requests: 1000, windowMs: 60_000 },
} as const;

// ─── JWT ──────────────────────────────────────────────────────────────────────

export const JWT_CONFIG = {
  ACCESS_TOKEN_TTL: "15m",
  REFRESH_TOKEN_TTL: "7d",
  ACCESS_TOKEN_TTL_SECONDS: 15 * 60,
  REFRESH_TOKEN_TTL_SECONDS: 7 * 24 * 60 * 60,
} as const;

// ─── Outreach ─────────────────────────────────────────────────────────────────

export const OUTREACH_CONFIG = {
  MAX_STEPS: 4,
  STEP_DELAYS_DAYS: [0, 3, 7, 14],
  DAILY_EMAIL_LIMIT: 200,
  MIN_LEAD_SCORE_FOR_EMAIL: 40,
} as const;

// ─── Lead Score Thresholds ────────────────────────────────────────────────────

export const LEAD_SCORE = {
  MIN: 0,
  MAX: 100,
  HOT: 70,
  WARM: 40,
  COLD: 0,
  WEIGHTS: {
    hasWebsite: -10,
    websiteQuality: 20,
    googleRating: 15,
    reviewCount: 10,
    socialPresence: 15,
    employeeSize: 10,
    sector: 10,
    country: 10,
  },
} as const;

// ─── AI Model Config ──────────────────────────────────────────────────────────

export const AI_MODELS = {
  DEFAULT: "claude-opus-4-5",
  FAST: "claude-haiku-4-5",
  ANALYSIS: "claude-opus-4-5",
  GENERATION: "claude-opus-4-5",
} as const;

export const AI_COST_PER_MILLION_TOKENS = {
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-haiku-4-5": { input: 0.8, output: 4 },
} as const;

// ─── Redis Keys ───────────────────────────────────────────────────────────────

export const REDIS_KEYS = {
  RATE_LIMIT: (ip: string, route: string) => `rl:${route}:${ip}`,
  SESSION: (userId: string) => `session:${userId}`,
  REFRESH_TOKEN: (token: string) => `rt:${token}`,
  AGENT_JOB: (jobId: string) => `job:${jobId}`,
  PLATFORM_METRICS: "platform:metrics",
} as const;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ─── File Upload ──────────────────────────────────────────────────────────────

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/mov", "video/avi"],
} as const;
