// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

// ─── Prospect ────────────────────────────────────────────────────────────────

export type ProspectStatus =
  | "SCRAPED"
  | "QUALIFIED"
  | "PREVIEW_READY"
  | "CONTACTED"
  | "FOLLOWED_UP"
  | "REPLIED"
  | "CONVERTED"
  | "LOST"
  | "BLACKLISTED";

export type ProspectSource =
  | "GOOGLE_MAPS"
  | "BRIGHTDATA"
  | "MANUAL"
  | "REFERRAL";

export interface Prospect {
  id: string;
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  googleMapsUrl?: string | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  country: string;
  city?: string | null;
  region?: string | null;
  sector: string;
  employeeEstimate?: number | null;
  hasWebsite: boolean;
  websiteQuality?: number | null;
  socialPresence?: number | null;
  leadScore: number;
  painPoints?: PainPoint[] | null;
  suggestedServices?: SuggestedService[] | null;
  aiAnalysis?: string | null;
  previewSiteUrl?: string | null;
  previewGeneratedAt?: Date | null;
  status: ProspectStatus;
  source: ProspectSource;
  scrapeJobId?: string | null;
  firstContactedAt?: Date | null;
  lastContactedAt?: Date | null;
  repliedAt?: Date | null;
  convertedAt?: Date | null;
  clientId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PainPoint {
  category: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface SuggestedService {
  serviceType: ServiceType;
  priority: number;
  rationale: string;
  estimatedValue: number;
}

// ─── Outreach ─────────────────────────────────────────────────────────────────

export type OutreachEmailStatus =
  | "draft"
  | "queued"
  | "sent"
  | "opened"
  | "clicked"
  | "replied"
  | "bounced";

export interface OutreachEmail {
  id: string;
  prospectId: string;
  stepNumber: number;
  subject: string;
  body: string;
  language: string;
  sentAt?: Date | null;
  openedAt?: Date | null;
  clickedAt?: Date | null;
  repliedAt?: Date | null;
  bouncedAt?: Date | null;
  status: OutreachEmailStatus;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export type ClientStatus = "ACTIVE" | "CHURNED" | "REFUNDED";

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  country: string;
  city?: string | null;
  sector: string;
  language: string;
  status: ClientStatus;
  stripeCustomerId?: string | null;
  stripeSubId?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Client Website ───────────────────────────────────────────────────────────

export interface DesignTokens {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
  logoUrl?: string | null;
}

export interface WebsitePage {
  slug: string;
  title: string;
  sections: PageSection[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface PageSection {
  type: string;
  content: Record<string, unknown>;
  order: number;
}

export interface ClientWebsite {
  id: string;
  clientId: string;
  domain: string;
  designTokens?: DesignTokens | null;
  pages: WebsitePage[];
  deployUrl?: string | null;
  lighthouseScore?: number | null;
  monthlyVisits: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

export interface KnowledgeBase {
  faqs: FAQ[];
  businessInfo: BusinessInfo;
  services: ServiceInfo[];
  customRules?: string[];
}

export interface FAQ {
  question: string;
  answer: string;
  category?: string;
}

export interface BusinessInfo {
  name: string;
  description: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  website?: string;
}

export interface ServiceInfo {
  name: string;
  description: string;
  price?: string;
}

export interface WidgetConfig {
  position: "bottom-right" | "bottom-left";
  primaryColor: string;
  title: string;
  subtitle?: string;
  avatarUrl?: string;
}

export interface ClientChatbot {
  id: string;
  clientId: string;
  knowledgeBase: KnowledgeBase;
  widgetConfig?: WidgetConfig | null;
  isActive: boolean;
  totalConversations: number;
  resolvedRate: number;
  createdAt: Date;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export interface ClientInvoice {
  id: string;
  clientId: string;
  stripeInvoiceId?: string | null;
  amount: number;
  status: InvoiceStatus;
  paidAt?: Date | null;
  createdAt: Date;
}

// ─── Monthly Report ───────────────────────────────────────────────────────────

export interface ReportData {
  metrics: ReportMetrics;
  insights: string[];
  recommendations: string[];
  nextMonthGoals: string[];
}

export interface ReportMetrics {
  websiteVisits: number;
  bounceRate?: number;
  leadsGenerated: number;
  leadsConverted: number;
  conversionRate: number;
  chatbotConversations: number;
  chatbotResolved: number;
}

export interface MonthlyReport {
  id: string;
  clientId: string;
  month: number;
  year: number;
  data: ReportData;
  pdfUrl?: string | null;
  sentAt?: Date | null;
  createdAt: Date;
}

// ─── Agent System ─────────────────────────────────────────────────────────────

export type AgentType =
  | "SCRAPER"
  | "ANALYZER"
  | "BUILDER"
  | "OUTREACH"
  | "CHATBOT"
  | "QA";

export type AgentJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface AgentJob {
  id: string;
  agentType: AgentType;
  status: AgentJobStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | null;
  progress: number;
  error?: string | null;
  apiCost?: number | null;
  prospectId?: string | null;
  clientId?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export interface AgentLog {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AgentToolCall {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  durationMs: number;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  apiCost: number;
  tokensUsed: number;
  durationMs: number;
  toolCalls: AgentToolCall[];
}

// ─── Scrape ───────────────────────────────────────────────────────────────────

export interface ScrapeConfig {
  id: string;
  name: string;
  sector: string;
  countries: string[];
  cities?: string[] | null;
  keywords: string[];
  excludeKeywords?: string[] | null;
  minRating?: number | null;
  maxResults: number;
  isActive: boolean;
  lastRunAt?: Date | null;
  totalFound: number;
  schedule?: string | null;
  createdAt: Date;
}

// ─── Service Types ────────────────────────────────────────────────────────────

export type ServiceType =
  | "WEBSITE"
  | "SEO"
  | "CHATBOT"
  | "AUTOMATION"
  | "REPUTATION_MANAGEMENT";

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: "admin" | "client";
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Stripe Types ─────────────────────────────────────────────────────────────

export interface StripeCheckoutMetadata {
  prospectId?: string;
}
