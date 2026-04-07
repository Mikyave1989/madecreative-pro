// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
  createdAt: Date;
}

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "OPERATOR";

// ─── Prospect ────────────────────────────────────────────────────────────────

export type ProspectStatus =
  | "SCRAPED"
  | "ANALYZED"
  | "PREVIEW_GENERATED"
  | "EMAIL_QUEUED"
  | "EMAIL_SENT"
  | "REPLIED"
  | "CALL_SCHEDULED"
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

export type ClientPlan = "STARTER" | "GROWTH" | "ENTERPRISE";
export type ClientStatus =
  | "ONBOARDING"
  | "ACTIVE"
  | "PAUSED"
  | "CHURNED"
  | "SUSPENDED";

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
  plan: ClientPlan;
  status: ClientStatus;
  stripeCustomerId?: string | null;
  stripeSubId?: string | null;
  setupFeePaid: boolean;
  monthlyAmount: number;
  igAccessToken?: string | null;
  igAccountId?: string | null;
  fbPageId?: string | null;
  fbPageAccessToken?: string | null;
  socialPostingEnabled: boolean;
  socialAutoPublish: boolean;
  totalRevGenerated: number;
  totalLeadsGen: number;
  totalTimeSaved: number;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Client Website ───────────────────────────────────────────────────────────

export type WebsiteStatus =
  | "BUILDING"
  | "REVIEW"
  | "APPROVED"
  | "DEPLOYING"
  | "LIVE"
  | "PAUSED";

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

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface ClientWebsite {
  id: string;
  clientId: string;
  name: string;
  domain?: string | null;
  status: WebsiteStatus;
  designTokens?: DesignTokens | null;
  pages: WebsitePage[];
  seoConfig?: SeoConfig | null;
  deployUrl?: string | null;
  repoUrl?: string | null;
  lighthouseScore?: number | null;
  monthlyVisits: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Client Lead ──────────────────────────────────────────────────────────────

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export interface ClientLead {
  id: string;
  clientId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  message?: string | null;
  status: LeadStatus;
  value?: number | null;
  createdAt: Date;
}

// ─── Automation ───────────────────────────────────────────────────────────────

export type AutomationType =
  | "EMAIL_SEQUENCE"
  | "LEAD_NOTIFICATION"
  | "REVIEW_REQUEST"
  | "APPOINTMENT_REMINDER"
  | "FOLLOW_UP"
  | "CUSTOM";

export interface AutomationTrigger {
  type: string;
  conditions: Record<string, unknown>;
}

export interface AutomationAction {
  type: string;
  config: Record<string, unknown>;
  order: number;
}

export interface ClientAutomation {
  id: string;
  clientId: string;
  name: string;
  description?: string | null;
  type: AutomationType;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  isActive: boolean;
  runCount: number;
  timeSaved: number;
  createdAt: Date;
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

export interface ChatbotPersonality {
  tone: "professional" | "friendly" | "casual" | "formal";
  language: string;
  greeting: string;
  fallbackMessage: string;
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
  name: string;
  knowledgeBase: KnowledgeBase;
  personality?: ChatbotPersonality | null;
  widgetConfig?: WidgetConfig | null;
  isActive: boolean;
  totalConversations: number;
  resolvedRate: number;
  createdAt: Date;
}

// ─── Social ───────────────────────────────────────────────────────────────────

export type SocialPlatform = "INSTAGRAM" | "FACEBOOK";
export type SocialPostStatus =
  | "draft"
  | "scheduled"
  | "approved"
  | "publishing"
  | "published"
  | "failed";
export type SocialPostType = "image" | "carousel" | "reel" | "story";

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  type: SocialPostType;
  contentType: string;
  caption: string;
  hashtags?: string | null;
  mediaUrls: string[];
  language: string;
  igMediaId?: string | null;
  fbPostId?: string | null;
  likes: number;
  comments: number;
  reach: number;
  impressions: number;
  scheduledFor: Date;
  publishedAt?: Date | null;
  status: SocialPostStatus;
  createdAt: Date;
}

export interface ClientSocialPost {
  id: string;
  clientId: string;
  platform: SocialPlatform;
  type: SocialPostType;
  caption: string;
  hashtags?: string | null;
  mediaUrls: string[];
  language: string;
  status: SocialPostStatus;
  scheduledFor: Date;
  approvedAt?: Date | null;
  publishedAt?: Date | null;
  igMediaId?: string | null;
  fbPostId?: string | null;
  likes: number;
  comments: number;
  reach: number;
  isCustom: boolean;
  clientMediaUrls?: string[] | null;
  createdAt: Date;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type InvoiceType = "SETUP_FEE" | "MONTHLY" | "ADDON" | "REFUND";
export type InvoiceStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export interface ClientInvoice {
  id: string;
  clientId: string;
  stripeInvoiceId?: string | null;
  amount: number;
  type: InvoiceType;
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
  revenueAttributed: number;
  timeSavedHours: number;
  socialReach: number;
  socialEngagement: number;
  socialPostsPublished?: number;
  chatbotConversations: number;
  chatbotResolved: number;
  automationRuns?: number;
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

// ─── Support ──────────────────────────────────────────────────────────────────

export type TicketType =
  | "general"
  | "technical"
  | "billing"
  | "website"
  | "social"
  | "chatbot";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface SupportTicket {
  id: string;
  clientId: string;
  subject: string;
  message: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  aiResponse?: string | null;
  resolvedAt?: Date | null;
  createdAt: Date;
}

// ─── Agent System ─────────────────────────────────────────────────────────────

export type AgentType =
  | "SCRAPER"
  | "ANALYZER"
  | "BUILDER"
  | "OUTREACH"
  | "CHATBOT"
  | "QA"
  | "SOCIAL";

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
  logs?: AgentLog[] | null;
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

// ─── Platform Metrics ─────────────────────────────────────────────────────────

export interface PlatformMetric {
  id: string;
  date: Date;
  metric: string;
  value: number;
  metadata?: Record<string, unknown> | null;
}

// ─── Service Types ────────────────────────────────────────────────────────────

export type ServiceType =
  | "WEBSITE"
  | "SEO"
  | "SOCIAL_MEDIA"
  | "CHATBOT"
  | "EMAIL_MARKETING"
  | "AUTOMATION"
  | "REPUTATION_MANAGEMENT"
  | "ADS"
  | "CONTENT";

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
  planId: string;
  setupFee: string;
}

export interface PlanConfig {
  id: ClientPlan;
  name: string;
  monthlyAmount: number;
  setupFee: number;
  stripePriceId: string;
  limits: PlanLimits;
}

export interface PlanLimits {
  maxWebsites: number;
  maxAutomations: number;
  maxChatbots: number;
  maxLeadsPerMonth: number;
  maxSocialPostsPerMonth: number;
  aiAgentsEnabled: boolean;
  prioritySupport: boolean;
}
