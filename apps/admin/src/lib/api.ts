const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.madecreative.pro";

// ─── Token Management ──────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_access_token");
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("mc_access_token", accessToken);
  localStorage.setItem("mc_refresh_token", refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem("mc_access_token");
  localStorage.removeItem("mc_refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("mc_refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/admin/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const json = (await res.json()) as ApiResponse<{ accessToken: string; expiresIn: number }>;
    localStorage.setItem("mc_access_token", json.data.accessToken);
    return json.data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

// ─── Fetch Wrapper ─────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    signal: options.signal ?? AbortSignal.timeout(15_000),
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Types ─────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface LoginData {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string };
}

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

export interface Prospect {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  website: string | null;
  country: string;
  city: string | null;
  sector: string;
  leadScore: number;
  status: ProspectStatus;
  painPoints: unknown[];
  suggestedServices: unknown[];
  aiAnalysis: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectFilters {
  search?: string;
  country?: string;
  sector?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AgentType =
  | "SCRAPER"
  | "ANALYZER"
  | "BUILDER"
  | "OUTREACH"
  | "QA";

export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface AgentJob {
  id: string;
  agentType: AgentType;
  status: JobStatus;
  progress: number | null;
  prospectId: string | null;
  clientId: string | null;
  input: unknown;
  output: unknown;
  error: string | null;
  durationMs: number | null;
  costEur: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentJobFilters {
  agentType?: AgentType;
  status?: JobStatus;
  page?: number;
  limit?: number;
}

// ─── Dashboard Metrics (matches GET /admin/metrics) ───────────

export interface DashboardMetrics {
  clients: {
    total: number;
    active: number;
    newThisMonth: number;
    newLastMonth: number;
    growth: number;
  };
  revenue: {
    mrr: number;
    monthlyRevenue: number;
  };
  prospects: {
    total: number;
    newThisMonth: number;
    converted: number;
    conversionRate: number;
  };
  agents: {
    queued: number;
    running: number;
    completed: number;
    failed: number;
  };
}

// ─── Revenue Chart (matches GET /admin/metrics/revenue-chart) ─

export interface RevenueChartEntry {
  month: string;
  revenue: number;
  clients: number;
}

// ─── Prospects Funnel (GET /admin/metrics/prospects-funnel) ────

export interface FunnelEntry {
  status: string;
  count: number;
}

// ─── Pipeline (GET /admin/prospects/pipeline) ─────────────────

export interface PipelineProspect {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  country: string;
  sector: string;
  leadScore: number;
  status: string;
  lastContactedAt: string | null;
  repliedAt: string | null;
  convertedAt: string | null;
  outreachEmails: unknown[];
}

export interface PipelineData {
  columns: Record<string, { prospects: PipelineProspect[]; count: number }>;
  totals: { total: number; converted: number; conversionRate: number };
}

// ─── Client (GET /admin/clients) ──────────────────────────────

export interface Client {
  id: string;
  email: string;
  companyName: string;
  contactName: string | null;
  country: string;
  city: string | null;
  sector: string;
  plan: string;
  status: string;
  language: string;
  websiteUrl: string | null;
  stripeCustomerId: string | null;
  stripeSubId: string | null;
  createdAt: string;
}

// ─── Auth ──────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<LoginData> {
  const res = await apiFetch<ApiResponse<LoginData>>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setTokens(res.data.accessToken, res.data.refreshToken);
  return res.data;
}

export function logout(): void {
  clearTokens();
}

// ─── Metrics ──────────────────────────────────────────────────

export async function getMetrics(): Promise<DashboardMetrics> {
  const res = await apiFetch<ApiResponse<DashboardMetrics>>("/admin/metrics");
  return res.data;
}

export async function getRevenueChart(): Promise<RevenueChartEntry[]> {
  const res = await apiFetch<ApiResponse<RevenueChartEntry[]>>("/admin/metrics/revenue-chart");
  return res.data;
}

export async function getProspectsFunnel(): Promise<FunnelEntry[]> {
  const res = await apiFetch<ApiResponse<FunnelEntry[]>>("/admin/metrics/prospects-funnel");
  return res.data;
}

// ─── Prospects ─────────────────────────────────────────────────

export async function getProspects(
  filters: ProspectFilters = {}
): Promise<PaginatedResponse<Prospect>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  const res = await apiFetch<ApiResponse<PaginatedResponse<Prospect>>>(
    `/admin/prospects?${params.toString()}`
  );
  return res.data;
}

export async function getProspectById(id: string): Promise<Prospect> {
  const res = await apiFetch<ApiResponse<Prospect>>(`/admin/prospects/${id}`);
  return res.data;
}

export async function updateProspect(id: string, data: Partial<Prospect>): Promise<Prospect> {
  const res = await apiFetch<ApiResponse<Prospect>>(`/admin/prospects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data;
}

// ─── Pipeline ─────────────────────────────────────────────────

export async function getPipeline(): Promise<PipelineData> {
  const res = await apiFetch<ApiResponse<PipelineData>>("/admin/prospects/pipeline");
  return res.data;
}

// ─── Agent Jobs ────────────────────────────────────────────────

export async function getAgentJobs(
  filters: AgentJobFilters = {}
): Promise<PaginatedResponse<AgentJob>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const res = await apiFetch<ApiResponse<PaginatedResponse<AgentJob>>>(
    `/admin/agents/jobs?${params.toString()}`
  );
  return res.data;
}

export async function getAgentJobById(id: string): Promise<AgentJob> {
  const res = await apiFetch<ApiResponse<AgentJob>>(`/admin/agents/jobs/${id}`);
  return res.data;
}

export async function getAgentStats(): Promise<Record<string, { total: number; byStatus: Record<string, number> }>> {
  const res = await apiFetch<ApiResponse<{ byStatus: { status: string; _count: number }[]; byType: { agentType: string; _count: number }[]; recentCost: unknown }>>("/admin/agents/stats");
  const result: Record<string, { total: number; byStatus: Record<string, number> }> = {};
  for (const entry of res.data.byType ?? []) {
    result[entry.agentType] = { total: entry._count, byStatus: {} };
  }
  for (const entry of res.data.byStatus ?? []) {
    // Fill in status info
    if (!result[entry.status]) {
      result[entry.status] = { total: entry._count, byStatus: {} };
    }
  }
  return result;
}

export async function cancelJob(jobId: string): Promise<void> {
  await apiFetch(`/admin/agents/jobs/${jobId}`, { method: "DELETE" });
}

// ─── Clients ──────────────────────────────────────────────────

export async function getClients(
  filters: { search?: string; status?: string; page?: number; limit?: number } = {}
): Promise<PaginatedResponse<Client>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const res = await apiFetch<ApiResponse<PaginatedResponse<Client>>>(
    `/admin/clients?${params.toString()}`
  );
  return res.data;
}

export async function getClientById(id: string): Promise<Client> {
  const res = await apiFetch<ApiResponse<Client>>(`/admin/clients/${id}`);
  return res.data;
}

// ─── Actions ──────────────────────────────────────────────────

export async function bulkAnalyze(): Promise<{ queued: number }> {
  const res = await apiFetch<ApiResponse<{ queued: number }>>("/admin/agents/bulk-analyze", {
    method: "POST",
  });
  return res.data;
}

export async function startScrape(config: {
  query: string;
  location: string;
  country: string;
  sector: string;
  maxResults?: number;
}): Promise<unknown> {
  const res = await apiFetch<ApiResponse<unknown>>("/admin/prospects/scrape/start", {
    method: "POST",
    body: JSON.stringify(config),
  });
  return res.data;
}

export async function buildPreview(prospectId: string): Promise<unknown> {
  const res = await apiFetch<ApiResponse<unknown>>(`/admin/prospects/${prospectId}/build-preview`, {
    method: "POST",
  });
  return res.data;
}

export async function sendOutreach(prospectId: string): Promise<unknown> {
  const res = await apiFetch<ApiResponse<unknown>>(`/admin/prospects/${prospectId}/send-outreach`, {
    method: "POST",
  });
  return res.data;
}

export async function generatePaymentLink(prospectId: string): Promise<{ checkoutUrl: string; expiresAt: string }> {
  const res = await apiFetch<ApiResponse<{ checkoutUrl: string; expiresAt: string }>>(`/admin/prospects/${prospectId}/generate-payment-link`, {
    method: "POST",
  });
  return res.data;
}
