import type { AgentType, ServiceType } from "../types/index.js";

// ─── Plan ─────────────────────────────────────────────────────────────────────

export const PLAN_PRICE = 9.99; // €9.99 one-time — single plan, no subscription
export const PLAN_PRICE_ID = process.env["STRIPE_PRICE_ID"] ?? "";

export const PLANS = {
  STARTER: { price: 9.99, setup: 0, credits: 100 },
} as const;
export type PlanKey = keyof typeof PLANS;

// ─── Agent Types ──────────────────────────────────────────────────────────────

export const AGENT_TYPES: AgentType[] = [
  "SCRAPER",
  "ANALYZER",
  "BUILDER",
  "OUTREACH",
  "CHATBOT",
  "QA",
];

export const AGENT_QUEUE_NAMES: Record<AgentType, string> = {
  SCRAPER: "scraper-queue",
  ANALYZER: "analyzer-queue",
  BUILDER: "builder-queue",
  OUTREACH: "outreach-queue",
  CHATBOT: "chatbot-queue",
  QA: "qa-queue",
};

// ─── Status Values ────────────────────────────────────────────────────────────

export const PROSPECT_STATUSES = [
  "SCRAPED",
  "QUALIFIED",
  "ANALYZED",
  "PREVIEW_READY",
  "PREVIEW_GENERATED",
  "EMAIL_QUEUED",
  "CONTACTED",
  "EMAIL_SENT",
  "FOLLOWED_UP",
  "REPLIED",
  "CALL_SCHEDULED",
  "CONVERTED",
  "LOST",
  "BLACKLISTED",
] as const;

export const CLIENT_STATUSES = [
  "ACTIVE",
  "AT_RISK",
  "CHURNED",
  "REFUNDED",
] as const;

export const AGENT_JOB_STATUSES = [
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

// ─── Service Types ────────────────────────────────────────────────────────────

export const SERVICE_TYPES: ServiceType[] = [
  "WEBSITE",
  "SEO",
  "CHATBOT",
  "AUTOMATION",
  "REPUTATION_MANAGEMENT",
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
  ACCESS_TOKEN_TTL: "2h",
  REFRESH_TOKEN_TTL: "7d",
  ACCESS_TOKEN_TTL_SECONDS: 2 * 60 * 60,
  REFRESH_TOKEN_TTL_SECONDS: 7 * 24 * 60 * 60,
} as const;

// ─── Outreach ─────────────────────────────────────────────────────────────────

export const OUTREACH_CONFIG = {
  MAX_STEPS: 3,
  STEP_DELAYS_DAYS: [0, 3, 6],
  DAILY_EMAIL_LIMIT: 200,
  MIN_LEAD_SCORE_FOR_EMAIL: 60,
} as const;

// ─── Lead Score Thresholds ────────────────────────────────────────────────────

export const LEAD_SCORE = {
  MIN: 0,
  MAX: 100,
  HOT: 70,
  WARM: 60,
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
  DEFAULT: "claude-sonnet-4-6",
  FAST: "claude-haiku-4-5",
  POWERFUL: "claude-opus-4-6",
  ANALYSIS: "claude-sonnet-4-6",
  GENERATION: "claude-sonnet-4-6",
  EDITOR: "claude-sonnet-4-6",
} as const;

export const AI_COST_PER_MILLION_TOKENS = {
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 0.8, output: 4 },
} as const;

// ─── Redis Keys ───────────────────────────────────────────────────────────────

export const REDIS_KEYS = {
  RATE_LIMIT: (ip: string, route: string) => `rl:${route}:${ip}`,
  SESSION: (userId: string) => `session:${userId}`,
  REFRESH_TOKEN: (token: string) => `rt:${token}`,
  AGENT_JOB: (jobId: string) => `job:${jobId}`,
  CHATBOT_SESSION_MESSAGES: (sessionId: string) => `chatbot:session:${sessionId}:messages`,
  CHATBOT_SESSION_META: (sessionId: string) => `chatbot:session:${sessionId}:meta`,
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
} as const;

// ─── Refund Policy ────────────────────────────────────────────────────────────

export const REFUND_POLICY = {
  DAYS: 14, // Rimborso automatico entro 14 giorni
} as const;
